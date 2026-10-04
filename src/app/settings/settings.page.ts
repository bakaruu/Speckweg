import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../core/settings/settings.service';
import { PROTEIN_G_PER_KG, proteinTargetG } from '../planner/daily-plan';
import { HevyClient } from '../training/hevy.client';
import { TrainingService } from '../training/training.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule],
  template: `
    <h1>Ajustes</h1>
    <section class="card">
      <h2>Tus datos</h2>
      <p>Con tu peso calculamos la proteína diaria recomendada ({{ proteinPerKg }} g por kg).</p>
      <label>
        Peso (kg)
        <input type="number" min="30" max="250" step="0.1" [(ngModel)]="weightKg" />
      </label>
      <button (click)="saveWeight()" [disabled]="!weightKg()">Guardar peso</button>
      @if (weightMessage(); as m) {
        <p>{{ m }}</p>
      }
    </section>
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
  `,
})
export class SettingsPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly hevy = inject(HevyClient);
  private readonly training = inject(TrainingService);

  protected readonly apiKey = signal('');
  protected readonly proteinPerKg = PROTEIN_G_PER_KG;
  protected readonly weightKg = signal<number | null>(null);
  protected readonly weightMessage = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);
  protected readonly importing = signal(false);
  protected readonly importMessage = signal<{ text: string; error: boolean } | null>(null);

  async ngOnInit(): Promise<void> {
    // Es un signal para que la pantalla se actualice al terminar de leer el ajuste (la app no usa zone.js).
    this.apiKey.set((await this.settings.getHevyApiKey()) ?? '');
    this.weightKg.set((await this.settings.getWeightKg()) ?? null);
  }

  protected async saveWeight(): Promise<void> {
    const kg = Number(this.weightKg());
    if (!(kg > 0)) {
      return;
    }
    await this.settings.setWeightKg(kg);
    this.weightMessage.set(`Guardado. Tu objetivo de proteína es ${proteinTargetG(kg)} g al día.`);
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
