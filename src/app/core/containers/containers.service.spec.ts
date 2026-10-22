import { addDefaultContainers } from './containers.service';

describe('addDefaultContainers', () => {
  it('añade el plato marrón y la taza una sola vez', () => {
    const first = addDefaultContainers([{ id: 'plato-hondo', name: 'Plato hondo blanco', grams: 320 }], []);
    expect(first.list.map((c) => [c.name, c.grams])).toEqual([
      ['Plato hondo blanco', 320],
      ['Plato transparente marrón', 396],
      ['Taza', 179],
    ]);
    // Si luego borras la taza, no vuelve.
    const again = addDefaultContainers(first.list.filter((c) => c.id !== 'taza'), first.added);
    expect(again.list.some((c) => c.id === 'taza')).toBe(false);
  });

  it('no duplica uno que ya tengas con el mismo nombre', () => {
    const { list } = addDefaultContainers([{ id: 'x', name: 'taza', grams: 180 }], []);
    expect(list.filter((c) => c.name.toLowerCase() === 'taza').length).toBe(1);
  });
});
