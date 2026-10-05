import { HevyWorkout } from './hevy.client';
import {
  describeSets,
  estimateKcal,
  parseCsv,
  parseCsvDate,
  parseHevyCsv,
  summarize,
} from './workout';

const workout: HevyWorkout = {
  id: 'abc',
  title: 'Pierna',
  start_time: '2026-10-04T16:00:00+00:00',
  end_time: '2026-10-04T17:05:00+00:00',
  updated_at: '2026-10-04T17:05:00+00:00',
  exercises: [
    {
      index: 0,
      title: 'Sentadilla',
      sets: [
        {
          index: 0,
          type: 'warmup',
          weight_kg: 40,
          reps: 10,
          distance_meters: null,
          duration_seconds: null,
          rpe: null,
        },
        {
          index: 1,
          type: 'normal',
          weight_kg: 80,
          reps: 8,
          distance_meters: null,
          duration_seconds: null,
          rpe: null,
        },
        {
          index: 2,
          type: 'normal',
          weight_kg: 80,
          reps: 8,
          distance_meters: null,
          duration_seconds: null,
          rpe: null,
        },
      ],
    },
    {
      index: 1,
      title: 'Plancha',
      sets: [
        {
          index: 0,
          type: 'normal',
          weight_kg: null,
          reps: null,
          distance_meters: null,
          duration_seconds: 60,
          rpe: null,
        },
      ],
    },
  ],
};

describe('workout', () => {
  it('resume duración, series efectivas y volumen sin contar el calentamiento', () => {
    expect(summarize(workout)).toEqual({ durationMin: 65, exercises: 2, sets: 3, volumeKg: 1280 });
  });

  it('estima calorías con la duración y el peso', () => {
    expect(estimateKcal(60, 80)).toBe(400);
    expect(estimateKcal(30)).toBeGreaterThan(0);
  });

  it('describe las series de un ejercicio', () => {
    expect(describeSets(workout.exercises[0])).toBe('2 × 8 · 80 kg');
    expect(describeSets(workout.exercises[1])).toBe('1 series');
  });
});

describe('CSV de Hevy', () => {
  it('lee campos con comillas, comas y saltos de línea', () => {
    expect(parseCsv('a,"b, c","d ""e""\nf"\r\n1,2,3\n')).toEqual([
      ['a', 'b, c', 'd "e"\nf'],
      ['1', '2', '3'],
    ]);
  });

  it('entiende las fechas del CSV en hora local', () => {
    expect(parseCsvDate('4 Oct 2026, 18:30')).toBe(new Date(2026, 9, 4, 18, 30).toISOString());
    expect(parseCsvDate('basura')).toBeUndefined();
  });

  it('agrupa las filas en entrenos y ejercicios', () => {
    const csv = [
      '"title","start_time","end_time","description","exercise_title","superset_id","exercise_notes","set_index","set_type","weight_kg","reps","distance_km","duration_seconds","rpe"',
      '"Pierna","4 Oct 2026, 18:00","4 Oct 2026, 19:00","","Sentadilla","","","0","warmup","40","10","","",""',
      '"Pierna","4 Oct 2026, 18:00","4 Oct 2026, 19:00","","Sentadilla","","","1","normal","80","8","","","8"',
      '"Pierna","4 Oct 2026, 18:00","4 Oct 2026, 19:00","","Prensa","","","0","normal","120","12","","",""',
      '"Empuje","2 Oct 2026, 10:00","2 Oct 2026, 11:00","","Press banca","","","0","normal","60","10","","",""',
    ].join('\n');
    const [pierna, empuje] = parseHevyCsv(csv);
    expect(pierna.id).toBe(`csv:${new Date(2026, 9, 4, 18, 0).toISOString()}`);
    expect(pierna.exercises.map((e) => e.title)).toEqual(['Sentadilla', 'Prensa']);
    expect(pierna.exercises[0].sets[1]).toMatchObject({
      type: 'normal',
      weight_kg: 80,
      reps: 8,
      rpe: 8,
    });
    expect(summarize(pierna)).toMatchObject({ durationMin: 60, sets: 2, volumeKg: 2080 });
    expect(empuje.title).toBe('Empuje');
  });

  it('rechaza un archivo que no es de Hevy', () => {
    expect(() => parseHevyCsv('nombre,kcal\npan,250')).toThrow();
  });
});
