import { Component, computed, inject, input, OnInit, output, signal } from '@angular/core';
import { DiaryService } from '../../core/diary/diary.service';
import { FoodItem, isBarcode, macrosForGrams, slotForHour } from '../../core/foods/food';
import { OpenFoodFactsClient } from '../../core/foods/open-food-facts.client';
import { MEAL_SLOTS } from '../../planner/daily-plan';
import { MealSlot } from '../../planner/meal-catalog';

/** Buscador de Open Food Facts para apuntar un alimento en una comida del día. */
@Component({
  selector: 'app-food-search',
  templateUrl: './food-search.component.html',
  styleUrl: './food-search.component.scss',
})
export class FoodSearchComponent implements OnInit {
  private readonly off = inject(OpenFoodFactsClient);
  private readonly diary = inject(DiaryService);

  /** Día en el que se apunta (YYYY-MM-DD). */
  readonly date = input.required<string>();
  readonly slotLabels = input.required<Record<MealSlot, string>>();
  readonly logged = output<void>();
  readonly closed = output<void>();

  protected readonly slots = MEAL_SLOTS;
  protected readonly slot = signal<MealSlot>(slotForHour(new Date().getHours()));
  protected readonly query = signal('');
  protected readonly results = signal<FoodItem[] | null>(null);
  protected readonly recent = signal<FoodItem[]>([]);
  protected readonly searching = signal(false);
  protected readonly selected = signal<FoodItem | null>(null);
  protected readonly grams = signal<number>(100);
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected readonly preview = computed(() => {
    const food = this.selected();
    const g = this.grams();
    return food && g > 0 ? macrosForGrams(food, g) : undefined;
  });
  protected readonly isBarcode = computed(() => isBarcode(this.query()));

  async ngOnInit(): Promise<void> {
    try {
      this.recent.set(await this.diary.recentFoods());
    } catch {
      // Sin recientes no pasa nada: se puede buscar igual.
    }
  }

  protected async search(): Promise<void> {
    const text = this.query().trim();
    if (!text || this.searching()) {
      return;
    }
    this.searching.set(true);
    this.error.set(null);
    this.selected.set(null);
    try {
      this.results.set(await this.off.search(text));
    } catch (e) {
      this.results.set(null);
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.searching.set(false);
    }
  }

  protected choose(food: FoodItem): void {
    this.selected.set(food);
    this.grams.set(food.servingG ?? 100);
    this.error.set(null);
  }

  protected typeGrams(value: string): void {
    const g = Number(value.replace(',', '.'));
    this.grams.set(Number.isFinite(g) ? g : 0);
  }

  protected async save(): Promise<void> {
    const food = this.selected();
    const g = this.grams();
    if (!food || !(g > 0)) {
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      await this.diary.logFood(this.date(), this.slot(), food, g);
      this.selected.set(null);
      this.recent.set(await this.diary.recentFoods());
      this.logged.emit();
    } catch (e) {
      this.error.set(`No se pudo apuntar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      this.saving.set(false);
    }
  }
}
