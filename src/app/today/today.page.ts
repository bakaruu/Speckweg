import { Component, computed, effect, inject, OnInit, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DiaryRow, DiaryService } from '../core/diary/diary.service';
import { BalanceCard } from '../core/energy/balance-card';
import { CreatineCard } from '../core/supplements/creatine-card';
import { MenuService } from '../core/menu/menu.service';
import { SettingsService } from '../core/settings/settings.service';
import { isoDate, MEAL_SLOTS, optionsFor, pickMeal, proteinTargetG, totals } from '../planner/daily-plan';
import { MealIdea, MealSlot } from '../planner/meal-catalog';
import { foodGrams, macrosFor, parseGrams } from '../planner/portions';
import { ContainersService } from '../core/containers/containers.service';
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
  /** Gramos de comida escritos (o la ración habitual del plato al abrir). */
  grams: number;
  /** Recipiente con el que se ha pesado, si se ha pesado con el plato puesto. */
  containerId?: string;
  /** Lo que marca la báscula con el recipiente. */
  scaleGrams?: number;
}

@Component({
  selector: 'app-today-page',
  imports: [RouterLink, BalanceCard, CreatineCard, WorkoutsCard, MonthCalendar],
  templateUrl: './today.page.html',
  styleUrl: './today.page.scss',
})
export class TodayPage implements OnInit {
  private readonly settings = inject(SettingsService);
  private readonly diary = inject(DiaryService);
  private readonly menu = inject(MenuService);
  protected readonly containers = inject(ContainersService);
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
  protected readonly formContainer = computed(() => {
    const id = this.form()?.containerId;
    return id ? this.containers.list().find((c) => c.id === id) : undefined;
  });
  protected readonly formPreview = computed(() => {
    const f = this.form();
    const meal = this.formMeal();
    if (!f || !meal) {
      return undefined;
    }
    const container = this.formContainer();
    const grams = container ? foodGrams(f.scaleGrams ?? NaN, container.grams) : f.grams;
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
    void this.containers.load();
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
      const [meals, workouts, energy, creatine] = await Promise.all([
        this.diary.datesWithEntries(),
        this.training.workoutDates(),
        this.settings.getEnergyLog(),
        this.settings.getCreatineDays(),
      ]);
      this.marked.set(
        new Set([...meals, ...workouts, ...energy.map((e) => e.date), ...creatine]),
      );
    }
  }

  protected another(slot: MealSlot): void {
    this.shifts.update((s) => ({ ...s, [slot]: s[slot] + 1 }));
  }

  protected openLog(slot: MealSlot, meal: MealIdea): void {
    this.error.set(null);
    this.form.set({ slot, mealId: meal.id, grams: meal.portionG });
  }

  protected closeLog(): void {
    this.form.set(null);
  }

  /** Al cambiar de plato se proponen los gramos de su ración habitual. */
  protected chooseMeal(mealId: string): void {
    this.form.update((f) => {
      const meal = f ? this.optionsFor(f.slot).find((m) => m.id === mealId) : undefined;
      return f ? { ...f, mealId, grams: meal?.portionG ?? f.grams } : f;
    });
  }

  protected typeGrams(value: string): void {
    const grams = parseGrams(value);
    this.form.update((f) => (f ? { ...f, grams } : f));
  }

  /** Recipiente con el que se pesa; vacío = sin recipiente (o con tara). */
  protected chooseContainer(containerId: string | undefined): void {
    this.form.update((f) => (f ? { ...f, containerId, scaleGrams: undefined } : f));
  }

  protected typeScale(value: string): void {
    const scaleGrams = parseGrams(value);
    this.form.update((f) => (f ? { ...f, scaleGrams } : f));
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
