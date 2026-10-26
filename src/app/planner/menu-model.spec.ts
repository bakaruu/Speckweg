import { DEFAULT_DISHES, DEFAULT_INGREDIENTS } from './default-menu';
import { Dish, dishTotals, Ingredient, lineAmountLabel, newId, toMealIdea } from './menu-model';

describe('menu-model', () => {
  const soja: Ingredient = { id: 'soja', name: 'Proteína de soja', kcal100: 400, protein100: 80, measure: { name: 'cacito', grams: 30 } };
  const leche: Ingredient = { id: 'leche', name: 'Leche', kcal100: 50, protein100: 3 };
  const batido: Dish = {
    id: 'batido',
    slot: 'merienda',
    name: 'Batido',
    portion: '1 vaso',
    lines: [
      { ingredientId: 'soja', amount: 1.5, unit: 'medida' },
      { ingredientId: 'leche', amount: 300, unit: 'g' },
    ],
  };

  it('calcula el plato con medidas caseras y gramos', () => {
    // 45 g de soja (180 kcal, 36 g) + 300 g de leche (150 kcal, 9 g)
    expect(dishTotals(batido, [soja, leche])).toEqual({ grams: 345, kcal: 330, proteinG: 45 });
    expect(lineAmountLabel(batido.lines[0], soja)).toBe('1,5 × cacito (45 g)');
  });

  it('al cambiar los gramos de la medida casera se recalcula el plato', () => {
    const bigScoop = { ...soja, measure: { name: 'cacito', grams: 40 } };
    expect(dishTotals(batido, [bigScoop, leche]).proteinG).toBe(57);
  });

  it('convierte el plato en idea de comida para Hoy', () => {
    const meal = toMealIdea(batido, [soja, leche]);
    expect(meal).toMatchObject({ id: 'batido', slot: 'merienda', portionG: 345, kcal: 330, proteinG: 45 });
    expect(meal.ingredients).toContain('Proteína de soja 1,5 × cacito (45 g)');
  });

  it('crea ids sin repetir', () => {
    expect(newId('Tortilla de brócoli', [])).toBe('tortilla-de-brocoli');
    expect(newId('Tortilla de brócoli', ['tortilla-de-brocoli'])).toBe('tortilla-de-brocoli-2');
  });

  it('el menú inicial solo usa ingredientes que existen', () => {
    const ids = new Set(DEFAULT_INGREDIENTS.map((i) => i.id));
    for (const dish of DEFAULT_DISHES) {
      for (const line of dish.lines) {
        expect(ids.has(line.ingredientId), `${dish.id} usa ${line.ingredientId}`).toBe(true);
        if (line.unit === 'medida') {
          expect(DEFAULT_INGREDIENTS.find((i) => i.id === line.ingredientId)?.measure, line.ingredientId).toBeDefined();
        }
      }
    }
  });
});
