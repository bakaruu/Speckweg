import { TestBed } from '@angular/core/testing';
import { SettingsService } from '../core/settings/settings.service';
import { HevyClient } from '../training/hevy.client';
import { SettingsPage } from './settings.page';

describe('SettingsPage', () => {
  it('muestra la API key guardada al abrir la pantalla', async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        { provide: SettingsService, useValue: { getHevyApiKey: () => new Promise((r) => setTimeout(() => r('clave-guardada'), 10)), setHevyApiKey: async () => {}, getWeightKg: async () => undefined, getHealthFilePath: async () => undefined, getProfile: async () => ({}), getWeightLog: async () => [] } },
        { provide: HevyClient, useValue: { countWorkouts: async () => 0 } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    // Como en la app real: nadie fuerza otra detección de cambios, la pantalla debe actualizarse sola.
    await new Promise((r) => setTimeout(r, 100));

    const input = (fixture.nativeElement as HTMLElement).querySelector('input[type=password]') as HTMLInputElement;
    expect(input.value).toBe('clave-guardada');
  });
});
