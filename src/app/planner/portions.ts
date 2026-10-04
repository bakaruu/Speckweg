import { MealIdea } from './meal-catalog';

/** Ración a ojo, relativa a la ración normal del plato. */
export type PortionSize = 'pequena' | 'normal' | 'grande';

export const PORTION_SIZES: { size: PortionSize; label: string; factor: number }[] = [
  { size: 'pequena', label: 'Pequeña', factor: 0.7 },
  { size: 'normal', label: 'Normal', factor: 1 },
  { size: 'grande', label: 'Grande', factor: 1.4 },
];

/** Cantidad apuntada: a ojo, o en gramos si se ha pesado. */
export type Amount = { kind: 'size'; size: PortionSize } | { kind: 'grams'; grams: number };

/** Gramos aproximados que corresponden a la cantidad elegida. */
export function gramsFor(meal: MealIdea, amount: Amount): number {
  if (amount.kind === 'grams') {
    return amount.grams;
  }
  const factor = PORTION_SIZES.find((p) => p.size === amount.size)?.factor ?? 1;
  return Math.round(meal.portionG * factor);
}

/** Calorías y proteína del plato para esos gramos, redondeadas. */
export function macrosFor(meal: MealIdea, grams: number): { kcal: number; proteinG: number } {
  const ratio = grams / meal.portionG;
  return { kcal: Math.round(meal.kcal * ratio), proteinG: Math.round(meal.proteinG * ratio) };
}
