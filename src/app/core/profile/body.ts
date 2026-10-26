import { isoDate } from '../../planner/daily-plan';
import { parseDate } from '../../training/apple-health';

export type Sex = 'hombre' | 'mujer';
export type Goal = 'recomposicion' | 'perder' | 'mantener' | 'ganar';

export interface Profile {
  heightCm?: number;
  birthYear?: number;
  sex?: Sex;
  goal?: Goal;
}

/** Un peso apuntado: a mano o leído de Salud (la báscula lo manda allí). */
export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
  source: 'manual' | 'salud';
}

export const GOALS: { goal: Goal; label: string; factor: number }[] = [
  // Déficit moderado con mucha proteína y fuerza: se pierde grasa sin perder músculo (y se gana algo).
  { goal: 'recomposicion', label: 'Perder grasa y ganar músculo', factor: 0.85 },
  { goal: 'perder', label: 'Solo perder grasa (más rápido)', factor: 0.8 },
  { goal: 'mantener', label: 'Mantenerme', factor: 1 },
  { goal: 'ganar', label: 'Ganar músculo', factor: 1.1 },
];

/** Actividad ligera-moderada: trabajo normal y unos días de gimnasio a la semana. */
const ACTIVITY_FACTOR = 1.45;

export function ageFrom(birthYear: number, today = new Date()): number {
  return today.getFullYear() - birthYear;
}

/** Metabolismo basal con la fórmula de Mifflin-St Jeor (kcal al día en reposo). */
export function bmr(sex: Sex, kg: number, heightCm: number, age: number): number {
  return Math.round(10 * kg + 6.25 * heightCm - 5 * age + (sex === 'hombre' ? 5 : -161));
}

/** Gasto diario estimado y kcal recomendadas según el objetivo. Undefined si faltan datos. */
export function dailyKcal(profile: Profile, kg: number | undefined, today = new Date()) {
  const { sex, heightCm, birthYear, goal = 'mantener' } = profile;
  if (!sex || !heightCm || !birthYear || !kg) {
    return undefined;
  }
  const basal = bmr(sex, kg, heightCm, ageFrom(birthYear, today));
  const spend = Math.round(basal * ACTIVITY_FACTOR);
  const factor = GOALS.find((g) => g.goal === goal)?.factor ?? 1;
  return { basal, spend, target: Math.round((spend * factor) / 10) * 10 };
}

/** Añade o sustituye el peso de ese día y deja el histórico ordenado por fecha. */
export function addWeight(log: WeightEntry[], entry: WeightEntry): WeightEntry[] {
  return [...log.filter((e) => e.date !== entry.date), entry].sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

/** Cambio de peso desde hace `days` días (o desde el primer registro si es más reciente). */
export function weightChange(
  log: WeightEntry[],
  days: number,
  today = new Date(),
): number | undefined {
  if (log.length < 2) {
    return undefined;
  }
  const since = new Date(today.getFullYear(), today.getMonth(), today.getDate() - days);
  const from = log.find((e) => e.date >= isoDate(since)) ?? log[0];
  const last = log[log.length - 1];
  return from === last ? undefined : Math.round((last.kg - from.kg) * 10) / 10;
}

/**
 * Lee el archivo de peso del Atajo: `fecha;valor` por línea, por ejemplo "5 oct 2026, 8:10;72,4 kg".
 * Acepta libras ("lb") y las pasa a kg. Las líneas que no se entienden se saltan.
 */
export function parseWeightFile(text: string): WeightEntry[] {
  let log: WeightEntry[] = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const parts = line.split(';').map((p) => p.trim());
    if (parts.length < 2) {
      continue;
    }
    const time = parseDate(parts[0]);
    const match = /\d+(?:[.,]\d+)?/.exec(parts[1]);
    if (time === undefined || !match) {
      continue;
    }
    const value = Number(match[0].replace(',', '.'));
    const kg = /lb/i.test(parts[1]) ? value * 0.45359237 : value;
    if (kg > 20 && kg < 400) {
      log = addWeight(log, {
        date: isoDate(new Date(time)),
        kg: Math.round(kg * 10) / 10,
        source: 'salud',
      });
    }
  }
  return log;
}
