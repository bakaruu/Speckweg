import { MealSlot } from '../../planner/meal-catalog';

/** Un alimento con sus valores por 100 g (de Open Food Facts o ya guardado en la base de datos). */
export interface FoodItem {
  /** Código de barras en Open Food Facts. */
  code: string;
  name: string;
  brand?: string;
  kcal100: number;
  protein100: number;
  carbs100: number;
  fat100: number;
  /** Gramos de una ración según el envase, si el producto la indica. */
  servingG?: number;
  servingLabel?: string;
}

export interface Macros {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export const NO_MACROS: Macros = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };

/** Producto tal como lo devuelve la API de Open Food Facts (solo los campos que pedimos). */
export interface OffProduct {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  generic_name_es?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: number | string;
  nutriments?: Record<string, number | string | undefined>;
}

/** Campos que se piden a Open Food Facts, para que las respuestas sean pequeñas. */
export const OFF_FIELDS =
  'code,product_name,product_name_es,generic_name_es,brands,serving_size,serving_quantity,nutriments';

function num(value: unknown): number | undefined {
  const n = typeof value === 'string' ? Number(value.replace(',', '.')) : value;
  return typeof n === 'number' && Number.isFinite(n) && n >= 0 ? n : undefined;
}

/** Convierte un producto de Open Food Facts en un alimento. Devuelve undefined si no tiene nombre o calorías. */
export function parseOffProduct(p: OffProduct): FoodItem | undefined {
  const name = (p.product_name_es || p.product_name || p.generic_name_es || '').trim();
  const n = p.nutriments ?? {};
  // Algunos productos solo traen la energía en kJ.
  const kj = num(n['energy_100g']);
  const kcal = num(n['energy-kcal_100g']) ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (!p.code || !name || kcal === undefined) {
    return undefined;
  }
  const serving = num(p.serving_quantity);
  return {
    code: p.code,
    name,
    brand: p.brands?.split(',')[0]?.trim() || undefined,
    kcal100: round1(kcal),
    protein100: round1(num(n['proteins_100g']) ?? 0),
    carbs100: round1(num(n['carbohydrates_100g']) ?? 0),
    fat100: round1(num(n['fat_100g']) ?? 0),
    servingG: serving && serving > 0 ? serving : undefined,
    servingLabel: serving && serving > 0 ? p.serving_size?.trim() || `${serving} g` : undefined,
  };
}

/** Calorías y macros de esos gramos de alimento, redondeados. */
export function macrosForGrams(food: FoodItem, grams: number): Macros {
  const r = grams / 100;
  return {
    kcal: Math.round(food.kcal100 * r),
    proteinG: Math.round(food.protein100 * r),
    carbsG: Math.round(food.carbs100 * r),
    fatG: Math.round(food.fat100 * r),
  };
}

export function addMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal + b.kcal,
    proteinG: a.proteinG + b.proteinG,
    carbsG: a.carbsG + b.carbsG,
    fatG: a.fatG + b.fatG,
  };
}

/** Un texto solo con dígitos de 8 a 14 cifras es un código de barras (EAN-8, EAN-13, UPC…). */
export function isBarcode(text: string): boolean {
  return /^\d{8,14}$/.test(text.replace(/\s/g, ''));
}

/** La comida que toca según la hora, para no tener que elegirla cada vez. */
export function slotForHour(hour: number): MealSlot {
  if (hour < 11) return 'desayuno';
  if (hour < 16) return 'comida';
  if (hour < 20) return 'merienda';
  return 'cena';
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
