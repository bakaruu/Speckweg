import type { MealIdea, MealSlot } from './meal-catalog';

/** Ingrediente con sus valores por 100 g y, si quieres, tu medida casera (cacito, cazo, loncha…). */
export interface Ingredient {
  id: string;
  name: string;
  kcal100: number;
  protein100: number;
  /** Medida casera: cuántos gramos tiene tu cacito, tu cazo, una loncha, etc. */
  measure?: { name: string; grams: number };
}

/** Una línea de un plato: cuánto lleva de un ingrediente, en gramos o en su medida casera. */
export interface DishLine {
  ingredientId: string;
  amount: number;
  unit: 'g' | 'medida';
}

export interface Dish {
  id: string;
  slot: MealSlot;
  name: string;
  /** Cómo se hace, opcional. */
  notes?: string;
  /** Ración en palabras, por ejemplo "1 plato hondo". */
  portion: string;
  lines: DishLine[];
  usual?: boolean;
}

export interface Menu {
  ingredients: Ingredient[];
  dishes: Dish[];
}

export function lineGrams(line: DishLine, ingredient: Ingredient | undefined): number {
  if (line.unit === 'medida') {
    return line.amount * (ingredient?.measure?.grams ?? 0);
  }
  return line.amount;
}

/** "1,5 × cacito (45 g)" o "200 g". */
export function lineAmountLabel(line: DishLine, ingredient: Ingredient | undefined): string {
  const grams = Math.round(lineGrams(line, ingredient));
  if (line.unit === 'medida' && ingredient?.measure) {
    return `${formatNumber(line.amount)} × ${ingredient.measure.name} (${grams} g)`;
  }
  return `${grams} g`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

/** Totales del plato a partir de sus ingredientes. */
export function dishTotals(dish: Dish, ingredients: Ingredient[]): { grams: number; kcal: number; proteinG: number } {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  let grams = 0;
  let kcal = 0;
  let protein = 0;
  for (const line of dish.lines) {
    const ingredient = byId.get(line.ingredientId);
    const g = lineGrams(line, ingredient);
    grams += g;
    kcal += ((ingredient?.kcal100 ?? 0) * g) / 100;
    protein += ((ingredient?.protein100 ?? 0) * g) / 100;
  }
  return { grams: Math.round(grams), kcal: Math.round(kcal), proteinG: Math.round(protein) };
}

/** Convierte un plato editable en la idea de comida que usan Hoy y el diario. */
export function toMealIdea(dish: Dish, ingredients: Ingredient[]): MealIdea {
  const byId = new Map(ingredients.map((i) => [i.id, i]));
  const totals = dishTotals(dish, ingredients);
  const lines = dish.lines
    .map((l) => {
      const ingredient = byId.get(l.ingredientId);
      return ingredient ? `${ingredient.name} ${lineAmountLabel(l, ingredient)}` : undefined;
    })
    .filter((t): t is string => !!t)
    .join(', ');
  return {
    id: dish.id,
    slot: dish.slot,
    name: dish.name,
    ingredients: dish.notes ? `${lines}. ${dish.notes}` : lines,
    portion: dish.portion,
    portionG: Math.max(1, totals.grams),
    kcal: totals.kcal,
    proteinG: totals.proteinG,
    usual: dish.usual,
  };
}

/** Id nuevo a partir de un nombre, que no choque con los existentes. */
export function newId(name: string, taken: Iterable<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'plato';
  const used = new Set(taken);
  let id = base;
  for (let n = 2; used.has(id); n++) {
    id = `${base}-${n}`;
  }
  return id;
}
