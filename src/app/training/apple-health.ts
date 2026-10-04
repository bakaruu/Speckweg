/** Una muestra de energía activa del Apple Watch, tal como la deja el Atajo del iPhone. */
export interface EnergySample {
  start: number;
  end: number;
  kcal: number;
}

/**
 * Lee el archivo del Atajo: una muestra por línea, `inicio;fin;valor`.
 * Las fechas vienen en ISO 8601 y el valor puede llevar coma decimal y unidad ("12,5 kcal").
 * Si el valor viene en kilojulios ("kJ") se pasa a kcal. Las líneas que no se entienden se saltan.
 */
export function parseEnergyFile(text: string): EnergySample[] {
  const samples: EnergySample[] = [];
  for (const line of text.replace(/^﻿/, '').split(/\r?\n/)) {
    const parts = line.split(/[;\t]/).map((p) => p.trim());
    if (parts.length < 3) {
      continue;
    }
    const start = parseDate(parts[0]);
    const end = parseDate(parts[1]);
    const match = /-?\d+(?:[.,]\d+)?/.exec(parts[2].replace(/\s/g, ''));
    if (start === undefined || end === undefined || !match) {
      continue;
    }
    const value = Number(match[0].replace(',', '.'));
    const kcal = /kj/i.test(parts[2]) ? value / 4.184 : value;
    if (kcal > 0 && end >= start) {
      samples.push({ start, end, kcal });
    }
  }
  return samples;
}

/** Fecha ISO 8601 ("2026-10-04T18:30:00+02:00") o "2026-10-04 18:30[:00]" en hora local. */
function parseDate(text: string): number | undefined {
  const local = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (local) {
    const [, y, mo, d, h, mi, s] = local.map(Number);
    return new Date(y, mo - 1, d, h, mi, s || 0).getTime();
  }
  const time = Date.parse(text);
  return Number.isNaN(time) ? undefined : time;
}

/**
 * Kcal activas del reloj durante un entreno: suma de las muestras dentro del entreno, repartiendo
 * las que quedan a caballo según el tiempo que se solapan. Sin muestras en ese rato devuelve undefined.
 */
export function kcalDuring(
  samples: EnergySample[],
  startIso: string,
  endIso: string,
): number | undefined {
  const from = Date.parse(startIso);
  const to = Date.parse(endIso);
  let total = 0;
  let found = false;
  for (const s of samples) {
    const overlap = Math.min(s.end, to) - Math.max(s.start, from);
    if (overlap < 0 || (overlap === 0 && s.end > s.start)) {
      continue;
    }
    found = true;
    total += s.end > s.start ? (s.kcal * overlap) / (s.end - s.start) : s.kcal;
  }
  return found && total > 0 ? Math.round(total) : undefined;
}
