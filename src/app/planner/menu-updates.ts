import {
  DEFAULT_DISHES,
  DEFAULT_INGREDIENTS,
  LENTILS_ID,
  PICKLES_ID,
  POST_WORKOUT_SHAKE_ID,
  ROLLS_ID,
  SOY_MILK_ID,
  WINGS_ID,
  STEW_ID,
  PEANUT_TOAST_ID,
  MEAT_SANDWICH_ID,
  BANANA_SHAKE_ID,
  CHOCOLATE_PALMIER_ID,
  KRISPPER_ID,
} from './default-menu';
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

/** Octubre 2026: la proteína es HSN Soy Protein Isolate 2.0 (etiqueta) y su cacito de 50 ml pesa 30 g. */
export const PROTEIN_ISOLATE_UPDATE: MenuUpdate = {
  id: '2026-10-proteina-hsn-isolate',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const protein = byIdOrName(ingredients, 'proteina-soja-hsn', /prote[ií]na de soja/i);
    if (protein) {
      protein.kcal100 = 389;
      protein.protein100 = 92;
      protein.measure = { name: protein.measure?.name || 'cacito', grams: 30 };
    }
    return { ingredients, dishes: menu.dishes };
  },
};

/**
 * Octubre 2026: las lentejas de Aru son con patata y trituradas (sin chorizo ni morcilla) y sustituyen a las
 * «Lentejas» de antes. Se añaden los panecillos integrales y los encurtidos como acompañamientos.
 */
export const LENTILS_UPDATE: MenuUpdate = {
  id: '2026-10-lentejas-panecillos-encurtidos',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const dishes = structuredClone(menu.dishes);
    for (const id of [LENTILS_ID, ROLLS_ID, PICKLES_ID]) {
      if (!ingredients.some((i) => i.id === id)) {
        ingredients.push(structuredClone(DEFAULT_INGREDIENTS.find((i) => i.id === id)!));
      }
    }
    const fromDefaults = (id: string) => structuredClone(DEFAULT_DISHES.find((d) => d.id === id)!);

    // Las lentejas nuevas ocupan el sitio de las de antes.
    const old = dishes.findIndex((d) => d.id === 'lentejas');
    if (!dishes.some((d) => d.id === LENTILS_ID)) {
      if (old >= 0) {
        dishes[old] = fromDefaults(LENTILS_ID);
      } else {
        dishes.push(fromDefaults(LENTILS_ID));
      }
    } else if (old >= 0) {
      dishes.splice(old, 1);
    }
    for (const id of [ROLLS_ID, PICKLES_ID]) {
      if (!dishes.some((d) => d.id === id)) {
        dishes.push(fromDefaults(id));
      }
    }
    // El ingrediente viejo se quita si ya no lo usa ningún plato.
    const used = new Set(dishes.flatMap((d) => d.lines.map((l) => l.ingredientId)));
    return { ingredients: ingredients.filter((i) => i.id !== 'lentejas' || used.has(i.id)), dishes };
  },
};

/** Octubre 2026: pesado en la báscula, el cacito lleno son 32 g y vacío 5 g, así que lleva 27 g de proteína. */
export const PROTEIN_SCOOP_UPDATE: MenuUpdate = {
  id: '2026-10-cacito-proteina-27g',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const protein = byIdOrName(ingredients, 'proteina-soja-hsn', /prote[ií]na de soja/i);
    if (protein) {
      protein.measure = { name: protein.measure?.name || 'cacito', grams: 27 };
    }
    return { ingredients, dishes: menu.dishes };
  },
};

/** Octubre 2026: se añaden las alitas de pollo en airfryer. */
export const WINGS_UPDATE: MenuUpdate = {
  id: '2026-10-alitas-pollo',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const dishes = structuredClone(menu.dishes);
    if (!ingredients.some((i) => i.id === WINGS_ID)) {
      ingredients.push(structuredClone(DEFAULT_INGREDIENTS.find((i) => i.id === WINGS_ID)!));
    }
    if (!dishes.some((d) => d.id === WINGS_ID)) {
      dishes.push(structuredClone(DEFAULT_DISHES.find((d) => d.id === WINGS_ID)!));
    }
    return { ingredients, dishes };
  },
};

/**
 * Octubre 2026: el estofado de Aru es caldoso y con mucha patata (90 kcal y 5,8 g por 100 g) y se añaden
 * las tostadas con crema de cacahuete y el medio bocata de carne en salsa.
 */
export const STEW_TOAST_SANDWICH_UPDATE: MenuUpdate = {
  id: '2026-10-estofado-tostadas-bocata',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const dishes = structuredClone(menu.dishes);
    const fromDefaults = (id: string) => structuredClone(DEFAULT_INGREDIENTS.find((i) => i.id === id)!);
    const stew = byIdOrName(ingredients, STEW_ID, /^estofado/i);
    if (stew) {
      stew.kcal100 = 90;
      stew.protein100 = 5.8;
      stew.measure = { name: stew.measure?.name || 'plato hondo', grams: 377 };
    } else {
      ingredients.push(fromDefaults(STEW_ID));
    }
    for (const id of ['pan', 'crema-cacahuete', 'carne-salsa']) {
      if (!ingredients.some((i) => i.id === id)) {
        ingredients.push(fromDefaults(id));
      }
    }
    for (const id of [STEW_ID, PEANUT_TOAST_ID, MEAT_SANDWICH_ID]) {
      if (!dishes.some((d) => d.id === id)) {
        dishes.push(structuredClone(DEFAULT_DISHES.find((d) => d.id === id)!));
      }
    }
    return { ingredients, dishes };
  },
};

/**
 * Octubre 2026: el batido con plátano pasa a ser el de Aru (300 ml de soja, 1,5 cacitos y un plátano pequeño)
 * y se añade la palmera de chocolate.
 */
export const BANANA_SHAKE_PALMIER_UPDATE: MenuUpdate = {
  id: '2026-10-batido-platano-palmera',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const fromDefaults = <T extends { id: string }>(list: T[], id: string) => structuredClone(list.find((i) => i.id === id)!);
    for (const id of [SOY_MILK_ID, 'proteina-soja-hsn', 'platano', CHOCOLATE_PALMIER_ID]) {
      if (!ingredients.some((i) => i.id === id)) {
        ingredients.push(fromDefaults(DEFAULT_INGREDIENTS, id));
      }
    }
    const dishes = menu.dishes.filter((d) => d.id !== BANANA_SHAKE_ID).map((d) => structuredClone(d));
    const at = menu.dishes.findIndex((d) => d.id === BANANA_SHAKE_ID);
    dishes.splice(at < 0 ? dishes.length : at, 0, fromDefaults(DEFAULT_DISHES, BANANA_SHAKE_ID));
    if (!dishes.some((d) => d.id === CHOCOLATE_PALMIER_ID)) {
      dishes.push(fromDefaults(DEFAULT_DISHES, CHOCOLATE_PALMIER_ID));
    }
    return { ingredients, dishes };
  },
};

/** Octubre 2026: se añade la Chicken Krispper de Burger King. */
export const KRISPPER_UPDATE: MenuUpdate = {
  id: '2026-10-chicken-krispper',
  apply(menu: Menu): Menu {
    const ingredients = structuredClone(menu.ingredients);
    const dishes = structuredClone(menu.dishes);
    if (!ingredients.some((i) => i.id === KRISPPER_ID)) {
      ingredients.push(structuredClone(DEFAULT_INGREDIENTS.find((i) => i.id === KRISPPER_ID)!));
    }
    if (!dishes.some((d) => d.id === KRISPPER_ID)) {
      dishes.push(structuredClone(DEFAULT_DISHES.find((d) => d.id === KRISPPER_ID)!));
    }
    return { ingredients, dishes };
  },
};

export const MENU_UPDATES: MenuUpdate[] = [
  SOY_MILK_UPDATE,
  PROTEIN_ISOLATE_UPDATE,
  LENTILS_UPDATE,
  PROTEIN_SCOOP_UPDATE,
  WINGS_UPDATE,
  STEW_TOAST_SANDWICH_UPDATE,
  BANANA_SHAKE_PALMIER_UPDATE,
  KRISPPER_UPDATE,
];

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
