import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isoDate, proteinTargetG } from '../../planner/daily-plan';
import { TrainingService } from '../../training/training.service';
import { DiaryService } from '../diary/diary.service';
import { GOALS, Profile } from '../profile/body';
import { SettingsService } from '../settings/settings.service';
import { balance, EnergyDay, MOVE_GOAL_KCAL, ringFraction } from './energy';

/** Radio de cada anillo, de fuera a dentro: comida, proteína y movimiento. */
const RINGS = [52, 39, 26];

/**
 * Resumen de Hoy al estilo de los anillos del reloj: comida, proteína y movimiento, lo gastado
 * según Salud y lo que queda para el objetivo.
 */
@Component({
  selector: 'app-balance-card',
  imports: [RouterLink],
  template: `
    <section class="card summary">
      <h2>Resumen</h2>

      <div class="top">
        <svg class="rings" viewBox="0 0 128 128" role="img" [attr.aria-label]="ringsLabel()">
          @for (r of rings(); track r.key) {
            <circle class="track" [class]="r.key" cx="64" cy="64" [attr.r]="r.radius" />
            <circle
              class="ring"
              [class]="r.key"
              cx="64"
              cy="64"
              [attr.r]="r.radius"
              [attr.stroke-dasharray]="r.length"
              [attr.stroke-dashoffset]="r.length * (1 - r.fraction)"
            />
          }
        </svg>

        <div class="legend">
          <div>
            <span class="name comida">Comida</span>
            <strong class="comida"
              >{{ n(b().eatenKcal) }}
              @if (b().targetKcal; as t) {
                /{{ n(t) }}
              }
              <small>KCAL</small></strong
            >
          </div>
          <div>
            <span class="name proteina">Proteína</span>
            <strong class="proteina"
              >{{ eatenProteinG() }}/{{ proteinTarget() }} <small>G</small></strong
            >
          </div>
          <div>
            <span class="name movimiento">Movimiento</span>
            <strong class="movimiento"
              >{{ n(b().today?.activeKcal ?? 0) }}/{{ moveGoal }} <small>KCAL</small></strong
            >
          </div>
        </div>

        <div class="big">
          <div>
            <span class="muted">Gastado hoy</span>
            @if (b().today; as t) {
              <strong>{{ n(t.spentKcal) }} <small>kcal</small></strong>
              <span class="muted small"
                >{{ n(t.restingKcal) }} en reposo + {{ n(t.activeKcal) }} en actividad</span
              >
            } @else {
              <strong>—</strong>
            }
          </div>
          <div>
            <span class="muted">Te quedan</span>
            @if (b().remainingKcal !== undefined) {
              <strong [class.over]="b().remainingKcal! < 0"
                >{{ n(b().remainingKcal!) }} <small>kcal</small></strong
              >
            } @else {
              <strong>—</strong>
            }
          </div>
        </div>
      </div>

      @if (b().targetKcal; as target) {
        <p class="small">
          {{ goalLabel() }}: unas {{ n(target) }} kcal al día.
          @if (b().spendSource === 'reloj') {
            Tu gasto medio de la última semana según el reloj es de {{ n(b().dailySpendKcal!) }}
            kcal.
          } @else {
            Es una estimación con tus datos; con unos días del reloj se ajusta a tu gasto real.
          }
        </p>
      } @else {
        <p class="muted small">
          Pon altura, año de nacimiento y sexo en <a routerLink="/ajustes">Ajustes</a> para saber
          cuánto te queda.
        </p>
      }
      @if (!b().today) {
        <p class="muted small">
          Aún no hay gasto de hoy de Salud. Ejecuta el Atajo «Speckweg kcal» (▶) y pulsa
          Sincronizar.
        </p>
      }

      @if (b().yesterday; as y) {
        <p class="small">
          Ayer comiste {{ n(y.eatenKcal) }} kcal y gastaste {{ n(y.spentKcal) }}:
          {{ y.netKcal > 0 ? 'superávit' : 'déficit' }} de {{ n(abs(y.netKcal)) }} kcal.
        </p>
      }
    </section>
  `,
  styles: `
    .summary {
      max-width: 860px;
      margin-bottom: 16px;
      --comida: #fa3c5a;
      --proteina: #8ee000;
      --movimiento: #1ec8f0;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px 28px;
      margin: 12px 0;
    }
    .rings {
      width: 128px;
      height: 128px;
      transform: rotate(-90deg);
      flex: none;
    }
    .rings circle {
      fill: none;
      stroke-width: 11;
      stroke-linecap: round;
    }
    .rings .track {
      opacity: 0.2;
    }
    .rings .ring {
      transition: stroke-dashoffset 0.6s ease;
    }
    .comida {
      color: var(--comida);
      stroke: var(--comida);
    }
    .proteina {
      color: var(--proteina);
      stroke: var(--proteina);
    }
    .movimiento {
      color: var(--movimiento);
      stroke: var(--movimiento);
    }
    .legend {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .legend div,
    .big div {
      display: flex;
      flex-direction: column;
    }
    .legend .name {
      font-size: 0.85rem;
      font-weight: 600;
      color: inherit;
    }
    .legend strong {
      font-size: 1.15rem;
      font-variant-numeric: tabular-nums;
    }
    small {
      font-size: 0.7em;
      font-weight: 600;
    }
    .big {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-left: auto;
    }
    .big strong {
      font-size: 1.6rem;
      color: var(--accent);
      font-variant-numeric: tabular-nums;
    }
    .big strong.over {
      color: var(--comida);
    }
    .small {
      font-size: 0.85rem;
    }
  `,
})
export class BalanceCard {
  private readonly settings = inject(SettingsService);
  private readonly diary = inject(DiaryService);
  private readonly training = inject(TrainingService);

  /** Kcal y proteína apuntadas hoy en el diario (las pasa Hoy para que se actualice al apuntar). */
  readonly eatenKcal = input(0);
  readonly eatenProteinG = input(0);

  protected readonly moveGoal = MOVE_GOAL_KCAL;

  private readonly log = signal<EnergyDay[]>([]);
  private readonly profile = signal<Profile>({});
  private readonly weightKg = signal<number | undefined>(undefined);
  private readonly eatenByDay = signal(new Map<string, number>());

  protected readonly b = computed(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return balance({
      eatenKcal: this.eatenKcal(),
      yesterdayEatenKcal: this.eatenByDay().get(isoDate(yesterday)),
      log: this.log(),
      profile: this.profile(),
      weightKg: this.weightKg(),
    });
  });
  protected readonly proteinTarget = computed(() => proteinTargetG(this.weightKg()));
  protected readonly goalLabel = computed(
    () => GOALS.find((g) => g.goal === this.b().goal)?.label ?? 'Tu objetivo',
  );

  protected readonly rings = computed(() => {
    const values = [
      { key: 'comida', fraction: ringFraction(this.eatenKcal(), this.b().targetKcal) },
      { key: 'proteina', fraction: ringFraction(this.eatenProteinG(), this.proteinTarget()) },
      {
        key: 'movimiento',
        fraction: ringFraction(this.b().today?.activeKcal ?? 0, MOVE_GOAL_KCAL),
      },
    ];
    return values.map((v, i) => ({
      ...v,
      radius: RINGS[i],
      length: 2 * Math.PI * RINGS[i],
    }));
  });
  protected readonly ringsLabel = computed(
    () =>
      `Comida ${this.eatenKcal()} kcal, proteína ${this.eatenProteinG()} g, movimiento ${
        this.b().today?.activeKcal ?? 0
      } kcal`,
  );

  constructor() {
    // Se vuelve a leer cuando la sincronización trae datos nuevos de Salud.
    effect(() => {
      this.training.version();
      void this.load();
    });
  }

  private async load(): Promise<void> {
    this.log.set(await this.settings.getEnergyLog());
    this.profile.set(await this.settings.getProfile());
    this.weightKg.set(await this.settings.getWeightKg());
    const now = new Date();
    const yesterday = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    this.eatenByDay.set(await this.diary.kcalByDay(yesterday, yesterday));
  }

  protected n(kcal: number): string {
    return new Intl.NumberFormat('es-ES').format(Math.round(kcal));
  }

  protected abs(kcal: number): number {
    return Math.abs(kcal);
  }
}
