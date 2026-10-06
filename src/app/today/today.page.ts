import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiaryRow, DiaryService } from '../core/diary/diary.service';
import { BalanceCard } from '../core/energy/balance-card';
import { MenuService } from '../core/menu/menu.service';
import { SettingsService } from '../core/settings/settings.service';
import { isoDate, MEAL_SLOTS, optionsFor, pickMeal, proteinTargetG, totals } from '../planner/daily-plan';
import { MealIdea, MealSlot } from '../planner/meal-catalog';
import { Amount, gramsFor, macrosFor, PORTION_SIZES } from '../planner/portions';
import { TrainingService } from '../training/training.service';
import { WorkoutsCard } from '../training/workouts-card';
import { addDays, startOfDay } from './calendar';
import { MonthCalendar } from './month-calendar';

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
  imports: [RouterLink, BalanceCard, WorkoutsCard, MonthCalendar],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
})
export class TodayPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly diary = inject(DiaryService);
  private readonly menu = inject(MenuService);
  private readonly training = inject(TrainingService);

  /** Día que se está viendo: hoy, o uno anterior elegido con las flechas o el calendario. */
  protected readonly date = signal(startOfDay(new Date()));
  protected readonly todayIso = isoDate(new Date());
  protected readonly dateIso = computed(() => isoDate(this.date()));
  protected readonly isToday = computed(() => this.dateIso() === this.todayIso);
  protected readonly title = computed(() =>
    this.isToday()
      ? 'Hoy'
      : capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'short' }).format(this.date())),
  );
  protected readonly dateLabel = computed(() =>
    capitalize(
      new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(
        this.date(),
      ),
    ),
  );
  protected readonly calendarOpen = signal(false);
  /** Días con comidas, entreno o datos del reloj, para el puntito del calendario. */
  protected readonly marked = signal(new Set<string>());
  protected readonly slotLabels = SLOT_LABELS;
  protected readonly portionSizes = PORTION_SIZES;
  protected readonly optionsFor = (slot: MealSlot): MealIdea[] => optionsFor(slot, this.menu.meals());

  protected readonly weightKg = signal<number | undefined>(undefined);
  /** Cuántas veces se ha pedido "otra sugerencia" para cada comida. */
  private readonly shifts = signal<Record<MealSlot, number>>({ desayuno: 0, comida: 0, merienda: 0, cena: 0 });

  protected readonly meals = computed(() =>
    MEAL_SLOTS.flatMap((slot) => {
      const meal = pickMeal(this.date(), slot, this.shifts()[slot], this.menu.meals());
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

  constructor() {
    // Al cambiar de día: sus comidas, y se cierran el formulario y las sugerencias cambiadas.
    effect(() => {
      this.date();
      untracked(() => {
        this.form.set(null);
        this.shifts.set({ desayuno: 0, comida: 0, merienda: 0, cena: 0 });
        void this.loadEntries();
      });
    });
  }

  async ngOnInit(): Promise<void> {
    void this.menu.load();
    this.weightKg.set(await this.settings.getWeightKg());
  }

  protected moveDay(days: number): void {
    const next = addDays(this.date(), days);
    if (isoDate(next) <= this.todayIso) {
      this.date.set(next);
    }
  }

  protected goToday(): void {
    this.date.set(startOfDay(new Date()));
    this.calendarOpen.set(false);
  }

  protected pickDay(iso: string): void {
    const [y, m, d] = iso.split('-').map(Number);
    this.date.set(new Date(y, m - 1, d));
    this.calendarOpen.set(false);
  }

  protected async toggleCalendar(): Promise<void> {
    const open = !this.calendarOpen();
    this.calendarOpen.set(open);
    if (open) {
      const [meals, workouts, energy] = await Promise.all([
        this.diary.datesWithEntries(),
        this.training.workoutDates(),
        this.settings.getEnergyLog(),
      ]);
      this.marked.set(new Set([...meals, ...workouts, ...energy.map((e) => e.date)]));
    }
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
      await this.diary.logMeal(isoDate(this.date()), meal, preview.grams);
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
      this.entries.set(await this.diary.entriesFor(isoDate(this.date())));
    } catch (e) {
      this.error.set(`No se pudo leer el diario: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
