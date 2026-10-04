export type MealSlot = 'desayuno' | 'comida' | 'merienda' | 'cena';

export interface MealIdea {
  id: string;
  slot: MealSlot;
  name: string;
  /** Ingredientes y cómo hacerlo, para una ración normal. */
  ingredients: string;
  /** Ración normal en medida casera, por ejemplo "1 plato hondo". */
  portion: string;
  /** Peso aproximado de esa ración normal, para poder apuntar en gramos. */
  portionG: number;
  /** Valores aproximados por ración normal. */
  kcal: number;
  proteinG: number;
  /** Plato que Aru ya suele comer. */
  usual?: boolean;
}

/**
 * Batido con la proteína de soja de HSN (Evosoy).
 * Valores aproximados por cacito de 30 g: revisa la etiqueta de tu bote y ajústalos aquí.
 */
export const SOY_SCOOP = { grams: 30, kcal: 110, proteinG: 26 };

/**
 * Catálogo de platos: las comidas y cenas de siempre de Aru, desayunos y meriendas baratos
 * de supermercado, y brócoli hecho de formas que no sean cocido. Valores aproximados por ración.
 */
export const MEAL_CATALOG: MealIdea[] = [
  // Desayunos
  {
    id: 'avena-leche-platano',
    slot: 'desayuno',
    name: 'Avena con leche y plátano',
    ingredients: '50 g de copos de avena, 250 ml de leche, 1 plátano, canela',
    portion: '1 tazón',
    portionG: 420,
    kcal: 450,
    proteinG: 17,
  },
  {
    id: 'batido-soja-avena-platano',
    slot: 'desayuno',
    name: 'Batido de soja con avena y plátano',
    ingredients: `1 cacito (${SOY_SCOOP.grams} g) de proteína de soja HSN, 40 g de avena, 1 plátano, 300 ml de leche`,
    portion: '1 vaso grande',
    portionG: 500,
    kcal: 530,
    proteinG: 43,
  },
  {
    id: 'tostadas-tomate-pavo',
    slot: 'desayuno',
    name: 'Tostadas con tomate y pavo',
    ingredients: '2 rebanadas de pan, tomate rallado, un chorrito de aceite, 60 g de pechuga de pavo',
    portion: '2 tostadas',
    portionG: 180,
    kcal: 380,
    proteinG: 20,
  },
  {
    id: 'yogur-fruta-avena',
    slot: 'desayuno',
    name: 'Yogur con fruta y avena',
    ingredients: '2 yogures naturales (o 1 skyr), 1 pieza de fruta troceada, 30 g de avena',
    portion: '1 bol',
    portionG: 400,
    kcal: 380,
    proteinG: 17,
  },
  {
    id: 'tostada-huevo-brocoli',
    slot: 'desayuno',
    name: 'Tostada con revuelto de huevo y brócoli',
    ingredients: '2 huevos revueltos con un puñado de brócoli picado y salteado con ajo, 1 rebanada de pan',
    portion: '1 tostada con revuelto',
    portionG: 220,
    kcal: 340,
    proteinG: 19,
  },

  // Comidas
  {
    id: 'lentejas',
    slot: 'comida',
    name: 'Lentejas',
    ingredients: 'Lentejas estofadas con verduras',
    portion: '1 plato hondo',
    portionG: 400,
    kcal: 480,
    proteinG: 25,
    usual: true,
  },
  {
    id: 'puchero',
    slot: 'comida',
    name: 'Puchero',
    ingredients: 'Garbanzos, pollo, ternera, verduras y caldo',
    portion: '1 plato hondo',
    portionG: 450,
    kcal: 650,
    proteinG: 40,
    usual: true,
  },
  {
    id: 'estofado',
    slot: 'comida',
    name: 'Estofado de ternera con patatas',
    ingredients: 'Ternera, patatas, zanahoria, cebolla y guisantes',
    portion: '1 plato hondo',
    portionG: 400,
    kcal: 550,
    proteinG: 35,
    usual: true,
  },
  {
    id: 'carne-tomate-patatas',
    slot: 'comida',
    name: 'Carne con tomate y patatas',
    ingredients: 'Ternera guisada en salsa de tomate con patatas',
    portion: '1 plato',
    portionG: 400,
    kcal: 560,
    proteinG: 34,
    usual: true,
  },
  {
    id: 'pollo-pure',
    slot: 'comida',
    name: 'Filetes de pollo a la plancha con puré de patatas',
    ingredients: '2 filetes de pechuga de pollo (unos 180 g) y 1 cazo de puré de patatas',
    portion: '2 filetes + 1 cazo de puré',
    portionG: 380,
    kcal: 560,
    proteinG: 48,
    usual: true,
  },
  {
    id: 'migas-sardinas-melon',
    slot: 'comida',
    name: 'Migas con sardinas y melón',
    ingredients: 'Migas de pan con ajo, 2 sardinas y una tajada de melón',
    portion: '1 plato + 2 sardinas',
    portionG: 450,
    kcal: 780,
    proteinG: 26,
    usual: true,
  },
  {
    id: 'espaguetis-pesto',
    slot: 'comida',
    name: 'Espaguetis con salsa pesto',
    ingredients: '100 g de espaguetis (en crudo) con 2 cucharadas de pesto',
    portion: '1 plato',
    portionG: 300,
    kcal: 640,
    proteinG: 19,
    usual: true,
  },
  {
    id: 'arroz-champinones-huevo',
    slot: 'comida',
    name: 'Arroz blanco con champiñones y huevo frito',
    ingredients: '80 g de arroz (en crudo), champiñones salteados, 1 huevo frito',
    portion: '1 plato + 1 huevo',
    portionG: 350,
    kcal: 600,
    proteinG: 18,
    usual: true,
  },
  {
    id: 'pollo-brocoli-salteado',
    slot: 'comida',
    name: 'Pollo salteado con brócoli y ajo',
    ingredients:
      'Saltea el brócoli en ramitos con ajo y aceite a fuego fuerte hasta que se dore, añade 180 g de pollo en tiras y un chorrito de soja. Con arroz o pan',
    portion: '1 plato',
    portionG: 380,
    kcal: 520,
    proteinG: 45,
  },
  {
    id: 'pasta-brocoli-atun',
    slot: 'comida',
    name: 'Espaguetis con brócoli asado y atún',
    ingredients:
      '90 g de espaguetis, brócoli asado al horno o airfryer (200 °C, 12 min con aceite y ajo), 1 lata de atún y parmesano',
    portion: '1 plato',
    portionG: 380,
    kcal: 620,
    proteinG: 36,
  },

  // Meriendas
  {
    id: 'batido-soja-platano',
    slot: 'merienda',
    name: 'Batido de proteína de soja con plátano',
    ingredients: `1 cacito (${SOY_SCOOP.grams} g) de proteína de soja HSN, 1 plátano, 300 ml de leche o agua`,
    portion: '1 vaso grande',
    portionG: 450,
    kcal: 330,
    proteinG: 36,
  },
  {
    id: 'yogur-frutos-secos',
    slot: 'merienda',
    name: 'Yogur con un puñado de frutos secos',
    ingredients: '1 yogur natural o skyr y 20 g de nueces o almendras',
    portion: '1 yogur + 1 puñado',
    portionG: 145,
    kcal: 230,
    proteinG: 12,
  },
  {
    id: 'bocadillo-pavo',
    slot: 'merienda',
    name: 'Bocadillo pequeño de pavo y queso',
    ingredients: 'Medio pan o 2 rebanadas, 40 g de pavo, 1 loncha de queso',
    portion: '1 bocadillo pequeño',
    portionG: 130,
    kcal: 300,
    proteinG: 18,
  },
  {
    id: 'tostada-tomate-atun',
    slot: 'merienda',
    name: 'Tostada con tomate y atún',
    ingredients: '1 rebanada de pan, tomate rallado, 1 lata de atún al natural',
    portion: '1 tostada',
    portionG: 140,
    kcal: 230,
    proteinG: 22,
  },
  {
    id: 'fruta-batido-soja',
    slot: 'merienda',
    name: 'Pieza de fruta y batido de soja con agua',
    ingredients: `1 manzana o 1 naranja y 1 cacito (${SOY_SCOOP.grams} g) de proteína de soja HSN con agua`,
    portion: '1 fruta + 1 vaso',
    portionG: 480,
    kcal: 190,
    proteinG: 27,
  },

  // Cenas
  {
    id: 'jamon-atun',
    slot: 'cena',
    name: 'Jamón y atún',
    ingredients: 'Unas lonchas de jamón serrano, 1 lata de atún y un poco de pan',
    portion: '1 plato',
    portionG: 200,
    kcal: 420,
    proteinG: 40,
    usual: true,
  },
  {
    id: 'tortilla-francesa',
    slot: 'cena',
    name: 'Tortilla francesa',
    ingredients: '2 huevos y 1 rebanada de pan',
    portion: '1 tortilla de 2 huevos',
    portionG: 150,
    kcal: 290,
    proteinG: 16,
    usual: true,
  },
  {
    id: 'huevos-duros',
    slot: 'cena',
    name: 'Huevos duros',
    ingredients: '3 huevos duros con un poco de sal y aceite',
    portion: '3 huevos',
    portionG: 150,
    kcal: 230,
    proteinG: 19,
    usual: true,
  },
  {
    id: 'sandwich-pavo',
    slot: 'cena',
    name: 'Sándwich de pavo',
    ingredients: '2 rebanadas de pan de molde, 60 g de pavo, 1 loncha de queso',
    portion: '1 sándwich',
    portionG: 150,
    kcal: 340,
    proteinG: 24,
    usual: true,
  },
  {
    id: 'brocoli-horno-huevos',
    slot: 'cena',
    name: 'Brócoli crujiente al horno con huevos duros',
    ingredients:
      'Brócoli en ramitos con aceite, ajo en polvo y pimentón, al horno o airfryer (200 °C, 12-15 min) hasta que se tueste. Con 2 huevos duros',
    portion: '1 plato + 2 huevos',
    portionG: 320,
    kcal: 330,
    proteinG: 20,
  },
  {
    id: 'tortilla-brocoli-queso',
    slot: 'cena',
    name: 'Tortilla de brócoli y queso',
    ingredients: '3 huevos, brócoli picado y salteado antes en la sartén, un puñado de queso rallado',
    portion: '1 tortilla de 3 huevos',
    portionG: 280,
    kcal: 400,
    proteinG: 28,
  },
  {
    id: 'revuelto-brocoli-gambas',
    slot: 'cena',
    name: 'Revuelto de brócoli con gambas y ajo',
    ingredients: 'Saltea brócoli y ajo, añade 100 g de gambas peladas (vale congeladas) y 2 huevos',
    portion: '1 plato',
    portionG: 300,
    kcal: 320,
    proteinG: 32,
  },
  {
    id: 'brocoli-gratinado-jamon',
    slot: 'cena',
    name: 'Brócoli gratinado con jamón y queso',
    ingredients: 'Brócoli en ramitos con taquitos de jamón y queso rallado por encima, al horno 10 min hasta que se dore',
    portion: '1 fuente pequeña',
    portionG: 300,
    kcal: 380,
    proteinG: 28,
  },
];
