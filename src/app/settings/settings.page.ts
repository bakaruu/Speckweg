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

  protected apiKey = '';
  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  async ngOnInit(): Promise<void> {
    this.apiKey = (await this.settings.getHevyApiKey()) ?? '';
  }

  protected async save(): Promise<void> {
    this.busy.set(true);
    this.message.set(null);
    try {
      const count = await this.hevy.countWorkouts(this.apiKey.trim());
      await this.settings.setHevyApiKey(this.apiKey);
      this.message.set({ text: `Conectado. Tienes ${count} entrenos en Hevy.`, error: false });
    } catch (e) {
      this.message.set({ text: e instanceof Error ? e.message : String(e), error: true });
    } finally {
      this.busy.set(false);
    }
  }
}
