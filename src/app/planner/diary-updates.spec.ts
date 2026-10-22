import { DIARY_UPDATES, pendingDiaryUpdates } from './diary-updates';
import { MEAL_CATALOG } from './meal-catalog';
import { macrosFor } from './portions';

describe('pendingDiaryUpdates', () => {
  it('apunta la comida del 22 de octubre: lentejas, panecillos y encurtidos', () => {
    const [day] = pendingDiaryUpdates([], MEAL_CATALOG);
    expect(day.date).toBe('2026-10-22');
    expect(day.items.map((i) => [i.meal.name, i.grams])).toEqual([
      ['Lentejas con patata trituradas', 434],
      ['Panecillos integrales', 32],
      ['Encurtidos', 77],
    ]);
    const kcal = day.items.reduce((sum, i) => sum + macrosFor(i.meal, i.grams).kcal, 0);
    expect(kcal).toBe(347 + 128 + 50);
  });

  it('no repite lo ya apuntado', () => {
    expect(pendingDiaryUpdates(DIARY_UPDATES.map((u) => u.id), MEAL_CATALOG)).toEqual([]);
  });
});
