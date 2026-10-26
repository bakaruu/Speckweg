import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../core/menu/menu.service';
import { MEAL_SLOTS } from '../planner/daily-plan';
import { MealSlot } from '../planner/meal-catalog';
import { Dish, dishTotals, formatNumber, Ingredient, lineAmountLabel, newId } from '../planner/menu-model';

const SLOT_LABELS: Record<MealSlot, string> = {
  desayuno: 'Desayunos',
  comida: 'Comidas',
  merienda: 'Meriendas',
  cena: 'Cenas',
};

/** Borrador de ingrediente: la medida casera va en campos sueltos para poder dejarla vacía. */
interface IngredientDraft {
  id?: string;
  name: string;
  kcal100: number;
  protein100: number;
  measureName: string;
  measureGrams: number | null;
}

@Component({
  selector: 'app-menu-page',
  imports: [FormsModule],
  templateUrl: './menu.page.html',
  styleUrl: './menu.page.scss',
})
export class MenuPage implements OnInit {
  protected readonly menu = inject(MenuService);

  protected readonly slots = MEAL_SLOTS;
  protected readonly slotLabels = SLOT_LABELS;
  protected readonly tab = signal<'platos' | 'ingredientes'>('platos');

  /** Plato que se está editando (copia; no cambia nada hasta Guardar). */
  protected readonly dish = signal<Dish | null>(null);
  protected readonly ingredient = signal<IngredientDraft | null>(null);
  /** Id del plato o ingrediente pendiente de confirmar el borrado. */
  protected readonly confirmDelete = signal<string | null>(null);
  protected readonly confirmReset = signal(false);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  protected readonly formatNumber = formatNumber;
  protected readonly lineAmountLabel = lineAmountLabel;

  async ngOnInit(): Promise<void> {
    await this.menu.load();
  }

  protected dishesFor(slot: MealSlot): Dish[] {
    return this.menu.dishes().filter((d) => d.slot === slot);
  }

  protected totals(dish: Dish) {
    return dishTotals(dish, this.menu.ingredients());
  }

  protected ingredientById(id: string): Ingredient | undefined {
    return this.menu.ingredients().find((i) => i.id === id);
  }

  // Platos

  protected newDish(slot: MealSlot): void {
    this.message.set(null);
    this.dish.set({ id: '', slot, name: '', portion: '1 ración', lines: [] });
    this.addLine();
  }

  protected editDish(dish: Dish): void {
    this.message.set(null);
    this.dish.set(structuredClone(dish));
  }

  protected addLine(): void {
    const first = this.menu.ingredients()[0];
    this.dish()?.lines.push({
      ingredientId: first?.id ?? '',
      amount: first?.measure ? 1 : 100,
      unit: first?.measure ? 'medida' : 'g',
    });
  }

  protected removeLine(index: number): void {
    this.dish()?.lines.splice(index, 1);
  }

  /** Al cambiar de ingrediente, si el nuevo no tiene medida casera, la línea pasa a gramos. */
  protected lineIngredientChanged(index: number): void {
    const line = this.dish()?.lines[index];
    if (line && line.unit === 'medida' && !this.ingredientById(line.ingredientId)?.measure) {
      line.unit = 'g';
      line.amount = 100;
    }
  }

  protected async saveDish(): Promise<void> {
    const draft = this.dish();
    if (!draft) {
      return;
    }
    draft.name = draft.name.trim();
    draft.lines = draft.lines.filter((l) => l.ingredientId && l.amount > 0);
    if (!draft.name || draft.lines.length === 0) {
      this.message.set({ text: 'Ponle un nombre y al menos un ingrediente con cantidad.', error: true });
      return;
    }
    if (!draft.id) {
      draft.id = newId(draft.name, this.menu.dishes().map((d) => d.id));
    }
    await this.run(() => this.menu.saveDish(draft), `Guardado «${draft.name}».`);
    this.dish.set(null);
  }

  protected async duplicateDish(dish: Dish): Promise<void> {
    const copy = await this.menu.duplicateDish(dish.id);
    if (copy) {
      this.editDish(copy);
    }
  }

  protected async deleteDish(dish: Dish): Promise<void> {
    if (this.confirmDelete() !== dish.id) {
      this.confirmDelete.set(dish.id);
      return;
    }
    this.confirmDelete.set(null);
    await this.run(() => this.menu.deleteDish(dish.id), `Borrado «${dish.name}».`);
  }

  // Ingredientes y medidas

  protected newIngredient(): void {
    this.message.set(null);
    this.ingredient.set({ name: '', kcal100: 0, protein100: 0, measureName: '', measureGrams: null });
  }

  protected editIngredient(i: Ingredient): void {
    this.message.set(null);
    this.ingredient.set({
      id: i.id,
      name: i.name,
      kcal100: i.kcal100,
      protein100: i.protein100,
      measureName: i.measure?.name ?? '',
      measureGrams: i.measure?.grams ?? null,
    });
  }

  /** Valores de una medida casera con lo que hay escrito en el borrador. */
  protected perMeasure(d: IngredientDraft): { kcal: number; proteinG: number } | undefined {
    if (!d.measureGrams || d.measureGrams <= 0) {
      return undefined;
    }
    return {
      kcal: Math.round((d.kcal100 * d.measureGrams) / 100),
      proteinG: Math.round((d.protein100 * d.measureGrams) / 10) / 10,
    };
  }

  protected async saveIngredient(): Promise<void> {
    const d = this.ingredient();
    if (!d) {
      return;
    }
    const name = d.name.trim();
    if (!name || d.kcal100 < 0 || d.protein100 < 0) {
      this.message.set({ text: 'Ponle un nombre y valores por 100 g.', error: true });
      return;
    }
    const measureName = d.measureName.trim();
    const ingredient: Ingredient = {
      id: d.id ?? newId(name, this.menu.ingredients().map((i) => i.id)),
      name,
      kcal100: Number(d.kcal100) || 0,
      protein100: Number(d.protein100) || 0,
      measure: measureName && d.measureGrams && d.measureGrams > 0 ? { name: measureName, grams: Number(d.measureGrams) } : undefined,
    };
    // Si se quita la medida casera, los platos que la usaban pasan a gramos con la misma cantidad.
    const old = this.ingredientById(ingredient.id);
    if (old?.measure && !ingredient.measure) {
      for (const dish of this.menu.dishesUsing(ingredient.id)) {
        const lines = dish.lines.map((l) =>
          l.ingredientId === ingredient.id && l.unit === 'medida' ? { ...l, unit: 'g' as const, amount: l.amount * old.measure!.grams } : l,
        );
        await this.menu.saveDish({ ...dish, lines });
      }
    }
    await this.run(() => this.menu.saveIngredient(ingredient), `Guardado «${name}». Los platos que lo usan se han recalculado.`);
    this.ingredient.set(null);
  }

  protected async deleteIngredient(i: Ingredient): Promise<void> {
    const using = this.menu.dishesUsing(i.id);
    if (using.length > 0) {
      this.message.set({
        text: `No se puede borrar «${i.name}»: lo usan ${using.map((d) => d.name).join(', ')}.`,
        error: true,
      });
      return;
    }
    if (this.confirmDelete() !== i.id) {
      this.confirmDelete.set(i.id);
      return;
    }
    this.confirmDelete.set(null);
    await this.run(() => this.menu.deleteIngredient(i.id), `Borrado «${i.name}».`);
  }

  protected async reset(): Promise<void> {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    this.confirmReset.set(false);
    this.dish.set(null);
    this.ingredient.set(null);
    await this.run(() => this.menu.reset(), 'Has vuelto al menú inicial.');
  }

  private async run(action: () => Promise<unknown>, ok: string): Promise<void> {
    try {
      await action();
      this.message.set({ text: ok, error: false });
    } catch (e) {
      this.message.set({ text: `No se pudo guardar: ${e instanceof Error ? e.message : String(e)}`, error: true });
    }
  }
}
