import { DEFAULT_DISHES, DEFAULT_INGREDIENTS } from './default-menu';
import { dishTotals, Menu } from './menu-model';
import { applyMenuUpdates, BANANA_SHAKE_PALMIER_UPDATE, KRISPPER_UPDATE, LENTILS_UPDATE, MENU_UPDATES, PROTEIN_ISOLATE_UPDATE, PROTEIN_SCOOP_UPDATE, SOY_MILK_UPDATE, STEW_TOAST_SANDWICH_UPDATE, WINGS_UPDATE } from './menu-updates';
import { toMealIdea } from './menu-model';

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
    const menu = SOY_MILK_UPDATE.apply(saved);
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

  it('después pone la proteína con su etiqueta y el cacito a 27 g (pesado)', () => {
    const { menu, applied, changed } = applyMenuUpdates(saved, []);
    expect(changed).toBe(true);
    expect(applied).toEqual([SOY_MILK_UPDATE.id, PROTEIN_ISOLATE_UPDATE.id, LENTILS_UPDATE.id, PROTEIN_SCOOP_UPDATE.id, WINGS_UPDATE.id, STEW_TOAST_SANDWICH_UPDATE.id, BANANA_SHAKE_PALMIER_UPDATE.id, KRISPPER_UPDATE.id]);
    const protein = menu.ingredients.find((i) => i.id === 'proteina-soja-hsn')!;
    expect(protein).toEqual({ id: 'proteina-soja-hsn', name: 'Proteína de soja', kcal100: 389, protein100: 92, measure: { name: 'cacito', grams: 27 } });
    expect(menu.ingredients.find((i) => i.id === 'avena')?.measure?.grams).toBe(20);
    const shake = menu.dishes.find((d) => d.id === 'batido-post-entreno')!;
    // 300 ml de soja (96 kcal, 9,3 g) + 40,5 g de proteína (157,5 kcal, 37,3 g) + 30 g de avena (112,5 kcal, 3,9 g)
    expect(dishTotals(shake, menu.ingredients)).toEqual({ grams: 371, kcal: 366, proteinG: 50 });
  });

  it('solo aplica lo que falta', () => {
    const { menu, applied } = applyMenuUpdates(SOY_MILK_UPDATE.apply(saved), [SOY_MILK_UPDATE.id]);
    expect(applied).toEqual([SOY_MILK_UPDATE.id, PROTEIN_ISOLATE_UPDATE.id, LENTILS_UPDATE.id, PROTEIN_SCOOP_UPDATE.id, WINGS_UPDATE.id, STEW_TOAST_SANDWICH_UPDATE.id, BANANA_SHAKE_PALMIER_UPDATE.id, KRISPPER_UPDATE.id]);
    expect(menu.ingredients.find((i) => i.id === 'proteina-soja-hsn')?.measure?.grams).toBe(27);
  });

  it('no repite un cambio ya aplicado, así respeta lo que edites después', () => {
    const result = applyMenuUpdates(saved, MENU_UPDATES.map((u) => u.id));
    expect(result.changed).toBe(false);
    expect(result.menu).toBe(saved);
  });

  it('sobre el menú inicial no duplica nada', () => {
    const { menu } = applyMenuUpdates({ ingredients: DEFAULT_INGREDIENTS, dishes: DEFAULT_DISHES }, []);
    expect(menu.ingredients.length).toBe(DEFAULT_INGREDIENTS.length);
    expect(menu.dishes.length).toBe(DEFAULT_DISHES.length);
  });

  it('cambia las lentejas por las de patata trituradas y añade panecillos y encurtidos', () => {
    const old: Menu = {
      ingredients: [{ id: 'lentejas', name: 'Lentejas estofadas', kcal100: 120, protein100: 6.3, measure: { name: 'plato hondo', grams: 400 } }],
      dishes: [{ id: 'lentejas', slot: 'comida', name: 'Lentejas', portion: '1 plato hondo', usual: true, lines: [{ ingredientId: 'lentejas', amount: 1, unit: 'medida' }] }],
    };
    const menu = LENTILS_UPDATE.apply(old);
    expect(menu.ingredients.some((i) => i.id === 'lentejas')).toBe(false);
    expect(menu.dishes.map((d) => d.id)).toEqual(['lentejas-patata-trituradas', 'panecillos-integrales', 'encurtidos']);
    const meals = menu.dishes.map((d) => toMealIdea(d, menu.ingredients));
    // 434 g a 80 kcal y 5 g de proteína por 100 g.
    expect(meals[0]).toEqual(expect.objectContaining({ portionG: 434, kcal: 347, proteinG: 22, side: undefined }));
    // 32 g a 400 kcal y 11,1 g por 100 g.
    expect(meals[1]).toEqual(expect.objectContaining({ portionG: 32, kcal: 128, proteinG: 4, side: true }));
    expect(meals[2]).toEqual(expect.objectContaining({ portionG: 77, kcal: 50, side: true }));
  });

  it('añade las alitas de pollo, pesadas con hueso', () => {
    const menu = WINGS_UPDATE.apply({ ingredients: [], dishes: [] });
    const wings = toMealIdea(menu.dishes[0], menu.ingredients);
    // 271 g a 175 kcal y 16,5 g de proteína por 100 g.
    expect(wings).toEqual(expect.objectContaining({ name: 'Alitas de pollo en airfryer', portionG: 271, kcal: 474, proteinG: 45 }));
    expect(WINGS_UPDATE.apply(menu)).toEqual(menu);
  });

  it('pone el estofado caldoso de Aru y añade las tostadas y el medio bocata', () => {
    const old = { ingredients: [{ id: 'estofado', name: 'Estofado de ternera con patatas', kcal100: 138, protein100: 8.8, measure: { name: 'plato hondo', grams: 400 } }], dishes: [] };
    const menu = STEW_TOAST_SANDWICH_UPDATE.apply(old);
    const meal = (id: string) => toMealIdea(menu.dishes.find((d) => d.id === id)!, menu.ingredients);
    expect(meal('estofado')).toEqual(expect.objectContaining({ portionG: 377, kcal: 339, proteinG: 22 }));
    expect(meal('tostadas-crema-cacahuete')).toEqual(expect.objectContaining({ slot: 'desayuno', portionG: 100, kcal: 326, proteinG: 12 }));
    expect(meal('medio-bocata-carne-salsa')).toEqual(expect.objectContaining({ portionG: 170, kcal: 343, proteinG: 19 }));
    expect(STEW_TOAST_SANDWICH_UPDATE.apply(menu)).toEqual(menu);
  });

  it('pone el batido con plátano de Aru y añade la palmera de chocolate', () => {
    const old: Menu = {
      ingredients: structuredClone(DEFAULT_INGREDIENTS.filter((i) => i.id !== 'palmera-chocolate')),
      dishes: [{ id: 'batido-soja-platano', slot: 'merienda', name: 'Batido de proteína de soja con plátano', portion: '1 vaso grande', lines: [{ ingredientId: 'proteina-soja-hsn', amount: 1, unit: 'medida' }] }],
    };
    const menu = BANANA_SHAKE_PALMIER_UPDATE.apply(old);
    const meal = (id: string) => toMealIdea(menu.dishes.find((d) => d.id === id)!, menu.ingredients);
    // 300 ml de soja (96 kcal, 9,3 g) + 40,5 g de proteína (157,5 kcal, 37,3 g) + 79 g de plátano (70 kcal, 0,9 g)
    expect(meal('batido-soja-platano')).toEqual(expect.objectContaining({ portionG: 420, kcal: 324, proteinG: 47, usual: true }));
    expect(meal('palmera-chocolate')).toEqual(expect.objectContaining({ portionG: 90, kcal: 477, proteinG: 5, side: true }));
    expect(menu.dishes.length).toBe(2);
    expect(BANANA_SHAKE_PALMIER_UPDATE.apply(menu)).toEqual(menu);
  });

  it('añade la Chicken Krispper de Burger King y el brócoli solo', () => {
    const menu = KRISPPER_UPDATE.apply({ ingredients: [], dishes: [] });
    const [krispper, broccoli] = menu.dishes.map((d) => toMealIdea(d, menu.ingredients));
    expect(krispper).toEqual(expect.objectContaining({ slot: 'cena', portionG: 304, kcal: 800, proteinG: 32, side: true }));
    // 163 g a 34 kcal y 2,8 g de proteína por 100 g.
    expect(broccoli).toEqual(expect.objectContaining({ slot: 'cena', portionG: 163, kcal: 55, proteinG: 5, side: true }));
    expect(KRISPPER_UPDATE.apply(menu)).toEqual(menu);
  });
});
