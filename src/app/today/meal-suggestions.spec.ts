import { mealsFor } from './meal-suggestions';

describe('mealsFor', () => {
  it('da un menú distinto cada día de la semana', () => {
    // 2026-10-05 es lunes.
    const week = Array.from({ length: 7 }, (_, i) => mealsFor(new Date(2026, 9, 5 + i)));
    expect(new Set(week).size).toBe(7);
    expect(mealsFor(new Date(2026, 9, 12))).toBe(week[0]);
  });

  it('incluye el batido de soja de HSN al menos una vez casi todos los días', () => {
    const days = Array.from({ length: 7 }, (_, i) => mealsFor(new Date(2026, 9, 5 + i)));
    const withSoy = days.filter((meals) => meals.some((m) => m.name.includes('soja HSN')));
    expect(withSoy.length).toBeGreaterThanOrEqual(5);
  });
});
