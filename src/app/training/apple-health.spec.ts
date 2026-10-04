import { kcalDuring, parseDate, parseEnergyFile } from './apple-health';

describe('Apple Watch', () => {
  const file = [
    '2026-10-04T18:00:00+02:00;2026-10-04T18:10:00+02:00;50 kcal',
    '2026-10-04T18:10:00+02:00;2026-10-04T18:20:00+02:00;40,5 kcal',
    'línea rota',
    '2026-10-04T18:55:00+02:00;2026-10-04T19:05:00+02:00;20',
    '2026-10-04T20:00:00+02:00;2026-10-04T20:10:00+02:00;100 kJ',
  ].join('\n');

  it('lee las muestras del Atajo con coma decimal, unidades y kJ', () => {
    const samples = parseEnergyFile(file);
    expect(samples.length).toBe(4);
    expect(samples[1].kcal).toBe(40.5);
    expect(Math.round(samples[3].kcal)).toBe(24);
  });

  it('suma las kcal del entreno y reparte las que quedan a caballo', () => {
    const samples = parseEnergyFile(file);
    // Entreno de 18:00 a 19:00 (16:00 a 17:00 en UTC): 50 + 40,5 + la mitad de 20.
    expect(kcalDuring(samples, '2026-10-04T16:00:00.000Z', '2026-10-04T17:00:00.000Z')).toBe(101);
  });

  it('no da nada si el reloj no tiene datos de ese rato', () => {
    expect(
      kcalDuring(parseEnergyFile(file), '2026-10-05T16:00:00.000Z', '2026-10-05T17:00:00.000Z'),
    ).toBeUndefined();
  });

  it('entiende la fecha por defecto del iPhone en español', () => {
    const expected = new Date(2026, 9, 4, 18, 30).getTime();
    expect(parseDate('4 oct 2026, 18:30')).toBe(expected);
    expect(parseDate('4 oct. 2026 18:30')).toBe(expected);
    expect(parseDate('4 de octubre de 2026, 18:30')).toBe(expected);
    expect(parseDate('4/10/2026, 18:30')).toBe(expected);
    expect(parseDate('4 sept 2026, 18:30')).toBe(new Date(2026, 8, 4, 18, 30).getTime());
  });

  it('lee el archivo con fechas por defecto y valores sin unidad', () => {
    const samples = parseEnergyFile(
      '4 oct 2026, 18:00;4 oct 2026, 18:01;9,5\n4 oct 2026, 18:01;4 oct 2026, 18:01;3',
    );
    expect(samples.map((s) => s.kcal)).toEqual([9.5, 3]);
    expect(
      kcalDuring(
        samples,
        new Date(2026, 9, 4, 17).toISOString(),
        new Date(2026, 9, 4, 19).toISOString(),
      ),
    ).toBe(13);
  });
});
