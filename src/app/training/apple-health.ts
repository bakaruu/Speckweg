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

const MONTHS: Record<string, number> = {
  ene: 0,
  jan: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11,
  dec: 11,
};

/**
 * Fecha tal como la escribe el Atajo: la de por defecto del iPhone en español ("4 oct 2026, 18:30",
 * "4/10/2026 18:30", "4 de octubre de 2026, 18:30"), en hora local, o ISO 8601.
 */
export function parseDate(text: string): number | undefined {
  const iso = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text);
  if (iso) {
    const [, y, mo, d, h, mi, s] = iso.map(Number);
    return new Date(y, mo - 1, d, h, mi, s || 0).getTime();
  }
  const local =
    /^(\d{1,2})[\s./-]+(?:de\s+)?([a-záéíóú]+|\d{1,2})\.?[\s./-]+(?:de\s+)?(\d{4}),?\s+(?:a las\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?/i.exec(
      text,
    );
  if (local) {
    const month = /^\d+$/.test(local[2])
      ? Number(local[2]) - 1
      : MONTHS[local[2].slice(0, 3).toLowerCase()];
    if (month !== undefined) {
      const [d, y, h, mi, s] = [local[1], local[3], local[4], local[5], local[6]].map((v) =>
        Number(v ?? 0),
      );
      return new Date(y, month, d, h, mi, s).getTime();
    }
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
