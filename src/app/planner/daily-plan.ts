import { MEAL_CATALOG, MealIdea, MealSlot } from './meal-catalog';

export const MEAL_SLOTS: MealSlot[] = ['desayuno', 'comida', 'merienda', 'cena'];

/** Proteína diaria por kg de peso para alguien que entrena fuerza. */
export const PROTEIN_G_PER_KG = 1.8;
/** Objetivo por defecto mientras no haya peso en Ajustes. */
export const DEFAULT_PROTEIN_TARGET_G = 140;

export function proteinTargetG(weightKg?: number): number {
  return weightKg && weightKg > 0 ? Math.round(weightKg * PROTEIN_G_PER_KG) : DEFAULT_PROTEIN_TARGET_G;
}

/** Fecha local en formato YYYY-MM-DD. */
export function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

/** Número de días desde 1970 en la fecha local: el mismo día siempre da el mismo plan. */
function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
}

export function optionsFor(slot: MealSlot): MealIdea[] {
  return MEAL_CATALOG.filter((m) => m.slot === slot);
}

/**
 * Elige un plato por comida para la fecha dada. `shift` permite pedir otra sugerencia
 * para una comida concreta sin cambiar el resto.
 */
export function pickMeal(date: Date, slot: MealSlot, shift = 0): MealIdea {
  const options = optionsFor(slot);
  // Cada comida rota con un desfase distinto para que no cambien todas a la vez.
  const offset = MEAL_SLOTS.indexOf(slot) * 3;
  const index = (((dayNumber(date) + offset + shift) % options.length) + options.length) % options.length;
  return options[index];
}

export function totals(meals: MealIdea[]): { kcal: number; proteinG: number } {
  return meals.reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, proteinG: acc.proteinG + m.proteinG }), {
    kcal: 0,
    proteinG: 0,
  });
}
