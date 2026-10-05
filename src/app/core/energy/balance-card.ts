import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isoDate } from '../../planner/daily-plan';
import { TrainingService } from '../../training/training.service';
import { DiaryService } from '../diary/diary.service';
import { GOALS, Profile } from '../profile/body';
import { SettingsService } from '../settings/settings.service';
import { balance, EnergyDay } from './energy';

/** Tarjeta de Hoy: kcal comidas frente a gastadas según Salud y lo que queda para el objetivo. */
@Component({
  selector: 'app-balance-card',
  imports: [RouterLink],
  template: `
    <section class="card balance">
      <h2>Balance del día</h2>

      <div class="numbers">
        <div>
          <strong>{{ n(b().eatenKcal) }}</strong
          ><span class="muted">kcal comidas</span>
        </div>
        @if (b().today; as t) {
          <div>
            <strong>{{ n(t.spentKcal) }}</strong
            ><span class="muted"
              >kcal gastadas ({{ n(t.restingKcal) }} en reposo + {{ n(t.activeKcal) }} en
              actividad)</span
            >
          </div>
          <div>
            <strong [class.over]="t.netKcal > 0">{{ signed(t.netKcal) }}</strong
            ><span class="muted">{{ t.netKcal > 0 ? 'superávit' : 'déficit' }} ahora mismo</span>
          </div>
        }
        @if (b().remainingKcal !== undefined) {
          <div>
            <strong [class.over]="b().remainingKcal! < 0">{{ n(b().remainingKcal!) }}</strong
            ><span class="muted">kcal te quedan hoy</span>
          </div>
        }
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
      } @else {
        <p class="muted small">
          El gasto de hoy es el de la última vez que corrió el Atajo y sigue subiendo durante el
          día.
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
    .balance {
      max-width: 860px;
      margin-bottom: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .numbers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin: 12px 0;
    }
    .numbers div {
      display: flex;
      flex-direction: column;
    }
    .numbers strong {
      font-size: 1.3rem;
      color: var(--accent);
    }
    .numbers strong.over {
      color: #c0392b;
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

  /** Kcal apuntadas hoy en el diario (las pasa Hoy para que se actualice al apuntar). */
  readonly eatenKcal = input(0);

  private readonly log = signal<EnergyDay[]>([]);
  private readonly profile = signal<Profile>({});
  private readonly weightKg = signal<number | undefined>(undefined);
  private readonly yesterdayEaten = signal<number | undefined>(undefined);

  protected readonly b = computed(() =>
    balance({
      eatenKcal: this.eatenKcal(),
      yesterdayEatenKcal: this.yesterdayEaten(),
      log: this.log(),
      profile: this.profile(),
      weightKg: this.weightKg(),
    }),
  );
  protected readonly goalLabel = computed(
    () => GOALS.find((g) => g.goal === this.b().goal)?.label ?? 'Tu objetivo',
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
    const entries = await this.diary.entriesFor(yesterday);
    this.yesterdayEaten.set(
      entries.length > 0 ? entries.reduce((sum, e) => sum + e.kcal, 0) : undefined,
    );
  }

  protected n(kcal: number): string {
    return new Intl.NumberFormat('es-ES').format(Math.round(kcal));
  }

  protected signed(kcal: number): string {
    return `${kcal > 0 ? '+' : kcal < 0 ? '−' : ''}${this.n(Math.abs(kcal))}`;
  }

  protected abs(kcal: number): number {
    return Math.abs(kcal);
  }
}
