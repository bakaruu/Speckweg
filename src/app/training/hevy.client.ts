import { Injectable, inject } from '@angular/core';
import { fetch } from '@tauri-apps/plugin-http';
import { SettingsService } from '../core/settings/settings.service';

const BASE_URL = 'https://api.hevyapp.com/v1';

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

  private async get<T>(path: string, apiKey?: string): Promise<T> {
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
    if (!response.ok) {
      throw new Error(`Hevy respondió ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }
}
