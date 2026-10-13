import { DEFAULT_DISHES, DEFAULT_INGREDIENTS } from './default-menu';
import { dishTotals, Menu } from './menu-model';
import { applyMenuUpdates, SOY_MILK_UPDATE } from './menu-updates';

describe('applyMenuUpdates', () => {
  // Como lo tenía Aru: proteína renombrada, cacito y cazo a 50 g, y leche semidesnatada en el desayuno.
  const saved: Menu = {
    ingredients: [
      { id: 'proteina-soja-hsn', name: 'Proteína de soja', kcal100: 367, protein100: 87, measure: { name: 'cacito', grams: 50 } },
      { id: 'avena', name: 'Copos de avena', kcal100: 375, protein100: 13, measure: { name: 'cazo', grams: 50 } },
      { id: 'leche', name: 'Leche semidesnatada', kcal100: 46, protein100: 3.2, measure: { name: 'vaso', grams: 250 } },
      { id: 'platano', name: 'Plátano', kcal100: 89, protein100: 1.1, measure: { name: 'unidad', grams: 120 } },
    ],
    dishes: [
      {
        id: 'avena-leche-platano',
        slot: 'desayuno',
        name: 'Avena con leche y plátano',
        portion: '1 tazón',
        lines: [
          { ingredientId: 'avena', amount: 1.5, unit: 'medida' },
          { ingredientId: 'leche', amount: 1, unit: 'medida' },
          { ingredientId: 'platano', amount: 1, unit: 'medida' },
        ],
      },
    ],
  };

  it('añade la leche de soja, pone las medidas a 20 g, cambia la leche y crea el batido', () => {
    const { menu, applied, changed } = applyMenuUpdates(saved, []);
    expect(changed).toBe(true);
    expect(applied).toEqual([SOY_MILK_UPDATE.id]);
    const byId = new Map(menu.ingredients.map((i) => [i.id, i]));
    expect(byId.get('leche-soja-kaiku')?.name).toBe('Leche de soja Kaiku');
    expect(byId.get('proteina-soja-hsn')?.measure).toEqual({ name: 'cacito', grams: 20 });
    expect(byId.get('avena')?.measure).toEqual({ name: 'cazo', grams: 20 });
    expect(menu.dishes[0].lines[1]).toEqual({ ingredientId: 'leche-soja-kaiku', amount: 250, unit: 'g' });

    const shake = menu.dishes.find((d) => d.id === 'batido-post-entreno')!;
    expect(shake.name).toBe('Batido post-entreno');
    // 300 ml de soja (96 kcal, 9,3 g) + 30 g de proteína (110 kcal, 26,1 g) + 30 g de avena (112,5 kcal, 3,9 g)
    expect(dishTotals(shake, menu.ingredients)).toEqual({ grams: 360, kcal: 319, proteinG: 39 });
  });

  it('no repite un cambio ya aplicado, así respeta lo que edites después', () => {
    const result = applyMenuUpdates(saved, [SOY_MILK_UPDATE.id]);
    expect(result.changed).toBe(false);
    expect(result.menu).toBe(saved);
  });

  it('sobre el menú inicial no duplica nada', () => {
    const { menu } = applyMenuUpdates({ ingredients: DEFAULT_INGREDIENTS, dishes: DEFAULT_DISHES }, []);
    expect(menu.ingredients.length).toBe(DEFAULT_INGREDIENTS.length);
    expect(menu.dishes.length).toBe(DEFAULT_DISHES.length);
  });
});
