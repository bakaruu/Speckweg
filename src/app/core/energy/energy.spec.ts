import {
  balance,
  EnergyDay,
  mergeEnergy,
  parseDailyTotals,
  ringFraction,
  withoutFirstDay,
} from './energy';

describe('parseDailyTotals', () => {
  it('lee una línea por día agrupada por el Atajo', () => {
    const totals = parseDailyTotals('4 oct 2026, 0:00;1683.2\n5 oct 2026, 0:00; 1650,4 kcal\n');
    expect([...totals]).toEqual([
      ['2026-10-04', 1683.2],
      ['2026-10-05', 1650.4],
    ]);
  });

  it('lee las líneas reales del Atajo de Aru', () => {
    const totals = parseDailyTotals(
      '28 sept 2026, 0:03; 2296.885000000001\n5 oct 2026, 0:13; 1629.429999999994\n',
    );
    expect(totals.get('2026-09-28')).toBeCloseTo(2296.885);
    expect(totals.get('2026-10-05')).toBeCloseTo(1629.43);
  });

  it('suma las muestras sueltas por el día en que empiezan', () => {
    const text = [
      '5 oct 2026, 9:01;5 oct 2026, 9:02; 4.5',
      '5 oct 2026, 9:02;5 oct 2026, 9:03; 5.5',
      '6 oct 2026, 0:01;6 oct 2026, 0:02; 1',
    ].join('\n');
    expect(parseDailyTotals(text).get('2026-10-05')).toBe(10);
    expect(parseDailyTotals(text).get('2026-10-06')).toBe(1);
  });

  it('pasa kJ a kcal y se salta lo que no entiende', () => {
    const totals = parseDailyTotals('hola\n5 oct 2026, 0:00;4184 kJ\n;;\n');
    expect(totals.get('2026-10-05')).toBeCloseTo(1000);
    expect(totals.size).toBe(1);
  });
});

describe('withoutFirstDay', () => {
  it('quita el día más antiguo, que en energia.txt está a medias', () => {
    const totals = new Map([
      ['2026-10-05', 300],
      ['2026-10-03', 120],
      ['2026-10-04', 500],
    ]);
    expect([...withoutFirstDay(totals).keys()]).toEqual(['2026-10-05', '2026-10-04']);
  });
});

describe('mergeEnergy', () => {
  it('sustituye el valor de ese día sin perder el otro tipo', () => {
    let log: EnergyDay[] = [{ date: '2026-10-05', restingKcal: 900, activeKcal: 200 }];
    log = mergeEnergy(log, new Map([['2026-10-05', 1650.4]]), 'restingKcal');
    log = mergeEnergy(log, new Map([['2026-10-04', 410]]), 'activeKcal');
    expect(log).toEqual([
      { date: '2026-10-04', activeKcal: 410 },
      { date: '2026-10-05', restingKcal: 1650, activeKcal: 200 },
    ]);
  });
});

describe('balance', () => {
  const now = new Date(2026, 9, 5, 14, 30);
  const profile = {
    sex: 'hombre' as const,
    heightCm: 180,
    birthYear: 1995,
    goal: 'perder' as const,
  };

  it('compara lo comido con lo gastado hoy y calcula lo que queda con la media del reloj', () => {
    const result = balance({
      eatenKcal: 1200,
      yesterdayEatenKcal: 1900,
      log: [
        { date: '2026-10-03', restingKcal: 2000, activeKcal: 600 },
        { date: '2026-10-04', restingKcal: 2000, activeKcal: 400 },
        { date: '2026-10-05', restingKcal: 1650, activeKcal: 319 },
      ],
      profile,
      weightKg: 97.5,
      now,
    });
    expect(result.today).toEqual({
      restingKcal: 1650,
      activeKcal: 319,
      spentKcal: 1969,
      netKcal: -769,
    });
    expect(result.dailySpendKcal).toBe(2500);
    expect(result.spendSource).toBe('reloj');
    expect(result.targetKcal).toBe(2130); // 85 % de 2500
    expect(result.remainingKcal).toBe(930);
    expect(result.yesterday).toEqual({ eatenKcal: 1900, spentKcal: 2400, netKcal: -500 });
  });

  it('sin días del reloj usa la estimación del perfil', () => {
    const result = balance({ eatenKcal: 0, log: [], profile, weightKg: 97.5, now });
    expect(result.today).toBeUndefined();
    expect(result.spendSource).toBe('estimado');
    expect(result.targetKcal).toBeGreaterThan(0);
    expect(result.yesterday).toBeUndefined();
  });

  it('sin perfil ni datos del reloj no inventa un objetivo', () => {
    const result = balance({ eatenKcal: 500, log: [], profile: {}, now });
    expect(result.targetKcal).toBeUndefined();
    expect(result.remainingKcal).toBeUndefined();
  });
});

describe('ringFraction', () => {
  it('rellena el anillo entre 0 y 1', () => {
    expect(ringFraction(400, 800)).toBe(0.5);
    expect(ringFraction(1200, 800)).toBe(1);
    expect(ringFraction(100, undefined)).toBe(0);
  });
});
