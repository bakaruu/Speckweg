import { MEAL_CATALOG } from './meal-catalog';
import { foodGrams, macrosFor, parseGrams } from './portions';

describe('portions', () => {
  const lentejas = MEAL_CATALOG.find((m) => m.id === 'lentejas')!;

  it('la ración habitual da los valores del catálogo', () => {
    expect(macrosFor(lentejas, lentejas.portionG)).toEqual({ kcal: lentejas.kcal, proteinG: lentejas.proteinG });
  });

  it('escala según los gramos', () => {
    expect(macrosFor(lentejas, lentejas.portionG / 2)).toEqual({
      kcal: Math.round(lentejas.kcal / 2),
      proteinG: Math.round(lentejas.proteinG / 2),
    });
  });

  it('resta el peso del recipiente a lo que marca la báscula', () => {
    expect(foodGrams(720, 320)).toBe(400);
    expect(foodGrams(300, 320)).toBe(0);
  });

  it('acepta coma decimal', () => {
    expect(parseGrams('312,5')).toBe(312.5);
    expect(parseGrams('')).toBeNaN();
  });
});
