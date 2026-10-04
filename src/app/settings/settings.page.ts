import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../core/settings/settings.service';
import { HevyClient } from '../training/hevy.client';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  template: `
    <h1>Ajustes</h1>
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
    </section>
  `,
})
export class SettingsPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly hevy = inject(HevyClient);

  protected readonly apiKey = signal('');
  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  async ngOnInit(): Promise<void> {
    // Es un signal para que la pantalla se actualice al terminar de leer el ajuste (la app no usa zone.js).
    this.apiKey.set((await this.settings.getHevyApiKey()) ?? '');
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
}

function errorText(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}
