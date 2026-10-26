import { isoDate } from '../../planner/daily-plan';
import { WeightEntry } from './body';

/** Cuánto pesa cada pesaje nuevo en la tendencia (por día): 0,1 = media de unas dos semanas. */
const TREND_ALPHA = 0.1;
const DAY_MS = 86_400_000;

export type WeightRange = '1m' | '3m' | 'todo';

export const WEIGHT_RANGES: { range: WeightRange; label: string; days?: number }[] = [
  { range: '1m', label: '1 mes', days: 30 },
  { range: '3m', label: '3 meses', days: 90 },
  { range: 'todo', label: 'Todo' },
];

/** Un pesaje con su tendencia (la media suavizada hasta ese día). */
export interface TrendPoint {
  date: string;
  kg: number;
  trend: number;
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY_MS);
}

/**
 * Tendencia del peso: una media que se mueve despacio, para que un día de más agua o sal no
 * parezca que has engordado. Si pasan varios días sin pesarse, el pesaje siguiente cuenta más.
 */
export function weightTrend(log: WeightEntry[]): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const e of log.filter((e) => /^\d{4}-\d{2}-\d{2}$/.test(e.date))) {
    const prev = points.at(-1);
    if (!prev) {
      points.push({ date: e.date, kg: e.kg, trend: e.kg });
      continue;
    }
    const days = Math.max(1, dayNumber(e.date) - dayNumber(prev.date));
    const weight = 1 - (1 - TREND_ALPHA) ** days;
    points.push({ date: e.date, kg: e.kg, trend: prev.trend + weight * (e.kg - prev.trend) });
  }
  return points;
}

/** Los puntos del periodo elegido (1 mes, 3 meses o todo). */
export function inRange(points: TrendPoint[], range: WeightRange, today = new Date()): TrendPoint[] {
  const days = WEIGHT_RANGES.find((r) => r.range === range)?.days;
  if (!days) {
    return points;
  }
  const since = isoDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days));
  return points.filter((p) => p.date >= since);
}

export interface ChartBox {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface WeightChart {
  dots: { x: number; y: number; date: string; kg: number; trend: number }[];
  trendPath: string;
  areaPath: string;
  yTicks: { y: number; label: string }[];
  xTicks: { x: number; label: string }[];
}

/** Coloca los pesajes en el dibujo: eje X por fecha, eje Y con un margen y marcas redondas. */
export function buildChart(points: TrendPoint[], box: ChartBox): WeightChart | undefined {
  if (points.length < 2) {
    return undefined;
  }
  const values = points.flatMap((p) => [p.kg, p.trend]);
  const step = niceStep(Math.max(...values) - Math.min(...values));
  const min = Math.floor((Math.min(...values) - step / 10) / step) * step;
  const max = Math.ceil((Math.max(...values) + step / 10) / step) * step;
  const first = dayNumber(points[0].date);
  const span = Math.max(1, dayNumber(points.at(-1)!.date) - first);
  const plotW = box.width - box.left - box.right;
  const plotH = box.height - box.top - box.bottom;
  const x = (date: string) => box.left + ((dayNumber(date) - first) / span) * plotW;
  const y = (kg: number) => box.top + (1 - (kg - min) / (max - min)) * plotH;

  const dots = points.map((p) => ({ x: x(p.date), y: y(p.kg), date: p.date, kg: p.kg, trend: p.trend }));
  const trend = points.map((p) => ({ x: x(p.date), y: y(p.trend) }));
  const trendPath = smoothPath(trend);
  const baseY = box.top + plotH;
  const areaPath = `${trendPath} L${f(trend.at(-1)!.x)},${f(baseY)} L${f(trend[0].x)},${f(baseY)} Z`;

  const yTicks = [];
  for (let v = min; v <= max + step / 2; v += step) {
    yTicks.push({ y: y(v), label: kgLabel(v) });
  }
  const xTicks = [points[0], points[Math.floor(points.length / 2)], points.at(-1)!]
    .filter((p, i, all) => all.findIndex((q) => q.date === p.date) === i)
    .map((p) => ({ x: x(p.date), label: shortDate(p.date) }));

  return { dots, trendPath, areaPath, yTicks, xTicks };
}

/** Separación entre las líneas del eje Y: 0,5, 1, 2 o 5 kg, para unas 3-5 líneas. */
function niceStep(range: number): number {
  return [0.5, 1, 2, 5, 10].find((s) => range / s <= 4) ?? 20;
}

/** Curva suave que pasa por todos los puntos sin pasarse de largo (monótona, Fritsch-Carlson). */
export function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 3) {
    return pts.map((p, i) => `${i ? 'L' : 'M'}${f(p.x)},${f(p.y)}`).join(' ');
  }
  const n = pts.length;
  const slopes = pts.slice(1).map((p, i) => (p.y - pts[i].y) / Math.max(1e-6, p.x - pts[i].x));
  const tangents = pts.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const a = slopes[i - 1];
    const b = slopes[i];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    const h = (q.x - p.x) / 3;
    d += ` C${f(p.x + h)},${f(p.y + tangents[i] * h)} ${f(q.x - h)},${f(q.y - tangents[i + 1] * h)} ${f(q.x)},${f(q.y)}`;
  }
  return d;
}

export function kgLabel(kg: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(kg);
}

export function shortDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short' }).format(new Date(y, m - 1, d));
}

function f(n: number): string {
  return n.toFixed(1);
}
