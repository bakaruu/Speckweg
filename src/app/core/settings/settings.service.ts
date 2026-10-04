import { Injectable } from '@angular/core';
import { load, Store } from '@tauri-apps/plugin-store';

/** Ajustes locales (settings.json en la carpeta de datos de la app). */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private store?: Promise<Store>;

  private open(): Promise<Store> {
    this.store ??= load('settings.json', { defaults: {}, autoSave: true });
    return this.store;
  }

  async getHevyApiKey(): Promise<string | undefined> {
    return (await this.open()).get<string>('hevyApiKey');
  }

  async setHevyApiKey(key: string): Promise<void> {
    const store = await this.open();
    await store.set('hevyApiKey', key.trim());
    // Guardado explícito en disco, sin depender del autoguardado diferido.
    await store.save();
  }
}
