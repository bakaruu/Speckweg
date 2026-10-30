import { addDefaultContainers } from './containers.service';

describe('addDefaultContainers', () => {
  it('añade el plato marrón y la taza una sola vez', () => {
    const first = addDefaultContainers([{ id: 'plato-hondo', name: 'Plato hondo blanco', grams: 320 }], []);
    expect(first.list.map((c) => [c.name, c.grams])).toEqual([
      ['Plato hondo blanco', 320],
      ['Plato transparente marrón hondo', 396],
      ['Taza', 179],
      ['Plato blanco ondulado', 363],
      ['Plato grande con dibujo marrón', 435],
      ['Plato pequeño con dibujo marrón', 277],
      ['Plato transparente marrón plano', 460],
      ['Vaso de la batidora', 153],
      ['Plato de postre con dibujo marrón en el centro', 176],
      ['Bol de cristal con asa', 199],
    ]);
    // Si luego borras la taza, no vuelve.
    const again = addDefaultContainers(first.list.filter((c) => c.id !== 'taza'), first.added);
    expect(again.list.some((c) => c.id === 'taza')).toBe(false);
  });

  it('a quien ya tenía el plato marrón y la taza le añade solo los nuevos', () => {
    const before = [
      { id: 'plato-transparente-marron', name: 'Plato transparente marrón', grams: 396 },
      { id: 'taza', name: 'Taza', grams: 179 },
    ];
    const { list } = addDefaultContainers(before, ['plato-transparente-marron', 'taza']);
    expect(list.length).toBe(9);
    expect(list[0].name).toBe('Plato transparente marrón hondo');
    expect(list.find((c) => c.id === 'vaso-batidora')?.grams).toBe(153);
  });

  it('no duplica uno que ya tengas con el mismo nombre', () => {
    const { list } = addDefaultContainers([{ id: 'x', name: 'taza', grams: 180 }], []);
    expect(list.filter((c) => c.name.toLowerCase() === 'taza').length).toBe(1);
  });
});
