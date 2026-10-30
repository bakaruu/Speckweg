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

  it('apunta las 10 alitas del 25 de octubre', () => {
    const day = pendingDiaryUpdates([], MEAL_CATALOG).find((u) => u.date === '2026-10-25')!;
    expect(day.items.map((i) => [i.meal.name, i.grams])).toEqual([['Alitas de pollo en airfryer', 271]]);
    expect(macrosFor(day.items[0].meal, 271)).toEqual(expect.objectContaining({ kcal: 474 }));
  });

  it('apunta el desayuno y la comida del 26 de octubre', () => {
    const days = pendingDiaryUpdates([], MEAL_CATALOG).filter((u) => u.date === '2026-10-26');
    const items = days.flatMap((d) => d.items);
    expect(items.map((i) => [i.meal.name, i.grams])).toEqual([
      ['Tostadas con crema de cacahuete', 100],
      ['Medio bocata de carne en salsa', 170],
      ['Estofado de ternera con patatas', 377],
    ]);
    const kcal = items.reduce((sum, i) => sum + macrosFor(i.meal, i.grams).kcal, 0);
    expect(kcal).toBe(326 + 343 + 339);
  });

  it('apunta el batido con plátano y la palmera del 30 de octubre', () => {
    const day = pendingDiaryUpdates([], MEAL_CATALOG).find((u) => u.id === '2026-10-30-batido-palmera')!;
    expect(day.items.map((i) => [i.meal.name, i.grams])).toEqual([
      ['Batido de proteína de soja con plátano', 419],
      ['Palmera de chocolate', 90],
    ]);
    const kcal = day.items.reduce((sum, i) => sum + macrosFor(i.meal, i.grams).kcal, 0);
    expect(kcal).toBe(323 + 477);
  });

  it('quita el batido del 30 de octubre, que al final no se tomó', () => {
    const day = pendingDiaryUpdates([], MEAL_CATALOG).find((u) => u.id === '2026-10-30-quitar-batido')!;
    expect(day.items).toEqual([]);
    expect(day.remove).toEqual([{ name: 'Batido de proteína de soja con plátano', grams: 419 }]);
  });

  it('apunta la cena del 30 de octubre: Krispper, brócoli, jamón y palitos', () => {
    const day = pendingDiaryUpdates([], MEAL_CATALOG).find((u) => u.id === '2026-10-30-cena-krispper')!;
    expect(day.items.map((i) => [i.meal.name, i.meal.slot, i.grams])).toEqual([
      ['Chicken Krispper de Burger King', 'cena', 304],
      ['Brócoli al horno o airfryer', 'cena', 163],
      ['Jamón serrano', 'cena', 36],
      ['Palitos de pan integrales', 'cena', 34],
    ]);
    const kcal = day.items.reduce((sum, i) => sum + macrosFor(i.meal, i.grams).kcal, 0);
    expect(kcal).toBe(800 + 55 + 86 + 136);
    expect(macrosFor(day.items[0].meal, 304)).toEqual({ kcal: 800, proteinG: 32 });
    expect(macrosFor(day.items[1].meal, 163)).toEqual({ kcal: 55, proteinG: 5 });
  });

  it('no repite lo ya apuntado', () => {
    expect(pendingDiaryUpdates(DIARY_UPDATES.map((u) => u.id), MEAL_CATALOG)).toEqual([]);
  });
});
