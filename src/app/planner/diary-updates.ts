import { LENTILS_ID, MEAT_SANDWICH_ID, PEANUT_TOAST_ID, PICKLES_ID, ROLLS_ID, STEW_ID, WINGS_ID } from './default-menu';
import { MealIdea } from './meal-catalog';

/**
 * Comidas que la app apunta una sola vez en tu diario, porque nos las pasaste por el chat.
 * Las ya apuntadas se guardan para no repetirlas aunque luego borres alguna.
 */
export interface DiaryUpdate {
  id: string;
  /** Día, YYYY-MM-DD. */
  date: string;
  items: { mealId: string; grams: number }[];
}

export const DIARY_UPDATES: DiaryUpdate[] = [
  {
    // 434 g de lentejas, ya sin los 396 g del plato marrón.
    id: '2026-10-22-comida',
    date: '2026-10-22',
    items: [
      { mealId: LENTILS_ID, grams: 434 },
      { mealId: ROLLS_ID, grams: 32 },
      { mealId: PICKLES_ID, grams: 77 },
    ],
  },
  {
    // 10 alitas: 706 g en la báscula menos los 435 g del plato grande con dibujo marrón.
    id: '2026-10-25-comida',
    date: '2026-10-25',
    items: [{ mealId: WINGS_ID, grams: 271 }],
  },
  {
    // Desayuno: 2 tostadas con crema de cacahuete.
    id: '2026-10-26-desayuno',
    date: '2026-10-26',
    items: [{ mealId: PEANUT_TOAST_ID, grams: 100 }],
  },
  {
    // Medio bocata de carne en salsa y el estofado: 773 g en la báscula menos los 396 g del plato hondo.
    id: '2026-10-26-comida',
    date: '2026-10-26',
    items: [
      { mealId: MEAT_SANDWICH_ID, grams: 170 },
      { mealId: STEW_ID, grams: 377 },
    ],
  },
];

/** Lo que falta por apuntar: cada comida con su plato del menú y sus gramos. */
export function pendingDiaryUpdates(
  applied: string[],
  meals: MealIdea[],
): { id: string; date: string; items: { meal: MealIdea; grams: number }[] }[] {
  return DIARY_UPDATES.filter((u) => !applied.includes(u.id)).map((u) => ({
    id: u.id,
    date: u.date,
    items: u.items.flatMap(({ mealId, grams }) => {
      const meal = meals.find((m) => m.id === mealId);
      return meal ? [{ meal, grams }] : [];
    }),
  }));
}
