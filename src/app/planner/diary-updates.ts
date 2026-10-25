import { LENTILS_ID, PICKLES_ID, ROLLS_ID, WINGS_ID } from './default-menu';
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
