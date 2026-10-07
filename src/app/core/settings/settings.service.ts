import { Injectable } from '@angular/core';
import { load, Store } from '@tauri-apps/plugin-store';
import { isoDate } from '../../planner/daily-plan';
import { EnergyDay } from '../energy/energy';
import { addWeight, Profile, WeightEntry } from '../profile/body';

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

  /** Peso actual: el último del histórico (a mano o de Salud). */
  async getWeightKg(): Promise<number | undefined> {
    const log = await this.getWeightLog();
    return log.at(-1)?.kg ?? (await this.open()).get<number>('weightKg');
  }

  /** Apunta el peso de hoy a mano. */
  async setWeightKg(kg: number): Promise<void> {
    await this.addWeights([{ date: isoDate(new Date()), kg, source: 'manual' }]);
  }

  async getWeightLog(): Promise<WeightEntry[]> {
    return (await (await this.open()).get<WeightEntry[]>('weightLog')) ?? [];
  }

  /** Añade pesos al histórico (uno por día; el nuevo sustituye al de ese día). */
  async addWeights(entries: WeightEntry[]): Promise<void> {
    const store = await this.open();
    let log = await this.getWeightLog();
    for (const entry of entries) {
      log = addWeight(log, entry);
    }
    await store.set('weightLog', log);
    await store.set('weightKg', log.at(-1)?.kg);
    await store.save();
  }

  async getProfile(): Promise<Profile> {
    return (await (await this.open()).get<Profile>('profile')) ?? {};
  }

  async setProfile(profile: Profile): Promise<void> {
    const store = await this.open();
    await store.set('profile', profile);
    await store.save();
  }

  /** Gasto de cada día según Salud (energía en reposo y en actividad). */
  async getEnergyLog(): Promise<EnergyDay[]> {
    return (await (await this.open()).get<EnergyDay[]>('energyLog')) ?? [];
  }

  async setEnergyLog(log: EnergyDay[]): Promise<void> {
    const store = await this.open();
    await store.set('energyLog', log);
    await store.save();
  }

  /** Días (YYYY-MM-DD) en que se ha tomado la creatina. */
  async getCreatineDays(): Promise<string[]> {
    return (await (await this.open()).get<string[]>('creatineDays')) ?? [];
  }

  async setCreatineDays(days: string[]): Promise<void> {
    const store = await this.open();
    await store.set('creatineDays', [...days].sort());
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
