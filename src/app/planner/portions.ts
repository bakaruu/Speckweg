import { MealIdea } from './meal-catalog';

/** Calorías y proteína del plato para esos gramos, redondeadas. */
export function macrosFor(meal: MealIdea, grams: number): { kcal: number; proteinG: number } {
  const ratio = grams / meal.portionG;
  return { kcal: Math.round(meal.kcal * ratio), proteinG: Math.round(meal.proteinG * ratio) };
}

/** Gramos de comida: lo que marca la báscula menos lo que pesa el recipiente vacío. */
export function foodGrams(scaleGrams: number, containerGrams: number): number {
  return Math.max(0, Math.round(scaleGrams - containerGrams));
}

/** Lee un número escrito a mano, aceptando coma decimal. NaN si no es un número. */
export function parseGrams(value: string): number {
  return value.trim() === '' ? NaN : Number(value.replace(',', '.'));
}
