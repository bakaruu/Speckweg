import { inject, Injectable, signal } from '@angular/core';
import { DatabaseService } from '../core/db/database.service';
import { SettingsService } from '../core/settings/settings.service';
import { HevyClient, HevyWorkout } from './hevy.client';
import { DEFAULT_WEIGHT_KG, estimateKcal, parseHevyCsv, summarize } from './workout';

/** Desde cuándo pedir cambios la primera vez: todo el historial. */
const EPOCH = '1970-01-01T00:00:00Z';

/** Entrenos de Hevy: sincronización con la API, importación de CSV y lectura desde SQLite. */
@Injectable({ providedIn: 'root' })
export class TrainingService {
  private readonly db = inject(DatabaseService);
  private readonly hevy = inject(HevyClient);
  private readonly settings = inject(SettingsService);

  readonly syncing = signal(false);
  readonly lastSync = signal<string | undefined>(undefined);
  /** Sube cada vez que cambian los entrenos guardados, para que las pantallas se refresquen. */
  readonly version = signal(0);

  private startup?: Promise<void>;

  /** Sincroniza una sola vez al abrir la app. Sin API key no hace nada ni da error. */
  async syncOnStartup(): Promise<void> {
    if (!this.startup) {
      this.lastSync.set(await this.settings.getHevyLastSync());
      if (!(await this.settings.getHevyApiKey())) {
        return;
      }
      this.startup ??= this.sync().then(() => undefined);
    }
    return this.startup;
  }

  /** Trae de Hevy lo creado, cambiado o borrado desde la última vez. Devuelve cuántos entrenos han cambiado. */
  async sync(): Promise<number> {
    this.syncing.set(true);
    try {
      // La hora se toma antes de pedir, para no perder lo que se guarde en Hevy mientras tanto.
      const startedAt = new Date().toISOString();
      const since = (await this.settings.getHevyLastSync()) ?? EPOCH;
      const events = await this.hevy.workoutEventsSince(since);
      const weightKg = await this.weightKg();
      for (const event of events) {
        if (event.type === 'updated') {
          await this.save(event.workout, weightKg);
        } else {
          await this.db.execute(`DELETE FROM workout WHERE id = $1`, [event.id]);
        }
      }
      await this.settings.setHevyLastSync(startedAt);
      this.lastSync.set(startedAt);
      if (events.length > 0) {
        this.version.update((v) => v + 1);
      }
      return events.length;
    } finally {
      this.syncing.set(false);
    }
  }

  /** Importa el CSV exportado de Hevy. Se salta los entrenos que ya vinieron por la API. */
  async importCsv(text: string): Promise<{ imported: number; skipped: number }> {
    const workouts = parseHevyCsv(text);
    const weightKg = await this.weightKg();
    let imported = 0;
    for (const workout of workouts) {
      const fromApi = await this.db.select<{ id: string }>(
        `SELECT id FROM workout WHERE id NOT LIKE 'csv:%' AND substr(start_time, 1, 16) = substr($1, 1, 16)`,
        [workout.start_time],
      );
      if (fromApi.length === 0) {
        await this.save(workout, weightKg);
        imported++;
      }
    }
    if (imported > 0) {
      this.version.update((v) => v + 1);
    }
    return { imported, skipped: workouts.length - imported };
  }

  /** Entrenos que empiezan en el día local de `date`, del más antiguo al más reciente. */
  async workoutsOn(date: Date): Promise<HevyWorkout[]> {
    const from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const to = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
    const rows = await this.db.select<{ raw_json: string }>(
      `SELECT raw_json FROM workout WHERE start_time >= $1 AND start_time < $2 ORDER BY start_time`,
      [from.toISOString(), to.toISOString()],
    );
    return rows.map((r) => JSON.parse(r.raw_json) as HevyWorkout);
  }

  /** El último entreno guardado, sea del día que sea. */
  async latest(): Promise<HevyWorkout | undefined> {
    const [row] = await this.db.select<{ raw_json: string }>(
      `SELECT raw_json FROM workout ORDER BY start_time DESC LIMIT 1`,
    );
    return row ? (JSON.parse(row.raw_json) as HevyWorkout) : undefined;
  }

  async weightKg(): Promise<number> {
    return (await this.settings.getWeightKg()) ?? DEFAULT_WEIGHT_KG;
  }

  private async save(raw: HevyWorkout, weightKg: number): Promise<void> {
    // Fechas siempre en UTC con el mismo formato, para poder compararlas como texto.
    const workout = { ...raw, start_time: toIso(raw.start_time), end_time: toIso(raw.end_time) };
    const summary = summarize(workout);
    if (!workout.id.startsWith('csv:')) {
      // Si ese entreno se había importado antes por CSV, se queda solo la versión de la API.
      await this.db.execute(
        `DELETE FROM workout WHERE id LIKE 'csv:%' AND substr(start_time, 1, 16) = substr($1, 1, 16)`,
        [workout.start_time],
      );
    }
    await this.db.execute(
      `INSERT INTO workout (id, title, start_time, end_time, volume_kg, estimated_kcal, raw_json, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         title = excluded.title, start_time = excluded.start_time, end_time = excluded.end_time,
         volume_kg = excluded.volume_kg, estimated_kcal = excluded.estimated_kcal,
         raw_json = excluded.raw_json, updated_at = excluded.updated_at`,
      [
        workout.id,
        workout.title,
        workout.start_time,
        workout.end_time,
        summary.volumeKg,
        estimateKcal(summary.durationMin, weightKg),
        JSON.stringify(workout),
        workout.updated_at,
      ],
    );
  }
}

function toIso(text: string): string {
  const time = Date.parse(text);
  return Number.isNaN(time) ? text : new Date(time).toISOString();
}
