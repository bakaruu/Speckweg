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
      const body = await this.get<unknown>(
        `/workouts/events?${query}`,
        undefined,
        // Hevy responde 404 cuando no hay nada nuevo.
        { page_count: 0, events: [] },
      );
      const result = readEventsPage(body);
      events.push(...result.events);
      if (page >= result.pageCount) {
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
    // Algunas respuestas sin cambios llegan con el cuerpo vacío.
    const text = await response.text();
    return (text.trim() ? JSON.parse(text) : {}) as T;
  }
}

/**
 * Lee una página de /workouts/events sin fiarse de su forma: sin cambios Hevy puede responder
 * sin `events`, con el cuerpo vacío o con una lista suelta.
 */
export function readEventsPage(body: unknown): { events: HevyWorkoutEvent[]; pageCount: number } {
  if (Array.isArray(body)) {
    return { events: body.filter(isEvent), pageCount: 1 };
  }
  if (!body || typeof body !== 'object') {
    return { events: [], pageCount: 0 };
  }
  const data = body as Record<string, unknown>;
  const list = data['events'] ?? data['workout_events'] ?? data['data'];
  const events = Array.isArray(list) ? list.filter(isEvent) : [];
  const pageCount =
    typeof data['page_count'] === 'number' ? data['page_count'] : events.length > 0 ? 1 : 0;
  return { events, pageCount };
}

function isEvent(value: unknown): value is HevyWorkoutEvent {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const event = value as Record<string, unknown>;
  return (
    (event['type'] === 'updated' && !!event['workout'] && typeof event['workout'] === 'object') ||
    (event['type'] === 'deleted' && typeof event['id'] === 'string')
  );
}
