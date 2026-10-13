import { DEFAULT_DISHES, DEFAULT_INGREDIENTS, POST_WORKOUT_SHAKE_ID, SOY_MILK_ID } from './default-menu';
import { Ingredient, Menu } from './menu-model';

/**
 * Cambios que la app aplica una sola vez sobre tu menú guardado.
 * Cada uno tiene un id; los aplicados se apuntan para no repetirlos y no pisar lo que cambies después.
 */
export interface MenuUpdate {
  id: string;
  apply(menu: Menu): Menu;
}

const byIdOrName = (list: Ingredient[], id: string, name: RegExp): Ingredient | undefined =>
  list.find((i) => i.id === id) ?? list.find((i) => name.test(i.name));

/**
 * Octubre 2026: la leche es de soja Kaiku, el cacito de proteína y el cazo de avena pesan 20 g,
 * y se añade el «Batido post-entreno».
 */
export const SOY_MILK_UPDATE: MenuUpdate = {
  id: '2026-10-leche-soja-kaiku',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    let dishes = structuredClone(menu.dishes);
    const fromDefaults = (id: string): Ingredient => {
      const found = structuredClone(DEFAULT_INGREDIENTS.find((i) => i.id === id)!);
      ingredients.push(found);
      return found;
    };

    const soyMilk = ingredients.find((i) => i.id === SOY_MILK_ID) ?? fromDefaults(SOY_MILK_ID);
    const protein = byIdOrName(ingredients, 'proteina-soja-hsn', /prote[ií]na de soja/i) ?? fromDefaults('proteina-soja-hsn');
    const oats = byIdOrName(ingredients, 'avena', /avena/i) ?? fromDefaults('avena');
    protein.measure = { name: protein.measure?.name || 'cacito', grams: 20 };
    oats.measure = { name: oats.measure?.name || 'cazo', grams: 20 };

    // En tus platos, la leche semidesnatada pasa a ser leche de soja, con los mismos gramos.
    const cowMilk = byIdOrName(ingredients, 'leche', /leche semidesnatada/i);
    if (cowMilk) {
      dishes = dishes.map((d) => ({
        ...d,
        lines: d.lines.map((l) =>
          l.ingredientId === cowMilk.id
            ? { ingredientId: soyMilk.id, amount: l.unit === 'medida' ? l.amount * (cowMilk.measure?.grams ?? 0) : l.amount, unit: 'g' as const }
            : l,
        ),
      }));
    }

    if (!dishes.some((d) => d.id === POST_WORKOUT_SHAKE_ID)) {
      const shake = structuredClone(DEFAULT_DISHES.find((d) => d.id === POST_WORKOUT_SHAKE_ID)!);
      shake.lines = [
        { ingredientId: soyMilk.id, amount: 300, unit: 'g' },
        { ingredientId: protein.id, amount: 1.5, unit: 'medida' },
        { ingredientId: oats.id, amount: 1.5, unit: 'medida' },
      ];
      dishes.push(shake);
    }
    return { ingredients, dishes };
  },
};

export const MENU_UPDATES: MenuUpdate[] = [SOY_MILK_UPDATE];

/** Aplica los cambios pendientes. Devuelve el menú y la lista de cambios ya aplicados. */
export function applyMenuUpdates(menu: Menu, applied: string[]): { menu: Menu; applied: string[]; changed: boolean } {
  let result = menu;
  const done = [...applied];
  for (const update of MENU_UPDATES) {
    if (!done.includes(update.id)) {
      result = update.apply(result);
      done.push(update.id);
    }
  }
  return { menu: result, applied: done, changed: done.length !== applied.length };
}
