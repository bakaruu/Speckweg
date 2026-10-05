import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../core/settings/settings.service';
import { ProfileCard } from '../core/profile/profile-card';
import { UpdateService } from '../core/updates/update.service';
import { HevyClient } from '../training/hevy.client';
import { TrainingService } from '../training/training.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, ProfileCard],
  template: `
    <h1>Ajustes</h1>
    <app-profile-card />
    <section class="card">
      <h2>Hevy</h2>
      <p>Saca tu API key en <strong>hevy.com/settings?developer</strong> (necesita Hevy Pro).</p>
      <label>
        API key
        <input type="password" [(ngModel)]="apiKey" autocomplete="off" />
      </label>
      <button (click)="save()" [disabled]="busy()">Guardar y probar</button>
      @if (message(); as m) {
        <p [class.error]="m.error">{{ m.text }}</p>
      }
      <h3>Importar CSV de Hevy</h3>
      <p>
        Por si la API falla: en Hevy ve a Perfil → Ajustes → Exportar e importar datos → Exportar
        entrenos, y elige aquí el archivo. Los entrenos que ya estén no se duplican.
      </p>
      <input
        type="file"
        accept=".csv,text/csv"
        (change)="importCsv($event)"
        [disabled]="importing()"
      />
      @if (importMessage(); as m) {
        <p [class.error]="m.error">{{ m.text }}</p>
      }
    </section>
    <section class="card">
      <h2>Apple Watch</h2>
      <p>
        Hevy no da las calorías, así que se cogen las del reloj: un Atajo del iPhone guarda cada día la
        energía activa en <strong>iCloud Drive/Speckweg/energia.txt</strong> y Speckweg la lee al abrirse.
        Necesitas iCloud para Windows con iCloud Drive activado. Los pasos para crear el Atajo están en
        docs/atajo-apple-watch.md del repositorio.
      </p>
      <button (click)="readWatch()" [disabled]="watchBusy()">Leer ahora</button>
      @if (watchMessage(); as m) {
        <p [class.error]="m.error">{{ m.text }}</p>
      }
      <label>
        Ruta del archivo (solo si no lo encuentra solo)
        <input [(ngModel)]="healthPath" placeholder="C:\\Users\\…\\iCloudDrive\\…\\energia.txt" />
      </label>
      <button class="secondary" (click)="saveHealthPath()">Guardar ruta</button>
      <p>O elige el archivo a mano:</p>
      <input type="file" accept=".txt,.csv,text/plain" (change)="importEnergy($event)" [disabled]="watchBusy()" />
    </section>
    <section class="card">
      <h2>Actualizaciones</h2>
      <p>
        {{ updates.appName() }} versión <strong>{{ updates.version() ?? '—' }}</strong>.
        Se buscan versiones nuevas al abrir la app y cada 30 minutos.
      </p>
      @switch (updates.status()) {
        @case ('checking') {
          <p>Buscando…</p>
        }
        @case ('up-to-date') {
          <p>Estás en la última versión.</p>
        }
        @case ('available') {
          <p>Hay una versión nueva: <strong>{{ updates.available()?.version }}</strong></p>
          <button (click)="updates.install()" [disabled]="updates.installing()">
            {{ updates.installing() ? 'Actualizando…' : 'Actualizar' }}
          </button>
        }
      }
      @if (updates.error(); as error) {
        <p class="error">No se pudo comprobar o instalar la actualización: {{ error }}</p>
      }
      @if (updates.status() !== 'available') {
        <button class="secondary" (click)="updates.checkNow()" [disabled]="updates.status() === 'checking'">
          Buscar actualizaciones
        </button>
      }
    </section>
  `,
})
export class SettingsPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly hevy = inject(HevyClient);
  private readonly training = inject(TrainingService);
  protected readonly updates = inject(UpdateService);

  protected readonly apiKey = signal('');
  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);
  protected readonly importing = signal(false);
  protected readonly healthPath = signal('');
  protected readonly watchBusy = signal(false);
  protected readonly watchMessage = signal<{ text: string; error: boolean } | null>(null);
  protected readonly importMessage = signal<{ text: string; error: boolean } | null>(null);

  async ngOnInit(): Promise<void> {
    // Es un signal para que la pantalla se actualice al terminar de leer el ajuste (la app no usa zone.js).
    this.apiKey.set((await this.settings.getHevyApiKey()) ?? '');
    this.healthPath.set((await this.settings.getHealthFilePath()) ?? '');
  }

  protected async saveHealthPath(): Promise<void> {
    await this.settings.setHealthFilePath(this.healthPath());
    await this.readWatch();
  }

  protected async readWatch(): Promise<void> {
    await this.watchTask(async () => {
      const result = await this.training.syncWatch();
      if (!result) {
        return {
          text: 'No encuentro el archivo del Atajo en iCloud Drive. Comprueba que el Atajo se ha ejecutado y que iCloud ha terminado de sincronizar, o pon la ruta abajo.',
          error: true,
        };
      }
      return { text: `Leído ${result.path}: ${updatedText(result.updated)}`, error: false };
    });
  }

  protected async importEnergy(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await this.watchTask(async () => ({ text: updatedText(await this.training.applyEnergy(await file.text())), error: false }));
    }
    input.value = '';
  }

  private async watchTask(task: () => Promise<{ text: string; error: boolean }>): Promise<void> {
    this.watchBusy.set(true);
    this.watchMessage.set(null);
    try {
      this.watchMessage.set(await task());
    } catch (e) {
      this.watchMessage.set({ text: `No se pudo leer: ${errorText(e)}`, error: true });
    } finally {
      this.watchBusy.set(false);
    }
  }

  protected async save(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    try {
      // Se guarda antes de probarla, para no tener que volver a pegarla aunque falle la conexión.
      await this.settings.setHevyApiKey(this.apiKey());
    } catch (e) {
      this.message.set({ text: `No se pudo guardar la key: ${errorText(e)}`, error: true });
      this.busy.set(false);
      return;
    }
    try {
      const count = await this.hevy.countWorkouts();
      this.message.set({ text: `Guardada y conectada. Tienes ${count} entrenos en Hevy.`, error: false });
    } catch (e) {
      this.message.set({ text: `Key guardada, pero no se pudo conectar con Hevy: ${errorText(e)}`, error: true });
    } finally {
      this.busy.set(false);
    }
  }

  protected async importCsv(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    this.importing.set(true);
    this.importMessage.set(null);
    try {
      const { imported, skipped } = await this.training.importCsv(await file.text());
      const extra = skipped > 0 ? ` (${skipped} ya estaban)` : '';
      this.importMessage.set({ text: `Importados ${imported} entrenos${extra}.`, error: false });
    } catch (e) {
      this.importMessage.set({ text: `No se pudo importar: ${errorText(e)}`, error: true });
    } finally {
      input.value = '';
      this.importing.set(false);
    }
  }
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function updatedText(updated: number): string {
  return updated === 1 ? '1 entreno con kcal del reloj.' : `${updated} entrenos con kcal del reloj.`;
}
