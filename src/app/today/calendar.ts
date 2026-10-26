import { isoDate } from '../planner/daily-plan';

export interface CalendarDay {
  iso: string;
  day: number;
  /** Si es del mes que se está viendo (los de los bordes son del mes anterior o siguiente). */
  inMonth: boolean;
}

/** El día de `date` a las 00:00, en hora local. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Suma (o resta) días a una fecha, en hora local. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Semanas del mes, de lunes a domingo, rellenando con días del mes anterior y del siguiente. */
export function monthGrid(year: number, month: number): CalendarDay[][] {
  const first = new Date(year, month, 1);
  // getDay(): 0 = domingo. Se empieza la semana en lunes.
  const offset = (first.getDay() + 6) % 7;
  let day = addDays(first, -offset);
  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ iso: isoDate(day), day: day.getDate(), inMonth: day.getMonth() === month });
      day = addDays(day, 1);
    }
    weeks.push(week);
  } while (day.getMonth() === month);
  return weeks;
}
