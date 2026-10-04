export type MealSlot = 'desayuno' | 'comida' | 'merienda' | 'cena';

export interface MealIdea {
  id: string;
  slot: MealSlot;
  name: string;
  /** Ingredientes y cantidades orientativas para una ración. */
  ingredients: string;
  /** Valores aproximados por ración. */
  kcal: number;
  proteinG: number;
}

/**
 * Batido con la proteína de soja de HSN (Evosoy).
 * Valores aproximados por cacito de 30 g: revisa la etiqueta de tu bote y ajústalos aquí.
 */
export const SOY_SCOOP = { grams: 30, kcal: 110, proteinG: 26 };

/** Catálogo inicial de platos altos en proteína. Valores aproximados por ración. */
export const MEAL_CATALOG: MealIdea[] = [
  // Desayunos
  {
    id: 'avena-batido-soja',
    slot: 'desayuno',
    name: 'Avena con batido de soja y plátano',
    ingredients: `60 g de avena, 1 cacito (${SOY_SCOOP.grams} g) de proteína de soja HSN, 1 plátano, 250 ml de bebida de soja`,
    kcal: 560,
    proteinG: 46,
  },
  {
    id: 'tostadas-huevo-pavo',
    slot: 'desayuno',
    name: 'Tostadas con huevos revueltos y pavo',
    ingredients: '2 rebanadas de pan integral, 3 huevos, 60 g de pechuga de pavo, tomate',
    kcal: 480,
    proteinG: 35,
  },
  {
    id: 'yogur-skyr-frutos-rojos',
    slot: 'desayuno',
    name: 'Skyr con frutos rojos, nueces y avena',
    ingredients: '250 g de skyr natural, 80 g de frutos rojos, 15 g de nueces, 30 g de avena',
    kcal: 420,
    proteinG: 33,
  },
  {
    id: 'tortitas-proteicas',
    slot: 'desayuno',
    name: 'Tortitas de avena y proteína de soja',
    ingredients: `50 g de harina de avena, 1 cacito de proteína de soja HSN, 2 claras, 1 huevo, canela`,
    kcal: 450,
    proteinG: 45,
  },
  // Comidas
  {
    id: 'pollo-arroz-verduras',
    slot: 'comida',
    name: 'Pollo a la plancha con arroz y verduras',
    ingredients: '180 g de pechuga de pollo, 80 g de arroz (en crudo), pimiento, calabacín, aceite de oliva',
    kcal: 650,
    proteinG: 48,
  },
  {
    id: 'lentejas-ternera',
    slot: 'comida',
    name: 'Lentejas estofadas con ternera magra',
    ingredients: '80 g de lentejas (en crudo), 120 g de ternera magra, zanahoria, cebolla, pimentón',
    kcal: 620,
    proteinG: 50,
  },
  {
    id: 'pasta-atun-tomate',
    slot: 'comida',
    name: 'Pasta integral con atún y tomate',
    ingredients: '90 g de pasta integral (en crudo), 2 latas de atún al natural, tomate triturado, orégano',
    kcal: 640,
    proteinG: 52,
  },
  {
    id: 'garbanzos-pollo-espinacas',
    slot: 'comida',
    name: 'Garbanzos salteados con pollo y espinacas',
    ingredients: '200 g de garbanzos cocidos, 150 g de pollo, espinacas, ajo, comino',
    kcal: 600,
    proteinG: 50,
  },
  {
    id: 'bowl-tofu-quinoa',
    slot: 'comida',
    name: 'Bowl de quinoa con tofu y edamame',
    ingredients: '70 g de quinoa (en crudo), 150 g de tofu firme, 80 g de edamame, salsa de soja',
    kcal: 590,
    proteinG: 38,
  },
  // Meriendas
  {
    id: 'batido-soja-platano',
    slot: 'merienda',
    name: 'Batido de proteína de soja con plátano',
    ingredients: `1 cacito (${SOY_SCOOP.grams} g) de proteína de soja HSN, 1 plátano, 300 ml de agua o bebida de soja`,
    kcal: 230,
    proteinG: 28,
  },
  {
    id: 'batido-soja-cacao-avena',
    slot: 'merienda',
    name: 'Batido de soja con cacao y avena',
    ingredients: `1 cacito de proteína de soja HSN, 30 g de avena, 1 cucharada de cacao puro, 300 ml de bebida de soja`,
    kcal: 340,
    proteinG: 36,
  },
  {
    id: 'requeson-miel-nueces',
    slot: 'merienda',
    name: 'Requesón con miel y nueces',
    ingredients: '200 g de requesón, 1 cucharadita de miel, 15 g de nueces',
    kcal: 330,
    proteinG: 26,
  },
  // Cenas
  {
    id: 'salmon-patata-brocoli',
    slot: 'cena',
    name: 'Salmón al horno con patata y brócoli',
    ingredients: '150 g de salmón, 200 g de patata, 150 g de brócoli',
    kcal: 560,
    proteinG: 36,
  },
  {
    id: 'tortilla-claras-ensalada',
    slot: 'cena',
    name: 'Tortilla de claras y huevo con ensalada',
    ingredients: '200 ml de claras, 1 huevo, espinacas, ensalada con tomate y aceite de oliva, 1 rebanada de pan',
    kcal: 380,
    proteinG: 34,
  },
  {
    id: 'merluza-verduras',
    slot: 'cena',
    name: 'Merluza a la plancha con verduras salteadas',
    ingredients: '200 g de merluza, judías verdes, champiñones, 100 g de patata',
    kcal: 380,
    proteinG: 40,
  },
  {
    id: 'wrap-pavo-hummus',
    slot: 'cena',
    name: 'Wrap integral de pavo y hummus',
    ingredients: '1 tortilla integral grande, 120 g de pechuga de pavo, 40 g de hummus, lechuga, tomate',
    kcal: 450,
    proteinG: 38,
  },
  {
    id: 'revuelto-tofu-verduras',
    slot: 'cena',
    name: 'Revuelto de tofu con verduras y pan integral',
    ingredients: '200 g de tofu firme, pimiento, cebolla, cúrcuma, 1 rebanada de pan integral',
    kcal: 420,
    proteinG: 32,
  },
];
