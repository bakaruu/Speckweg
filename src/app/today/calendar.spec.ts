import { addDays, monthGrid, startOfDay } from './calendar';

describe('monthGrid', () => {
  it('empieza en lunes y rellena con los días de los meses de al lado', () => {
    // Octubre de 2026 empieza en jueves y acaba en sábado.
    const weeks = monthGrid(2026, 9);
    expect(weeks.length).toBe(5);
    expect(weeks[0][0]).toEqual({ iso: '2026-09-28', day: 28, inMonth: false });
    expect(weeks[0][3]).toEqual({ iso: '2026-10-01', day: 1, inMonth: true });
    expect(weeks[4][6]).toEqual({ iso: '2026-11-01', day: 1, inMonth: false });
    expect(weeks.every((w) => w.length === 7)).toBe(true);
  });

  it('no añade una semana de más cuando el mes acaba en domingo', () => {
    // Mayo de 2026 acaba en domingo 31.
    const weeks = monthGrid(2026, 4);
    expect(weeks.at(-1)?.at(-1)).toEqual({ iso: '2026-05-31', day: 31, inMonth: true });
  });
});

describe('addDays', () => {
  it('cambia de mes y deja la hora a 00:00', () => {
    const next = addDays(new Date(2026, 9, 31, 22, 15), 1);
    expect(next).toEqual(new Date(2026, 10, 1));
    expect(startOfDay(new Date(2026, 9, 6, 22, 12))).toEqual(new Date(2026, 9, 6));
  });
});
