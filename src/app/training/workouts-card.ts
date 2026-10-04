import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../core/settings/settings.service';
import { HevyWorkout } from './hevy.client';
import { TrainingService } from './training.service';
import { describeSets, estimateKcal, summarize } from './workout';

/** Tarjeta de Hoy con el entreno del día traído de Hevy y el botón para sincronizar. */
@Component({
  selector: 'app-workouts-card',
  imports: [RouterLink],
  template: `
    <section class="card workouts">
      <header>
        <h2>Entreno de hoy</h2>
        <div class="sync">
          @if (lastSyncLabel(); as label) {
            <span class="muted">{{ label }}</span>
          }
          <button class="secondary" (click)="sync()" [disabled]="training.syncing() || !hasKey()">
            {{ training.syncing() ? 'Sincronizando…' : 'Sincronizar' }}
          </button>
        </div>
      </header>

      @if (message(); as m) {
        <p [class.error]="m.error" class="small">{{ m.text }}</p>
      }

      @if (!hasKey()) {
        <p class="muted">
          Pon tu API key de Hevy en <a routerLink="/ajustes">Ajustes</a> para ver aquí tus entrenos.
        </p>
      } @else if (today().length === 0) {
        <p class="muted">
          Hoy no hay entreno en Hevy.
          @if (latest(); as w) {
            El último fue «{{ w.title }}» el {{ dayLabel(w) }}.
          }
        </p>
      }

      @for (w of today(); track w.id) {
        <div class="workout">
          <div class="title">
            <strong>{{ w.title }}</strong>
            <span class="muted">{{ timeLabel(w) }}</span>
          </div>
          <div class="stats">
            <span
              ><strong>{{ w.summary.durationMin }}</strong> min</span
            >
            <span
              ><strong>{{ w.summary.sets }}</strong> series</span
            >
            <span
              ><strong>{{ w.summary.volumeKg }}</strong> kg de volumen</span
            >
            <span
              ><strong>~{{ w.kcal }}</strong> kcal</span
            >
          </div>
          <ul>
            @for (e of w.exercises; track e.index) {
              <li>
                <span>{{ e.title }}</span>
                <span class="muted">{{ setsLabel(e) }}</span>
              </li>
            }
          </ul>
        </div>
      }

      @if (today().length > 0) {
        <p class="muted small">Calorías aproximadas según la duración y tu peso; Hevy no las da.</p>
      }
    </section>
  `,
  styles: `
    .workouts {
      max-width: 860px;
      margin-bottom: 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    h2 {
      margin: 0;
      font-size: 1.2rem;
    }
    .sync {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.85rem;
    }
    .small {
      font-size: 0.85rem;
    }
    .workout {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }
    .title {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin: 8px 0;
    }
    .stats strong {
      color: var(--accent);
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    li {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 4px 0;
    }
  `,
})
export class WorkoutsCard {
  protected readonly training = inject(TrainingService);
  private readonly settings = inject(SettingsService);

  protected readonly hasKey = signal(true);
  protected readonly workouts = signal<HevyWorkout[]>([]);
  protected readonly latest = signal<HevyWorkout | undefined>(undefined);
  protected readonly weightKg = signal<number | undefined>(undefined);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly today = computed(() =>
    this.workouts().map((w) => {
      const summary = summarize(w);
      return { ...w, summary, kcal: estimateKcal(summary.durationMin, this.weightKg()) };
    }),
  );
  protected readonly lastSyncLabel = computed(() => {
    const iso = this.training.lastSync();
    if (!iso) {
      return undefined;
    }
    const sameDay = new Date(iso).toDateString() === new Date().toDateString();
    return sameDay
      ? `Actualizado a las ${formatTime(iso)}`
      : `Actualizado el ${new Date(iso).toLocaleDateString('es-ES')}`;
  });
  protected readonly setsLabel = describeSets;

  constructor() {
    // Vuelve a leer de la base de datos cada vez que cambian los entrenos guardados.
    effect(() => {
      this.training.version();
      void this.load();
    });
    void this.start();
  }

  private async start(): Promise<void> {
    this.hasKey.set(!!(await this.settings.getHevyApiKey()));
    this.weightKg.set(await this.settings.getWeightKg());
    try {
      await this.training.syncOnStartup();
    } catch (e) {
      this.message.set({ text: `No se pudo sincronizar con Hevy: ${errorText(e)}`, error: true });
    }
  }

  protected async sync(): Promise<void> {
    this.message.set(null);
    try {
      const changed = await this.training.sync();
      this.message.set({
        text:
          changed === 0
            ? 'Todo al día, no hay entrenos nuevos.'
            : changed === 1
              ? '1 entreno actualizado.'
              : `${changed} entrenos actualizados.`,
        error: false,
      });
    } catch (e) {
      this.message.set({ text: `No se pudo sincronizar con Hevy: ${errorText(e)}`, error: true });
    }
  }

  protected timeLabel(w: HevyWorkout): string {
    return `${formatTime(w.start_time)} – ${formatTime(w.end_time)}`;
  }

  protected dayLabel(w: HevyWorkout): string {
    return new Intl.DateTimeFormat('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date(w.start_time));
  }

  private async load(): Promise<void> {
    try {
      this.workouts.set(await this.training.workoutsOn(new Date()));
      this.latest.set(await this.training.latest());
    } catch (e) {
      this.message.set({ text: `No se pudieron leer los entrenos: ${errorText(e)}`, error: true });
    }
  }
}

function formatTime(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(iso),
  );
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
