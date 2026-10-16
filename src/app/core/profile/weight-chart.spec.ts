import { WeightEntry } from './body';
import { buildChart, inRange, smoothPath, weightTrend } from './weight-chart';

const salud = (date: string, kg: number): WeightEntry => ({ date, kg, source: 'salud' });

describe('weight-chart', () => {
  it('suaviza los subidones de un día en la tendencia', () => {
    const points = weightTrend([salud('2026-10-01', 97), salud('2026-10-02', 99), salud('2026-10-03', 97)]);
    expect(points[0].trend).toBe(97);
    expect(points[1].trend).toBeCloseTo(97.2);
    expect(points[2].trend).toBeLessThan(97.2);
  });

  it('un pesaje tras varios días sin pesarse cuenta más', () => {
    const daily = weightTrend([salud('2026-10-01', 97), salud('2026-10-02', 96)]);
    const later = weightTrend([salud('2026-10-01', 97), salud('2026-10-11', 96)]);
    expect(later[1].trend).toBeLessThan(daily[1].trend);
  });

  it('ignora el peso antiguo sin fecha', () => {
    expect(weightTrend([{ date: 'antes', kg: 98, source: 'manual' }, salud('2026-10-01', 97)])).toHaveLength(1);
  });

  it('filtra el periodo elegido', () => {
    const points = weightTrend([salud('2026-06-01', 100), salud('2026-09-20', 98), salud('2026-10-15', 97)]);
    const today = new Date(2026, 9, 16);
    expect(inRange(points, '1m', today).map((p) => p.date)).toEqual(['2026-09-20', '2026-10-15']);
    expect(inRange(points, 'todo', today)).toHaveLength(3);
  });

  it('dibuja de izquierda a derecha por fecha y con marcas redondas', () => {
    const box = { width: 500, height: 200, left: 40, right: 10, top: 10, bottom: 30 };
    const chart = buildChart(weightTrend([salud('2026-10-01', 97.4), salud('2026-10-11', 96.8)]), box)!;
    expect(chart.dots[0].x).toBe(40);
    expect(chart.dots[1].x).toBe(490);
    expect(chart.dots[0].y).toBeLessThan(chart.dots[1].y);
    expect(chart.yTicks.map((t) => t.label)).toEqual(['96,5', '97', '97,5']);
    expect(buildChart(weightTrend([salud('2026-10-01', 97)]), box)).toBeUndefined();
  });

  it('la curva no se sale cuando los puntos están en llano', () => {
    const d = smoothPath([
      { x: 0, y: 10 },
      { x: 10, y: 20 },
      { x: 20, y: 20 },
    ]);
    const ys = [...d.matchAll(/,(-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(Math.max(...ys)).toBeLessThanOrEqual(20);
  });
});
