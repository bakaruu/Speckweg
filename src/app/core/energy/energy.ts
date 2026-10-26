import { isoDate } from '../../planner/daily-plan';
import { parseDate } from '../../training/apple-health';
import { dailyKcal, Goal, GOALS, Profile } from '../profile/body';

/** Lo que se ha gastado un día según Salud: energía en reposo y en actividad (kcal). */
export interface EnergyDay {
  date: string; // YYYY-MM-DD
  restingKcal?: number;
  activeKcal?: number;
}

/** Días que se guardan del gasto diario. */
const KEEP_DAYS = 90;

/**
 * Suma por día lo que deja el Atajo: una línea por muestra o por día, con la fecha al principio y el
 * valor al final ("5 oct 2026, 0:00;1650.3" o "5 oct 2026, 9:01;5 oct 2026, 9:02;4,2 kcal").
 * Cada valor cuenta para el día de su fecha de inicio. Pasa kJ a kcal y se salta lo que no entiende.
 */
export function parseDailyTotals(text: string): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length < 2) {
      continue;
    }
    const start = parseDate(parts[0]);
    const raw = parts[parts.length - 1];
    const match = /-?\d+(?:[.,]\d+)?/.exec(raw.replace(/\s/g, ''));
    if (start === undefined || !match) {
      continue;
    }
    const value = Number(match[0].replace(',', '.'));
    const kcal = /kj/i.test(raw) ? value / 4.184 : value;
    if (kcal > 0) {
      const date = isoDate(new Date(start));
      totals.set(date, (totals.get(date) ?? 0) + kcal);
    }
  }
  return totals;
}

/**
 * Las muestras sueltas de energia.txt solo cubren las últimas 48 horas, así que el primer día del
 * archivo está a medias: se quita para no guardar un gasto más bajo del real.
 */
export function withoutFirstDay(totals: Map<string, number>): Map<string, number> {
  const first = [...totals.keys()].sort()[0];
  const rest = new Map(totals);
  rest.delete(first);
  return rest;
}

/** Mete en el histórico los totales leídos (el valor nuevo sustituye al de ese día). */
export function mergeEnergy(
  log: EnergyDay[],
  totals: Map<string, number>,
  kind: 'restingKcal' | 'activeKcal',
): EnergyDay[] {
  const byDate = new Map(log.map((d) => [d.date, { ...d }]));
  for (const [date, kcal] of totals) {
    byDate.set(date, { ...byDate.get(date), date, [kind]: Math.round(kcal) });
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-KEEP_DAYS);
}

export function spentKcal(day: EnergyDay | undefined): number | undefined {
  if (day?.restingKcal === undefined && day?.activeKcal === undefined) {
    return undefined;
  }
  return (day.restingKcal ?? 0) + (day.activeKcal ?? 0);
}

/**
 * Gasto de un día normal: la media de los días completos del reloj de la última semana (sin contar
 * hoy) o, si no hay, la estimación con los datos del perfil.
 */
export function usualSpend(
  log: EnergyDay[],
  profile: Profile,
  weightKg: number | undefined,
  now = new Date(),
): { spendKcal: number; source: 'reloj' | 'estimado' } | undefined {
  const todayIso = isoDate(now);
  const weekAgoIso = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7));
  const fullDays = log.filter(
    (d) =>
      d.date >= weekAgoIso &&
      d.date < todayIso &&
      d.restingKcal !== undefined &&
      d.activeKcal !== undefined,
  );
  if (fullDays.length > 0) {
    const total = fullDays.reduce((sum, d) => sum + (spentKcal(d) ?? 0), 0);
    return { spendKcal: Math.round(total / fullDays.length), source: 'reloj' };
  }
  const estimate = dailyKcal(profile, weightKg, now);
  return estimate ? { spendKcal: estimate.spend, source: 'estimado' } : undefined;
}

/** Kcal al día para el objetivo a partir de un gasto, redondeadas a decenas. */
export function targetFor(spendKcal: number, goal: Goal): number {
  const factor = GOALS.find((g) => g.goal === goal)?.factor ?? 1;
  return Math.round((spendKcal * factor) / 10) * 10;
}

export interface Balance {
  eatenKcal: number;
  /** Gastado hoy hasta la última vez que corrió el Atajo, si hay datos de Salud. */
  today?: { restingKcal: number; activeKcal: number; spentKcal: number; netKcal: number };
  /** Gasto de un día entero: la media de los últimos días completos del reloj o la estimación del perfil. */
  dailySpendKcal?: number;
  spendSource?: 'reloj' | 'estimado';
  goal: Goal;
  /** Kcal de un día normal para el objetivo (lo que sale en Ajustes). */
  usualTargetKcal?: number;
  /** Kcal para el objetivo hoy (más que lo normal si hoy ya se ha gastado más) y lo que queda. */
  targetKcal?: number;
  remainingKcal?: number;
  yesterday?: { eatenKcal: number; spentKcal: number; netKcal: number };
}

/**
 * Balance del día: lo comido frente a lo gastado (reposo + actividad) y lo que queda para el
 * objetivo. El objetivo se calcula sobre un día entero, porque el gasto de hoy aún va subiendo.
 */
export function balance(input: {
  eatenKcal: number;
  yesterdayEatenKcal?: number;
  log: EnergyDay[];
  profile: Profile;
  weightKg?: number;
  now?: Date;
}): Balance {
  const now = input.now ?? new Date();
  const todayIso = isoDate(now);
  const yesterdayIso = isoDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
  const goal = input.profile.goal ?? 'mantener';

  const result: Balance = { eatenKcal: input.eatenKcal, goal };

  const todayDay = input.log.find((d) => d.date === todayIso);
  const spentToday = spentKcal(todayDay);
  if (spentToday !== undefined) {
    result.today = {
      restingKcal: todayDay?.restingKcal ?? 0,
      activeKcal: todayDay?.activeKcal ?? 0,
      spentKcal: spentToday,
      netKcal: input.eatenKcal - spentToday,
    };
  }

  const usual = usualSpend(input.log, input.profile, input.weightKg, now);
  if (usual) {
    result.dailySpendKcal = usual.spendKcal;
    result.spendSource = usual.source;
  }
  if (result.dailySpendKcal !== undefined) {
    // Si hoy ya se ha gastado más que un día normal, manda lo de hoy.
    const spend = Math.max(result.dailySpendKcal, spentToday ?? 0);
    result.usualTargetKcal = targetFor(result.dailySpendKcal, goal);
    result.targetKcal = targetFor(spend, goal);
    result.remainingKcal = result.targetKcal - input.eatenKcal;
  }

  const spentYesterday = spentKcal(input.log.find((d) => d.date === yesterdayIso));
  if (spentYesterday !== undefined && input.yesterdayEatenKcal !== undefined) {
    result.yesterday = {
      eatenKcal: input.yesterdayEatenKcal,
      spentKcal: spentYesterday,
      netKcal: input.yesterdayEatenKcal - spentYesterday,
    };
  }
  return result;
}

/** Objetivo de movimiento del Apple Watch de Aru (kcal en actividad al día). */
export const MOVE_GOAL_KCAL = 800;

/** Parte del anillo que se rellena (0 a 1). */
export function ringFraction(value: number, goal: number | undefined): number {
  return goal && goal > 0 ? Math.max(0, Math.min(1, value / goal)) : 0;
}
