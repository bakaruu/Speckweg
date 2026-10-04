import { isBarcode, macrosForGrams, parseOffProduct, slotForHour } from './food';

describe('food', () => {
  it('convierte un producto de Open Food Facts con sus macros por 100 g', () => {
    const food = parseOffProduct({
      code: '8480000123456',
      product_name: 'Yogur natural',
      brands: 'Hacendado, Mercadona',
      serving_size: '125 g',
      serving_quantity: '125',
      nutriments: {
        'energy-kcal_100g': 61,
        proteins_100g: 3.6,
        carbohydrates_100g: '4,7',
        fat_100g: 3.1,
      },
    });
    expect(food).toEqual({
      code: '8480000123456',
      name: 'Yogur natural',
      brand: 'Hacendado',
      kcal100: 61,
      protein100: 3.6,
      carbs100: 4.7,
      fat100: 3.1,
      servingG: 125,
      servingLabel: '125 g',
    });
  });

  it('prefiere el nombre en español y calcula las kcal desde kJ si faltan', () => {
    const food = parseOffProduct({
      code: '1',
      product_name: 'Natural yoghurt',
      product_name_es: 'Yogur natural',
      nutriments: { energy_100g: 418.4 },
    });
    expect(food?.name).toBe('Yogur natural');
    expect(food?.kcal100).toBe(100);
    expect(food?.servingG).toBeUndefined();
  });

  it('descarta productos sin nombre o sin calorías', () => {
    expect(parseOffProduct({ code: '1', product_name: 'Algo', nutriments: {} })).toBeUndefined();
    expect(parseOffProduct({ code: '1', nutriments: { 'energy-kcal_100g': 50 } })).toBeUndefined();
  });

  it('calcula los macros de los gramos apuntados', () => {
    const food = parseOffProduct({
      code: '1',
      product_name: 'Atún',
      nutriments: {
        'energy-kcal_100g': 200,
        proteins_100g: 25,
        carbohydrates_100g: 0,
        fat_100g: 11,
      },
    })!;
    expect(macrosForGrams(food, 52)).toEqual({ kcal: 104, proteinG: 13, carbsG: 0, fatG: 6 });
  });

  it('reconoce códigos de barras y la comida según la hora', () => {
    expect(isBarcode('8480000123456')).toBe(true);
    expect(isBarcode('yogur 0%')).toBe(false);
    expect(slotForHour(8)).toBe('desayuno');
    expect(slotForHour(14)).toBe('comida');
    expect(slotForHour(18)).toBe('merienda');
    expect(slotForHour(22)).toBe('cena');
  });
});
