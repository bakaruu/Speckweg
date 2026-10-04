// Recomendaciones fijas en local mientras no haya objetivos de calorías configurados.
// Los valores son aproximados por ración.

export interface Meal {
  slot: 'Desayuno' | 'Comida' | 'Merienda' | 'Cena';
  name: string;
  kcal: number;
  protein: number;
}

// Batido con un cacito (30 g) de proteína de soja de HSN.
const SOY_SHAKE = 'Batido de proteína de soja HSN (30 g)';

// Un menú por día de la semana, empezando en lunes.
const WEEK: Meal[][] = [
  [
    { slot: 'Desayuno', name: 'Avena con leche de soja, plátano y nueces', kcal: 450, protein: 18 },
    { slot: 'Comida', name: 'Pechuga de pollo a la plancha con arroz y brócoli', kcal: 650, protein: 45 },
    { slot: 'Merienda', name: `${SOY_SHAKE} con leche de soja y un plátano`, kcal: 330, protein: 34 },
    { slot: 'Cena', name: 'Tortilla de 3 huevos con espinacas y pan integral', kcal: 450, protein: 28 },
  ],
  [
    { slot: 'Desayuno', name: 'Tostadas integrales con huevo revuelto y tomate', kcal: 420, protein: 22 },
    { slot: 'Comida', name: 'Lentejas estofadas con verduras y huevo duro', kcal: 600, protein: 32 },
    { slot: 'Merienda', name: `${SOY_SHAKE} con avena y canela`, kcal: 300, protein: 30 },
    { slot: 'Cena', name: 'Salmón al horno con patata y judías verdes', kcal: 550, protein: 38 },
  ],
  [
    { slot: 'Desayuno', name: 'Yogur griego con frutos rojos y granola', kcal: 380, protein: 20 },
    { slot: 'Comida', name: 'Pasta integral con atún, tomate y aceitunas', kcal: 650, protein: 40 },
    { slot: 'Merienda', name: `${SOY_SHAKE} con leche y cacao puro`, kcal: 280, protein: 34 },
    { slot: 'Cena', name: 'Tofu salteado con verduras y quinoa', kcal: 500, protein: 30 },
  ],
  [
    { slot: 'Desayuno', name: 'Tortitas de avena con proteína de soja HSN (30 g)', kcal: 420, protein: 32 },
    { slot: 'Comida', name: 'Garbanzos con espinacas y pollo', kcal: 620, protein: 42 },
    { slot: 'Merienda', name: 'Requesón con miel y nueces', kcal: 250, protein: 18 },
    { slot: 'Cena', name: 'Merluza a la plancha con ensalada y aguacate', kcal: 450, protein: 35 },
  ],
  [
    { slot: 'Desayuno', name: 'Tostadas con aguacate y pavo', kcal: 430, protein: 24 },
    { slot: 'Comida', name: 'Arroz con ternera magra y pimientos', kcal: 680, protein: 42 },
    { slot: 'Merienda', name: `${SOY_SHAKE} con mantequilla de cacahuete`, kcal: 320, protein: 33 },
    { slot: 'Cena', name: 'Ensalada de quinoa con huevo, atún y tomate', kcal: 480, protein: 34 },
  ],
  [
    { slot: 'Desayuno', name: 'Huevos revueltos con champiñones y pan integral', kcal: 450, protein: 26 },
    { slot: 'Comida', name: 'Pollo al curry con arroz basmati', kcal: 700, protein: 45 },
    { slot: 'Merienda', name: 'Fruta y un puñado de almendras', kcal: 250, protein: 7 },
    { slot: 'Cena', name: 'Hamburguesa casera de pavo con ensalada', kcal: 520, protein: 38 },
  ],
  [
    { slot: 'Desayuno', name: 'Bol de proteína de soja HSN (30 g) con yogur y fruta', kcal: 400, protein: 38 },
    { slot: 'Comida', name: 'Paella de marisco', kcal: 650, protein: 35 },
    { slot: 'Merienda', name: 'Hummus con palitos de zanahoria', kcal: 220, protein: 8 },
    { slot: 'Cena', name: 'Revuelto de gambas y espárragos', kcal: 380, protein: 30 },
  ],
];

/** Menú recomendado para el día de `date`. */
export function mealsFor(date: Date): Meal[] {
  // getDay() empieza en domingo; WEEK empieza en lunes.
  return WEEK[(date.getDay() + 6) % 7];
}
