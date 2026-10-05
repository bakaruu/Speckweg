import { Injectable, signal } from '@angular/core';
import { getName, getVersion } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';

export type UpdateStatus = 'idle' | 'checking' | 'up-to-date' | 'available' | 'error';

/** Cada cuánto se vuelve a mirar si hay versión nueva mientras la app está abierta. */
const RECHECK_MS = 30 * 60 * 1000;

/**
 * Busca versiones nuevas al abrir la app y cada 30 minutos (Releases de GitHub: la normal mira la
 * última versión final y la Beta mira la release "beta"). La firma de cada actualización se
 * comprueba con la clave pública de tauri.conf.json.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  readonly appName = signal('Speckweg');
  readonly version = signal<string | null>(null);
  readonly status = signal<UpdateStatus>('idle');
  readonly available = signal<Update | null>(null);
  readonly installing = signal(false);
  readonly error = signal<string | null>(null);
  readonly lastCheck = signal<Date | null>(null);

  private started = false;

  async init(): Promise<void> {
    if (this.started) {
      return;
    }
    this.started = true;
    try {
      this.appName.set(await getName());
      this.version.set(await getVersion());
    } catch {
      // Fuera de Tauri (p. ej. en el navegador con ng serve) no hay nombre ni actualizaciones.
      return;
    }
    await this.checkNow();
    setInterval(() => void this.checkNow(), RECHECK_MS);
  }

  /** Comprueba si hay versión nueva. El resultado (o el error) queda en `status` y `error`. */
  async checkNow(): Promise<void> {
    if (this.status() === 'checking' || this.installing()) {
      return;
    }
    this.status.set('checking');
    this.error.set(null);
    try {
      const update = await check();
      this.available.set(update);
      this.status.set(update ? 'available' : 'up-to-date');
    } catch (e) {
      this.error.set(errorText(e));
      this.status.set('error');
    } finally {
      this.lastCheck.set(new Date());
    }
  }

  async install(): Promise<void> {
    const update = this.available();
    if (!update) {
      return;
    }
    this.installing.set(true);
    this.error.set(null);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch (e) {
      this.error.set(errorText(e));
      this.installing.set(false);
    }
  }
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
