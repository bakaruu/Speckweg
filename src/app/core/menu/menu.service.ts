import { computed, Injectable, signal } from '@angular/core';
import { load, Store } from '@tauri-apps/plugin-store';
import { DEFAULT_DISHES, DEFAULT_INGREDIENTS } from '../../planner/default-menu';
import { MealIdea } from '../../planner/meal-catalog';
import { Dish, Ingredient, Menu, newId, toMealIdea } from '../../planner/menu-model';

/**
 * Tu menú editable: ingredientes con sus medidas caseras y platos.
 * Se guarda en menu.json, en la carpeta de datos de la app.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private store?: Promise<Store>;
  private loaded?: Promise<void>;

  readonly ingredients = signal<Ingredient[]>(structuredClone(DEFAULT_INGREDIENTS));
  readonly dishes = signal<Dish[]>(structuredClone(DEFAULT_DISHES));
  readonly meals = computed<MealIdea[]>(() => this.dishes().map((d) => toMealIdea(d, this.ingredients())));

  private open(): Promise<Store> {
    this.store ??= load('menu.json', { defaults: {}, autoSave: false });
    return this.store;
  }

  /** Carga el menú guardado (una sola vez). Si no hay nada guardado, se queda el menú inicial. */
  load(): Promise<void> {
    this.loaded ??= (async () => {
      try {
        const saved = await (await this.open()).get<Menu>('menu');
        if (saved?.ingredients && saved?.dishes) {
          this.ingredients.set(saved.ingredients);
          this.dishes.set(saved.dishes);
        }
      } catch {
        // Fuera de la app de escritorio (tests, navegador) no hay almacenamiento: se usa el menú inicial.
      }
    })();
    return this.loaded;
  }

  private async save(): Promise<void> {
    const store = await this.open();
    await store.set('menu', { ingredients: this.ingredients(), dishes: this.dishes() } satisfies Menu);
    await store.save();
  }

  async saveDish(dish: Dish): Promise<void> {
    this.dishes.update((list) => {
      const i = list.findIndex((d) => d.id === dish.id);
      return i >= 0 ? list.map((d) => (d.id === dish.id ? dish : d)) : [...list, dish];
    });
    await this.save();
  }

  async duplicateDish(id: string): Promise<Dish | undefined> {
    const original = this.dishes().find((d) => d.id === id);
    if (!original) {
      return undefined;
    }
    const name = `${original.name} (copia)`;
    const copy: Dish = { ...structuredClone(original), id: newId(name, this.dishes().map((d) => d.id)), name, usual: false };
    this.dishes.update((list) => [...list, copy]);
    await this.save();
    return copy;
  }

  async deleteDish(id: string): Promise<void> {
    this.dishes.update((list) => list.filter((d) => d.id !== id));
    await this.save();
  }

  async saveIngredient(ingredient: Ingredient): Promise<void> {
    this.ingredients.update((list) => {
      const i = list.findIndex((x) => x.id === ingredient.id);
      return i >= 0 ? list.map((x) => (x.id === ingredient.id ? ingredient : x)) : [...list, ingredient];
    });
    await this.save();
  }

  /** Platos que usan un ingrediente: mientras haya alguno, no se puede borrar. */
  dishesUsing(ingredientId: string): Dish[] {
    return this.dishes().filter((d) => d.lines.some((l) => l.ingredientId === ingredientId));
  }

  async deleteIngredient(id: string): Promise<void> {
    if (this.dishesUsing(id).length > 0) {
      throw new Error('Este ingrediente se usa en algún plato');
    }
    this.ingredients.update((list) => list.filter((x) => x.id !== id));
    await this.save();
  }

  /** Vuelve al menú inicial, borrando tus cambios. */
  async reset(): Promise<void> {
    this.ingredients.set(structuredClone(DEFAULT_INGREDIENTS));
    this.dishes.set(structuredClone(DEFAULT_DISHES));
    await this.save();
  }
}
