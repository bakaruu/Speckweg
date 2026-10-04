import { Injectable, signal } from '@angular/core';
import { getName } from '@tauri-apps/api/app';
import { relaunch } from '@tauri-apps/plugin-process';
import { check, Update } from '@tauri-apps/plugin-updater';

/**
 * Busca versiones nuevas al abrir la app (Releases de GitHub: la normal mira la última versión
 * final y la Beta mira la release "beta"). La firma de cada actualización se comprueba con la
 * clave pública de tauri.conf.json.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  readonly appName = signal('Speckweg');
  readonly available = signal<Update | null>(null);
  readonly installing = signal(false);
  readonly error = signal<string | null>(null);

  async init(): Promise<void> {
    try {
      this.appName.set(await getName());
    } catch {
      // Fuera de Tauri (p. ej. en el navegador con ng serve) no hay nombre ni actualizaciones.
      return;
    }
    try {
      this.available.set(await check());
    } catch (e) {
      // Sin internet o sin Releases todavía: no molestamos, se volverá a mirar al abrir la app.
      console.warn('No se pudo comprobar si hay actualizaciones', e);
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
      this.error.set(e instanceof Error ? e.message : String(e));
      this.installing.set(false);
    }
  }
}
