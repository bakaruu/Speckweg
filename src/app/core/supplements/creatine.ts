import { isoDate } from '../../planner/daily-plan';

/**
 * Días seguidos tomando creatina hasta `date`. Si ese día aún no está marcado, cuenta hasta el
 * anterior, para que la racha no se vea a cero antes de tomarla.
 */
export function creatineStreak(days: Set<string>, date: Date): number {
  let d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (!days.has(isoDate(d))) {
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  }
  let streak = 0;
  while (days.has(isoDate(d))) {
    streak++;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  }
  return streak;
}
