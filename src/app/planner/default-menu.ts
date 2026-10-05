import { Dish, DishLine, Ingredient } from './menu-model';

/**
 * Menú inicial. Desde la pantalla Menú se puede cambiar todo: ingredientes, medidas caseras y platos.
 * Valores aproximados por 100 g.
 */
export const DEFAULT_INGREDIENTS: Ingredient[] = [
  // Proteína de soja HSN (Evosoy): unos 110 kcal y 26 g de proteína por 30 g. Revisa la etiqueta de tu bote.
  { id: 'proteina-soja-hsn', name: 'Proteína de soja HSN', kcal100: 367, protein100: 87, measure: { name: 'cacito', grams: 30 } },
  { id: 'avena', name: 'Copos de avena', kcal100: 375, protein100: 13, measure: { name: 'cazo', grams: 50 } },
  { id: 'leche', name: 'Leche semidesnatada', kcal100: 46, protein100: 3.2, measure: { name: 'vaso', grams: 250 } },
  { id: 'platano', name: 'Plátano', kcal100: 89, protein100: 1.1, measure: { name: 'unidad', grams: 120 } },
  { id: 'fruta', name: 'Fruta (manzana, naranja…)', kcal100: 50, protein100: 0.5, measure: { name: 'pieza', grams: 180 } },
  { id: 'pan', name: 'Pan', kcal100: 260, protein100: 9, measure: { name: 'rebanada', grams: 40 } },
  { id: 'tomate', name: 'Tomate rallado', kcal100: 20, protein100: 1, measure: { name: 'cucharada', grams: 20 } },
  { id: 'aceite', name: 'Aceite de oliva', kcal100: 884, protein100: 0, measure: { name: 'cucharada', grams: 10 } },
  { id: 'pavo', name: 'Pechuga de pavo (fiambre)', kcal100: 105, protein100: 20, measure: { name: 'loncha', grams: 15 } },
  { id: 'yogur', name: 'Yogur natural', kcal100: 61, protein100: 3.6, measure: { name: 'yogur', grams: 125 } },
  { id: 'frutos-secos', name: 'Nueces o almendras', kcal100: 620, protein100: 18, measure: { name: 'puñado', grams: 20 } },
  { id: 'queso', name: 'Queso en lonchas', kcal100: 350, protein100: 25, measure: { name: 'loncha', grams: 20 } },
  { id: 'queso-rallado', name: 'Queso rallado', kcal100: 400, protein100: 28, measure: { name: 'puñado', grams: 20 } },
  { id: 'huevo', name: 'Huevo', kcal100: 143, protein100: 12.6, measure: { name: 'huevo', grams: 55 } },
  { id: 'brocoli', name: 'Brócoli', kcal100: 34, protein100: 2.8, measure: { name: 'ración', grams: 150 } },
  { id: 'atun', name: 'Atún al natural', kcal100: 110, protein100: 25, measure: { name: 'lata', grams: 80 } },
  { id: 'pollo', name: 'Pechuga de pollo', kcal100: 110, protein100: 23, measure: { name: 'filete', grams: 100 } },
  { id: 'gambas', name: 'Gambas peladas', kcal100: 85, protein100: 18, measure: { name: 'ración', grams: 100 } },
  { id: 'jamon', name: 'Jamón serrano', kcal100: 240, protein100: 30, measure: { name: 'loncha', grams: 15 } },
  { id: 'espaguetis', name: 'Espaguetis (en crudo)', kcal100: 355, protein100: 12, measure: { name: 'ración', grams: 90 } },
  { id: 'arroz', name: 'Arroz (en crudo)', kcal100: 350, protein100: 7, measure: { name: 'ración', grams: 80 } },
  { id: 'pure', name: 'Puré de patatas', kcal100: 90, protein100: 2, measure: { name: 'cazo', grams: 200 } },
  { id: 'pesto', name: 'Salsa pesto', kcal100: 450, protein100: 5, measure: { name: 'cucharada', grams: 15 } },
  { id: 'champinones', name: 'Champiñones', kcal100: 22, protein100: 3, measure: { name: 'ración', grams: 100 } },
  { id: 'sardina', name: 'Sardina', kcal100: 200, protein100: 25, measure: { name: 'sardina', grams: 50 } },
  { id: 'melon', name: 'Melón', kcal100: 34, protein100: 0.8, measure: { name: 'tajada', grams: 200 } },
  // Guisos caseros: valores del plato ya hecho.
  { id: 'lentejas', name: 'Lentejas estofadas', kcal100: 120, protein100: 6.3, measure: { name: 'plato hondo', grams: 400 } },
  { id: 'puchero', name: 'Puchero', kcal100: 144, protein100: 8.9, measure: { name: 'plato hondo', grams: 450 } },
  { id: 'estofado', name: 'Estofado de ternera con patatas', kcal100: 138, protein100: 8.8, measure: { name: 'plato hondo', grams: 400 } },
  { id: 'carne-tomate', name: 'Carne con tomate y patatas', kcal100: 140, protein100: 8.5, measure: { name: 'plato', grams: 400 } },
  { id: 'migas', name: 'Migas', kcal100: 200, protein100: 2.7, measure: { name: 'plato', grams: 300 } },
];

const m = (ingredientId: string, amount = 1): DishLine => ({ ingredientId, amount, unit: 'medida' });
const g = (ingredientId: string, grams: number): DishLine => ({ ingredientId, amount: grams, unit: 'g' });

export const DEFAULT_DISHES: Dish[] = [
  // Desayunos
  { id: 'avena-leche-platano', slot: 'desayuno', name: 'Avena con leche y plátano', portion: '1 tazón', notes: 'Con canela', lines: [m('avena'), m('leche'), m('platano')] },
  { id: 'batido-soja-avena-platano', slot: 'desayuno', name: 'Batido de soja con avena y plátano', portion: '1 vaso grande', lines: [m('proteina-soja-hsn'), g('avena', 40), m('platano'), g('leche', 300)] },
  { id: 'tostadas-tomate-pavo', slot: 'desayuno', name: 'Tostadas con tomate y pavo', portion: '2 tostadas', lines: [m('pan', 2), m('tomate', 2), m('aceite'), m('pavo', 4)] },
  { id: 'yogur-fruta-avena', slot: 'desayuno', name: 'Yogur con fruta y avena', portion: '1 bol', lines: [m('yogur', 2), m('fruta'), g('avena', 30)] },
  { id: 'tostada-huevo-brocoli', slot: 'desayuno', name: 'Tostada con revuelto de huevo y brócoli', portion: '1 tostada con revuelto', notes: 'El brócoli picado y salteado con ajo', lines: [m('huevo', 2), g('brocoli', 80), m('pan'), g('aceite', 5)] },

  // Comidas
  { id: 'lentejas', slot: 'comida', name: 'Lentejas', portion: '1 plato hondo', usual: true, lines: [m('lentejas')] },
  { id: 'puchero', slot: 'comida', name: 'Puchero', portion: '1 plato hondo', usual: true, lines: [m('puchero')] },
  { id: 'estofado', slot: 'comida', name: 'Estofado de ternera con patatas', portion: '1 plato hondo', usual: true, lines: [m('estofado')] },
  { id: 'carne-tomate-patatas', slot: 'comida', name: 'Carne con tomate y patatas', portion: '1 plato', usual: true, lines: [m('carne-tomate')] },
  { id: 'pollo-pure', slot: 'comida', name: 'Filetes de pollo a la plancha con puré de patatas', portion: '2 filetes + 1 cazo de puré', usual: true, lines: [m('pollo', 2), m('pure'), m('aceite')] },
  { id: 'migas-sardinas-melon', slot: 'comida', name: 'Migas con sardinas y melón', portion: '1 plato + 2 sardinas', usual: true, lines: [m('migas'), m('sardina', 2), m('melon')] },
  { id: 'espaguetis-pesto', slot: 'comida', name: 'Espaguetis con salsa pesto', portion: '1 plato', usual: true, lines: [g('espaguetis', 100), m('pesto', 2)] },
  { id: 'arroz-champinones-huevo', slot: 'comida', name: 'Arroz blanco con champiñones y huevo frito', portion: '1 plato + 1 huevo', usual: true, lines: [m('arroz'), m('champinones'), m('huevo'), m('aceite')] },
  { id: 'pollo-brocoli-salteado', slot: 'comida', name: 'Pollo salteado con brócoli y ajo', portion: '1 plato', notes: 'Saltea el brócoli en ramitos con ajo a fuego fuerte hasta que se dore, añade el pollo en tiras y un chorrito de soja', lines: [g('pollo', 180), g('brocoli', 200), m('aceite'), g('arroz', 60)] },
  { id: 'pasta-brocoli-atun', slot: 'comida', name: 'Espaguetis con brócoli asado y atún', portion: '1 plato', notes: 'Brócoli al horno o airfryer, 200 °C 12 min con aceite y ajo', lines: [m('espaguetis'), m('brocoli'), m('atun'), m('aceite'), g('queso-rallado', 10)] },

  // Meriendas
  { id: 'batido-soja-platano', slot: 'merienda', name: 'Batido de proteína de soja con plátano', portion: '1 vaso grande', lines: [m('proteina-soja-hsn'), m('platano'), g('leche', 300)] },
  { id: 'yogur-frutos-secos', slot: 'merienda', name: 'Yogur con un puñado de frutos secos', portion: '1 yogur + 1 puñado', lines: [m('yogur'), m('frutos-secos')] },
  { id: 'bocadillo-pavo', slot: 'merienda', name: 'Bocadillo pequeño de pavo y queso', portion: '1 bocadillo pequeño', lines: [m('pan', 2), m('pavo', 3), m('queso')] },
  { id: 'tostada-tomate-atun', slot: 'merienda', name: 'Tostada con tomate y atún', portion: '1 tostada', lines: [m('pan'), m('tomate', 2), m('atun')] },
  { id: 'fruta-batido-soja', slot: 'merienda', name: 'Pieza de fruta y batido de soja con agua', portion: '1 fruta + 1 vaso', lines: [m('fruta'), m('proteina-soja-hsn')] },

  // Cenas
  { id: 'jamon-atun', slot: 'cena', name: 'Jamón y atún', portion: '1 plato', usual: true, lines: [m('jamon', 4), m('atun'), m('pan')] },
  { id: 'tortilla-francesa', slot: 'cena', name: 'Tortilla francesa', portion: '1 tortilla de 2 huevos', usual: true, lines: [m('huevo', 2), g('aceite', 5), m('pan')] },
  { id: 'huevos-duros', slot: 'cena', name: 'Huevos duros', portion: '3 huevos', usual: true, lines: [m('huevo', 3), g('aceite', 5)] },
  { id: 'sandwich-pavo', slot: 'cena', name: 'Sándwich de pavo', portion: '1 sándwich', usual: true, lines: [g('pan', 60), m('pavo', 4), m('queso')] },
  { id: 'brocoli-horno-huevos', slot: 'cena', name: 'Brócoli crujiente al horno con huevos duros', portion: '1 plato + 2 huevos', notes: 'Brócoli en ramitos con aceite, ajo en polvo y pimentón, al horno o airfryer 200 °C 12-15 min', lines: [g('brocoli', 200), m('aceite'), m('huevo', 2)] },
  { id: 'tortilla-brocoli-queso', slot: 'cena', name: 'Tortilla de brócoli y queso', portion: '1 tortilla de 3 huevos', notes: 'El brócoli picado y salteado antes en la sartén', lines: [m('huevo', 3), g('brocoli', 100), m('queso-rallado'), g('aceite', 5)] },
  { id: 'revuelto-brocoli-gambas', slot: 'cena', name: 'Revuelto de brócoli con gambas y ajo', portion: '1 plato', notes: 'Vale con gambas congeladas', lines: [g('brocoli', 120), m('gambas'), m('huevo', 2), g('aceite', 5)] },
  { id: 'brocoli-gratinado-jamon', slot: 'cena', name: 'Brócoli gratinado con jamón y queso', portion: '1 fuente pequeña', notes: 'Al horno 10 min hasta que se dore el queso', lines: [g('brocoli', 220), m('jamon', 3), m('queso-rallado', 2)] },
];
