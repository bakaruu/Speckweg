import { MEAL_CATALOG } from './meal-catalog';
import { isoDate, MEAL_SLOTS, optionsFor, pickMeal, proteinTargetG, totals } from './daily-plan';

describe('daily-plan', () => {
  const day = new Date(2026, 9, 4);

  it('da el mismo plan para el mismo día', () => {
    for (const slot of MEAL_SLOTS) {
      expect(pickMeal(day, slot).id).toBe(pickMeal(new Date(2026, 9, 4, 22, 30), slot).id);
    }
  });

  it('cambia de plato al día siguiente', () => {
    const next = new Date(2026, 9, 5);
    expect(pickMeal(next, 'comida').id).not.toBe(pickMeal(day, 'comida').id);
  });

  it('recorre todas las opciones al pedir otra sugerencia', () => {
    const options = optionsFor('cena');
    const seen = new Set(options.map((_, i) => pickMeal(day, 'cena', i).id));
    expect(seen.size).toBe(options.length);
  });

  it('cada comida tiene al menos dos opciones', () => {
    for (const slot of MEAL_SLOTS) {
      expect(optionsFor(slot).length).toBeGreaterThanOrEqual(2);
    }
  });

  it('los ids del catálogo son únicos', () => {
    expect(new Set(MEAL_CATALOG.map((m) => m.id)).size).toBe(MEAL_CATALOG.length);
  });

  it('calcula la proteína objetivo por peso', () => {
    expect(proteinTargetG(80)).toBe(144);
    expect(proteinTargetG(undefined)).toBe(140);
  });

  it('suma calorías y proteína', () => {
    expect(totals([MEAL_CATALOG[0], MEAL_CATALOG[1]])).toEqual({
      kcal: MEAL_CATALOG[0].kcal + MEAL_CATALOG[1].kcal,
      proteinG: MEAL_CATALOG[0].proteinG + MEAL_CATALOG[1].proteinG,
    });
  });

  it('formatea la fecha local', () => {
    expect(isoDate(day)).toBe('2026-10-04');
  });
});
