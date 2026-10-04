import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../core/settings/settings.service';
import { MEAL_SLOTS, pickMeal, proteinTargetG, totals } from '../planner/daily-plan';
import { MealSlot } from '../planner/meal-catalog';

const SLOT_LABELS: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
};

@Component({
  selector: 'app-today-page',
  imports: [RouterLink],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
})
export class TodayPage implements OnInit {
  private readonly settings = inject(SettingsService);

  protected readonly today = new Date();
  protected readonly dateLabel = capitalize(
    new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
      this.today,
    ),
  );
  protected readonly slotLabels = SLOT_LABELS;

  protected readonly weightKg = signal<number | undefined>(undefined);
  /** Cuántas veces se ha pedido "otra sugerencia" para cada comida. */
  private readonly shifts = signal<Record<MealSlot, number>>({ desayuno: 0, comida: 0, merienda: 0, cena: 0 });

  protected readonly meals = computed(() =>
    MEAL_SLOTS.map((slot) => ({ slot, meal: pickMeal(this.today, slot, this.shifts()[slot]) })),
  );
  protected readonly total = computed(() => totals(this.meals().map((m) => m.meal)));
  protected readonly proteinTarget = computed(() => proteinTargetG(this.weightKg()));
  protected readonly proteinPct = computed(() =>
    Math.min(100, Math.round((this.total().proteinG / this.proteinTarget()) * 100)),
  );

  async ngOnInit(): Promise<void> {
    this.weightKg.set(await this.settings.getWeightKg());
  }

  protected another(slot: MealSlot): void {
    this.shifts.update((s) => ({ ...s, [slot]: s[slot] + 1 }));
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
