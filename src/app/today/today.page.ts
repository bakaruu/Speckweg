import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiaryRow, DiaryService } from '../core/diary/diary.service';
import { MenuService } from '../core/menu/menu.service';
import { SettingsService } from '../core/settings/settings.service';
import { isoDate, MEAL_SLOTS, optionsFor, pickMeal, proteinTargetG, totals } from '../planner/daily-plan';
import { MealIdea, MealSlot } from '../planner/meal-catalog';
import { Amount, gramsFor, macrosFor, PORTION_SIZES } from '../planner/portions';
import { WorkoutsCard } from '../training/workouts-card';

const SLOT_LABELS: Record<MealSlot, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  merienda: 'Merienda',
  cena: 'Cena',
};

/** Formulario abierto para apuntar una comida. */
interface LogForm {
  slot: MealSlot;
  mealId: string;
  amount: Amount;
}

@Component({
  selector: 'app-today-page',
  imports: [RouterLink, WorkoutsCard],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
})
export class TodayPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly diary = inject(DiaryService);
  private readonly menu = inject(MenuService);

  protected readonly today = new Date();
  protected readonly dateLabel = capitalize(
    new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
      this.today,
    ),
  );
  protected readonly slotLabels = SLOT_LABELS;
  protected readonly portionSizes = PORTION_SIZES;
  protected readonly optionsFor = (slot: MealSlot): MealIdea[] => optionsFor(slot, this.menu.meals());

  protected readonly weightKg = signal<number | undefined>(undefined);
  /** Cuántas veces se ha pedido "otra sugerencia" para cada comida. */
  private readonly shifts = signal<Record<MealSlot, number>>({ desayuno: 0, comida: 0, merienda: 0, cena: 0 });

  protected readonly meals = computed(() =>
    MEAL_SLOTS.flatMap((slot) => {
      const meal = pickMeal(this.today, slot, this.shifts()[slot], this.menu.meals());
      return meal ? [{ slot, meal }] : [];
    }),
  );
  protected readonly total = computed(() => totals(this.meals().map((m) => m.meal)));
  protected readonly proteinTarget = computed(() => proteinTargetG(this.weightKg()));
  protected readonly proteinPct = computed(() =>
    Math.min(100, Math.round((this.total().proteinG / this.proteinTarget()) * 100)),
  );

  protected readonly entries = signal<DiaryRow[]>([]);
  protected readonly eaten = computed(() =>
    this.entries().reduce((acc, e) => ({ kcal: acc.kcal + e.kcal, proteinG: acc.proteinG + e.proteinG }), {
      kcal: 0,
      proteinG: 0,
    }),
  );
  protected readonly eatenPct = computed(() =>
    Math.min(100, Math.round((this.eaten().proteinG / this.proteinTarget()) * 100)),
  );

  protected readonly form = signal<LogForm | null>(null);
  protected readonly formMeal = computed(() => {
    const f = this.form();
    return f ? this.optionsFor(f.slot).find((m) => m.id === f.mealId) : undefined;
  });
  protected readonly formPreview = computed(() => {
    const f = this.form();
    const meal = this.formMeal();
    if (!f || !meal) {
      return undefined;
    }
    const grams = gramsFor(meal, f.amount);
    return grams > 0 ? { grams, ...macrosFor(meal, grams) } : undefined;
  });
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    void this.menu.load();
    this.weightKg.set(await this.settings.getWeightKg());
    await this.loadEntries();
  }

  protected another(slot: MealSlot): void {
    this.shifts.update((s) => ({ ...s, [slot]: s[slot] + 1 }));
  }

  protected openLog(slot: MealSlot, meal: MealIdea): void {
    this.error.set(null);
    this.form.set({ slot, mealId: meal.id, amount: { kind: 'size', size: 'normal' } });
  }

  protected closeLog(): void {
    this.form.set(null);
  }

  protected chooseMeal(mealId: string): void {
    this.form.update((f) => (f ? { ...f, mealId } : f));
  }

  protected chooseAmount(amount: Amount): void {
    this.form.update((f) => (f ? { ...f, amount } : f));
  }

  protected typeGrams(value: string): void {
    const grams = Number(value.replace(',', '.'));
    if (value.trim() === '') {
      this.chooseAmount({ kind: 'size', size: 'normal' });
    } else if (grams > 0) {
      this.chooseAmount({ kind: 'grams', grams });
    }
  }

  /** Lo que ocupa una ración a ojo, para mostrarlo en el botón. */
  protected sizeKcal(meal: MealIdea, size: (typeof PORTION_SIZES)[number]['size']): number {
    return macrosFor(meal, gramsFor(meal, { kind: 'size', size })).kcal;
  }

  protected async saveLog(): Promise<void> {
    const meal = this.formMeal();
    const preview = this.formPreview();
    if (!meal || !preview) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.diary.logMeal(isoDate(this.today), meal, preview.grams);
      this.form.set(null);
      await this.loadEntries();
    } catch (e) {
      this.error.set(`No se pudo apuntar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.saving.set(false);
    }
  }

  protected async removeEntry(id: number): Promise<void> {
    await this.diary.remove(id);
    await this.loadEntries();
  }

  private async loadEntries(): Promise<void> {
    try {
      this.entries.set(await this.diary.entriesFor(isoDate(this.today)));
    } catch (e) {
      this.error.set(`No se pudo leer el diario: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
