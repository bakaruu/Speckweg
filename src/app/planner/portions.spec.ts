import { MEAL_CATALOG } from './meal-catalog';
import { gramsFor, macrosFor } from './portions';

describe('portions', () => {
  const lentejas = MEAL_CATALOG.find((m) => m.id === 'lentejas')!;

  it('la ración normal da los valores del catálogo', () => {
    const grams = gramsFor(lentejas, { kind: 'size', size: 'normal' });
    expect(grams).toBe(lentejas.portionG);
    expect(macrosFor(lentejas, grams)).toEqual({ kcal: lentejas.kcal, proteinG: lentejas.proteinG });
  });

  it('una ración grande suma más que una pequeña', () => {
    const small = macrosFor(lentejas, gramsFor(lentejas, { kind: 'size', size: 'pequena' }));
    const big = macrosFor(lentejas, gramsFor(lentejas, { kind: 'size', size: 'grande' }));
    expect(big.kcal).toBeGreaterThan(lentejas.kcal);
    expect(small.kcal).toBeLessThan(lentejas.kcal);
  });

  it('en gramos escala según el peso de la ración', () => {
    expect(gramsFor(lentejas, { kind: 'grams', grams: 200 })).toBe(200);
    expect(macrosFor(lentejas, 200)).toEqual({
      kcal: Math.round(lentejas.kcal / 2),
      proteinG: Math.round(lentejas.proteinG / 2),
    });
  });
});
