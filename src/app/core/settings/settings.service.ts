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

  async getWeightKg(): Promise<number | undefined> {
    return (await this.open()).get<number>('weightKg');
  }

  async setWeightKg(kg: number): Promise<void> {
    const store = await this.open();
    await store.set('weightKg', kg);
    await store.save();
  }

  /** Momento (ISO 8601) de la última sincronización correcta con Hevy. */
  async getHevyLastSync(): Promise<string | undefined> {
    return (await this.open()).get<string>('hevyLastSync');
  }

  async setHevyLastSync(iso: string): Promise<void> {
    const store = await this.open();
    await store.set('hevyLastSync', iso);
    await store.save();
  }

  /** Ruta del archivo del Atajo del Apple Watch, si no está en el sitio de siempre de iCloud Drive. */
  async getHealthFilePath(): Promise<string | undefined> {
    return (await this.open()).get<string>('healthFilePath');
  }

  async setHealthFilePath(path: string): Promise<void> {
    const store = await this.open();
    await store.set('healthFilePath', path.trim());
    await store.save();
  }
}
