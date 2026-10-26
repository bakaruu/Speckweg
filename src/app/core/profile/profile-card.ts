import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PROTEIN_G_PER_KG, proteinTargetG } from '../../planner/daily-plan';
import { EnergyDay, targetFor, usualSpend } from '../energy/energy';
import { SettingsService } from '../settings/settings.service';
import { Goal, GOALS, Profile, Sex, WeightEntry } from './body';

/** Ajustes → Tus datos: peso (a mano o de Salud), altura, edad, sexo y objetivo, (la gráfica del peso está en Hoy). */
@Component({
  selector: 'app-profile-card',
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Tus datos</h2>

      <div class="row">
        <label>
          Peso de hoy (kg)
          <input type="number" min="30" max="250" step="0.1" [(ngModel)]="weightInput" />
        </label>
        <button (click)="saveWeight()" [disabled]="!weightInput()">Guardar peso</button>
      </div>
      <p class="muted small">
        Si tu báscula manda el peso a Salud, el Atajo «Speckweg kcal» lo trae solo y no hace falta
        apuntarlo.
      </p>

      <div class="grid">
        <label>
          Altura (cm)
          <input type="number" min="120" max="230" [(ngModel)]="heightCm" />
        </label>
        <label>
          Año de nacimiento
          <input type="number" min="1930" max="2015" [(ngModel)]="birthYear" />
        </label>
        <label>
          Sexo
          <select [(ngModel)]="sex">
            <option value="hombre">Hombre</option>
            <option value="mujer">Mujer</option>
          </select>
        </label>
        <label class="goal">
          Objetivo
          <select [(ngModel)]="goal">
            @for (g of goals; track g.goal) {
              <option [value]="g.goal">{{ g.label }}</option>
            }
          </select>
        </label>
      </div>
      <button (click)="saveProfile()">Guardar datos</button>
      @if (message(); as m) {
        <p>{{ m }}</p>
      }

      @if (current(); as kg) {
        <div class="numbers">
          <div>
            <strong>{{ kg }} kg</strong><span class="muted">peso actual</span>
          </div>
          <div>
            <strong>{{ protein() }} g</strong
            ><span class="muted">proteína al día ({{ proteinPerKg }} g/kg)</span>
          </div>
          @if (kcal(); as k) {
            <div>
              <strong>{{ k.target }} kcal</strong
              ><span class="muted">al día para tu objetivo (un día normal)</span>
            </div>
            <div>
              <strong>{{ k.spend }} kcal</strong
              ><span class="muted">{{
                k.source === 'reloj' ? 'gasto medio de la última semana según el reloj' : 'gasto estimado con tus datos'
              }}</span>
            </div>
          }
        </div>
        @if (!kcal()) {
          <p class="muted small">
            Pon altura, año de nacimiento y sexo para calcular tus kcal diarias.
          </p>
        }
      }

    </section>
  `,
  styles: `
    .row {
      display: flex;
      gap: 12px;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    .row label {
      margin-bottom: 0;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0 12px;
      margin-top: 12px;
    }
    .goal {
      grid-column: 1 / -1;
    }
    .goal select {
      max-width: 340px;
    }
    select {
      padding: 8px;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--bg);
      color: inherit;
    }
    .small {
      font-size: 0.85rem;
    }
    .numbers {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
      margin: 16px 0;
    }
    .numbers div {
      display: flex;
      flex-direction: column;
    }
    .numbers strong {
      font-size: 1.2rem;
      color: var(--accent);
    }
  `,
})
export class ProfileCard implements OnInit {
  private readonly settings = inject(SettingsService);

  protected readonly goals = GOALS;
  protected readonly proteinPerKg = PROTEIN_G_PER_KG;

  protected readonly weightInput = signal<number | null>(null);
  protected readonly heightCm = signal<number | null>(null);
  protected readonly birthYear = signal<number | null>(null);
  protected readonly sex = signal<Sex | null>(null);
  protected readonly goal = signal<Goal>('mantener');
  protected readonly message = signal<string | null>(null);

  protected readonly log = signal<WeightEntry[]>([]);
  private readonly profile = signal<Profile>({});
  private readonly energyLog = signal<EnergyDay[]>([]);

  protected readonly current = computed(() => this.log().at(-1)?.kg);
  protected readonly protein = computed(() => proteinTargetG(this.current()));
  /** Lo mismo que usa el Resumen de Hoy: la media del reloj o, si no hay, la estimación. */
  protected readonly kcal = computed(() => {
    const usual = usualSpend(this.energyLog(), this.profile(), this.current());
    if (!usual) {
      return undefined;
    }
    const goal = this.profile().goal ?? 'mantener';
    return { spend: usual.spendKcal, source: usual.source, target: targetFor(usual.spendKcal, goal) };
  });
  async ngOnInit(): Promise<void> {
    await this.load();
  }

  protected async saveWeight(): Promise<void> {
    const kg = Number(this.weightInput());
    if (!(kg > 0)) {
      return;
    }
    await this.settings.setWeightKg(kg);
    this.weightInput.set(null);
    this.message.set(`Guardado. Tu objetivo de proteína es ${proteinTargetG(kg)} g al día.`);
    await this.load();
  }

  protected async saveProfile(): Promise<void> {
    const profile: Profile = {
      heightCm: Number(this.heightCm()) || undefined,
      birthYear: Number(this.birthYear()) || undefined,
      sex: this.sex() ?? undefined,
      goal: this.goal(),
    };
    await this.settings.setProfile(profile);
    this.profile.set(profile);
    this.message.set('Datos guardados.');
  }

  private async load(): Promise<void> {
    const profile = await this.settings.getProfile();
    this.profile.set(profile);
    this.energyLog.set(await this.settings.getEnergyLog());
    this.heightCm.set(profile.heightCm ?? null);
    this.birthYear.set(profile.birthYear ?? null);
    this.sex.set(profile.sex ?? null);
    this.goal.set(profile.goal ?? 'mantener');
    let log = await this.settings.getWeightLog();
    // Peso guardado antes de que existiera el histórico.
    const old = await this.settings.getWeightKg();
    if (log.length === 0 && old) {
      log = [{ date: 'antes', kg: old, source: 'manual' }];
    }
    this.log.set(log);
  }
}
