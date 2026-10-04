import { Injectable, inject } from '@angular/core';
import { fetch } from '@tauri-apps/plugin-http';
import { SettingsService } from '../core/settings/settings.service';

const BASE_URL = 'https://api.hevyapp.com/v1';
/** Máximo que admite la API por página. */
const PAGE_SIZE = 10;

export interface HevySet {
  index: number;
  type: 'normal' | 'warmup' | 'dropset' | 'failure';
  weight_kg: number | null;
  reps: number | null;
  distance_meters: number | null;
  duration_seconds: number | null;
  rpe: number | null;
}

export interface HevyExercise {
  index: number;
  title: string;
  notes?: string | null;
  exercise_template_id?: string;
  superset_id?: number | null;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  updated_at: string;
  created_at?: string;
  exercises: HevyExercise[];
  /** Kcal activas del Apple Watch durante el entreno. No viene de Hevy: lo añade Speckweg. */
  watch_kcal?: number;
}

export type HevyWorkoutEvent =
  { type: 'updated'; workout: HevyWorkout } | { type: 'deleted'; id: string; deleted_at: string };

/**
 * Cliente de la API pública de Hevy (requiere Hevy Pro).
 * Docs: https://api.hevyapp.com/docs/
 * Todo lo que dependa de la forma de la API debe quedarse aquí, por si Hevy la cambia.
 * Usa el fetch de Tauri (no el del navegador) para evitar problemas de CORS.
 */
@Injectable({ providedIn: 'root' })
export class HevyClient {
  private readonly settings = inject(SettingsService);

  /** Comprueba que una API key es válida devolviendo cuántos entrenos hay en la cuenta. */
  async countWorkouts(apiKey?: string): Promise<number> {
    const body = await this.get<{ workout_count: number }>('/workouts/count', apiKey);
    return body.workout_count;
  }

  /**
   * Entrenos creados, cambiados o borrados desde `since` (ISO 8601), recorriendo todas las páginas.
   * Con `since` en 1970 devuelve todo el historial.
   */
  async workoutEventsSince(since: string): Promise<HevyWorkoutEvent[]> {
    const events: HevyWorkoutEvent[] = [];
    for (let page = 1; ; page++) {
      const query = `page=${page}&pageSize=${PAGE_SIZE}&since=${encodeURIComponent(since)}`;
      const body = await this.get<{ page_count: number; events: HevyWorkoutEvent[] }>(
        `/workouts/events?${query}`,
        undefined,
        // Hevy responde 404 cuando no hay nada nuevo.
        { page_count: 0, events: [] },
      );
      events.push(...body.events);
      if (page >= body.page_count) {
        return events;
      }
    }
  }

  private async get<T>(path: string, apiKey?: string, onNotFound?: T): Promise<T> {
    const key = apiKey ?? (await this.settings.getHevyApiKey());
    if (!key) {
      throw new Error('Falta la API key de Hevy. Añádela en Ajustes.');
    }
    const response = await fetch(`${BASE_URL}${path}`, {
      headers: { 'api-key': key, accept: 'application/json' },
    });
    if (response.status === 401) {
      throw new Error('Hevy ha rechazado la API key.');
    }
    if (response.status === 404 && onNotFound !== undefined) {
      return onNotFound;
    }
    if (!response.ok) {
      throw new Error(`Hevy respondió ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }
}
