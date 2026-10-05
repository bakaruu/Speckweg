import { addWeight, bmr, dailyKcal, parseWeightFile, weightChange, WeightEntry } from './body';

describe('body', () => {
  const today = new Date(2026, 9, 5);

  it('calcula el metabolismo basal con Mifflin-St Jeor', () => {
    expect(bmr('hombre', 80, 180, 30)).toBe(1780);
    expect(bmr('mujer', 60, 165, 30)).toBe(1320);
  });

  it('ajusta las kcal según el objetivo y pide los datos que faltan', () => {
    const profile = { sex: 'hombre' as const, heightCm: 180, birthYear: 1996 };
    const keep = dailyKcal({ ...profile, goal: 'mantener' }, 80, today)!;
    const lose = dailyKcal({ ...profile, goal: 'perder' }, 80, today)!;
    expect(keep.basal).toBe(1780);
    expect(lose.target).toBeLessThan(keep.target);
    expect(dailyKcal({ sex: 'hombre' }, 80, today)).toBeUndefined();
  });

  it('guarda un peso por día y calcula el cambio', () => {
    let log: WeightEntry[] = [];
    log = addWeight(log, { date: '2026-09-20', kg: 81, source: 'manual' });
    log = addWeight(log, { date: '2026-10-05', kg: 79.6, source: 'salud' });
    log = addWeight(log, { date: '2026-10-05', kg: 79.4, source: 'salud' });
    expect(log.map((e) => e.kg)).toEqual([81, 79.4]);
    expect(weightChange(log, 30, today)).toBe(-1.6);
  });

  it('lee el peso que deja el Atajo', () => {
    const log = parseWeightFile('5 oct 2026, 8:10;72,4 kg\n4 oct 2026, 8:00;160 lb\nbasura');
    expect(log).toEqual([
      { date: '2026-10-04', kg: 72.6, source: 'salud' },
      { date: '2026-10-05', kg: 72.4, source: 'salud' },
    ]);
  });
});
