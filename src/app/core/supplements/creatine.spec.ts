import { creatineStreak } from './creatine';

describe('creatineStreak', () => {
  const days = new Set(['2026-10-03', '2026-10-05', '2026-10-06', '2026-10-07']);

  it('cuenta los días seguidos hasta el día elegido', () => {
    expect(creatineStreak(days, new Date(2026, 9, 7))).toBe(3);
    expect(creatineStreak(days, new Date(2026, 9, 3))).toBe(1);
  });

  it('si ese día aún no está marcado, cuenta hasta el anterior', () => {
    expect(creatineStreak(days, new Date(2026, 9, 8))).toBe(3);
  });

  it('sin días seguidos da cero', () => {
    expect(creatineStreak(days, new Date(2026, 9, 10))).toBe(0);
    expect(creatineStreak(new Set(), new Date(2026, 9, 7))).toBe(0);
  });
});
