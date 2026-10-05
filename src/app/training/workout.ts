import { HevyExercise, HevySet, HevyWorkout } from './hevy.client';

/** Peso que se usa para estimar calorías si no está puesto en Ajustes. */
export const DEFAULT_WEIGHT_KG = 75;
/** MET del entreno de fuerza (Compendium of Physical Activities, intensidad media-alta). */
const STRENGTH_MET = 5;

export interface WorkoutSummary {
  durationMin: number;
  exercises: number;
  sets: number;
  volumeKg: number;
}

/** Duración, ejercicios, series efectivas (sin calentamiento) y volumen (kg × repeticiones). */
export function summarize(workout: HevyWorkout): WorkoutSummary {
  const durationMs = new Date(workout.end_time).getTime() - new Date(workout.start_time).getTime();
  const working = workout.exercises.flatMap((e) => e.sets).filter((s) => s.type !== 'warmup');
  const volumeKg = working.reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
  return {
    durationMin: Math.max(0, Math.round(durationMs / 60000)),
    exercises: workout.exercises.length,
    sets: working.length,
    volumeKg: Math.round(volumeKg),
  };
}

/** Calorías aproximadas quemadas: MET × peso × horas. Hevy no las da por la API. */
export function estimateKcal(durationMin: number, weightKg = DEFAULT_WEIGHT_KG): number {
  return Math.round((STRENGTH_MET * weightKg * durationMin) / 60);
}

/** Resumen corto de las series de un ejercicio, por ejemplo "3 × 10 · 60 kg". */
export function describeSets(exercise: HevyExercise): string {
  const sets = exercise.sets.filter((s) => s.type !== 'warmup');
  if (sets.length === 0) {
    return '';
  }
  const reps = sets.map((s) => s.reps).filter((r): r is number => r != null);
  const sameReps = reps.length === sets.length && reps.every((r) => r === reps[0]);
  const top = Math.max(0, ...sets.map((s) => s.weight_kg ?? 0));
  const count = sameReps ? `${sets.length} × ${reps[0]}` : `${sets.length} series`;
  return top > 0 ? `${count} · ${formatKg(top)} kg` : count;
}

function formatKg(kg: number): string {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1).replace('.', ',');
}

const SET_TYPES: HevySet['type'][] = ['normal', 'warmup', 'dropset', 'failure'];

const MONTHS: Record<string, number> = {
  jan: 0,
  ene: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  ago: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
  dic: 11,
};

/** Fecha del CSV de Hevy ("4 Oct 2026, 18:30", en hora local) a ISO en UTC. */
export function parseCsvDate(text: string): string | undefined {
  const m = /^(\d{1,2}) ([a-zA-Z]{3})[a-zA-Z.]* (\d{4}),? (\d{1,2}):(\d{2})/.exec(text.trim());
  if (m) {
    const month = MONTHS[m[2].toLowerCase()];
    if (month !== undefined) {
      return new Date(Number(m[3]), month, Number(m[1]), Number(m[4]), Number(m[5])).toISOString();
    }
  }
  const time = Date.parse(text);
  return Number.isNaN(time) ? undefined : new Date(time).toISOString();
}

/**
 * Convierte el CSV que exporta Hevy (Ajustes → Exportar datos) en entrenos.
 * El CSV no trae id, así que se usa la hora de inicio: `csv:<inicio en ISO>`.
 */
export function parseHevyCsv(text: string): HevyWorkout[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) {
    return [];
  }
  const col = (name: string) => header.indexOf(name);
  const c = {
    title: col('title'),
    start: col('start_time'),
    end: col('end_time'),
    description: col('description'),
    exercise: col('exercise_title'),
    notes: col('exercise_notes'),
    setType: col('set_type'),
    kg: col('weight_kg'),
    lbs: col('weight_lbs'),
    reps: col('reps'),
    km: col('distance_km'),
    miles: col('distance_miles'),
    seconds: col('duration_seconds'),
    rpe: col('rpe'),
  };
  if (c.title < 0 || c.start < 0 || c.exercise < 0) {
    throw new Error('El archivo no parece un CSV de entrenos exportado de Hevy.');
  }

  const workouts = new Map<string, HevyWorkout>();
  for (const row of rows) {
    const start = parseCsvDate(row[c.start] ?? '');
    if (!start) {
      continue;
    }
    const id = `csv:${start}`;
    let workout = workouts.get(id);
    if (!workout) {
      const end = parseCsvDate(row[c.end] ?? '') ?? start;
      workout = {
        id,
        title: row[c.title] || 'Entreno',
        description: row[c.description] || null,
        start_time: start,
        end_time: end,
        updated_at: end,
        exercises: [],
      };
      workouts.set(id, workout);
    }
    const title = row[c.exercise] || 'Ejercicio';
    let exercise = workout.exercises.at(-1);
    if (exercise?.title !== title) {
      exercise = { index: workout.exercises.length, title, notes: row[c.notes] || null, sets: [] };
      workout.exercises.push(exercise);
    }
    const lbs = num(row[c.lbs]);
    const km = num(row[c.km]);
    const miles = num(row[c.miles]);
    const set: HevySet = {
      index: exercise.sets.length,
      type: SET_TYPES.includes(row[c.setType] as HevySet['type'])
        ? (row[c.setType] as HevySet['type'])
        : 'normal',
      weight_kg: num(row[c.kg]) ?? (lbs == null ? null : lbs * 0.45359237),
      reps: num(row[c.reps]),
      distance_meters: km != null ? km * 1000 : miles != null ? miles * 1609.344 : null,
      duration_seconds: num(row[c.seconds]),
      rpe: num(row[c.rpe]),
    };
    exercise.sets.push(set);
  }
  return [...workouts.values()];
}

function num(value: string | undefined): number | null {
  if (value == null || value.trim() === '') {
    return null;
  }
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Parser de CSV con comillas (los títulos y notas pueden llevar comas y saltos de línea). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') {
        i++;
      }
      row.push(field);
      field = '';
      if (row.some((f) => f !== '')) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((f) => f !== '')) {
    rows.push(row);
  }
  return rows;
}
