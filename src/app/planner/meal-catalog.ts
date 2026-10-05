import { DEFAULT_DISHES, DEFAULT_INGREDIENTS } from './default-menu';
import { toMealIdea } from './menu-model';

export type MealSlot = 'desayuno' | 'comida' | 'merienda' | 'cena';

/** Plato listo para recomendar y apuntar, con sus totales ya calculados. */
export interface MealIdea {
  id: string;
  slot: MealSlot;
  name: string;
  /** Ingredientes con cantidades y, si hay, cómo hacerlo. */
  ingredients: string;
  /** Ración normal en medida casera, por ejemplo "1 plato hondo". */
  portion: string;
  /** Peso aproximado de esa ración normal, para poder apuntar en gramos. */
  portionG: number;
  /** Valores aproximados por ración normal. */
  kcal: number;
  proteinG: number;
  /** Plato que Aru ya suele comer. */
  usual?: boolean;
}

/** Catálogo del menú inicial, sin cambios del usuario. */
export const MEAL_CATALOG: MealIdea[] = DEFAULT_DISHES.map((d) => toMealIdea(d, DEFAULT_INGREDIENTS));
