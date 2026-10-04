-- Alimentos: cacheados desde Open Food Facts / USDA o creados a mano. Valores por 100 g.
CREATE TABLE food (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  source        TEXT NOT NULL CHECK (source IN ('off', 'usda', 'custom')),
  external_id   TEXT,
  name          TEXT NOT NULL,
  brand         TEXT,
  kcal_100g     REAL NOT NULL,
  protein_100g  REAL NOT NULL DEFAULT 0,
  carbs_100g    REAL NOT NULL DEFAULT 0,
  fat_100g      REAL NOT NULL DEFAULT 0,
  fiber_100g    REAL,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (source, external_id)
);

-- Diario: cada cosa que comes, con la fecha y la comida del día.
CREATE TABLE diary_entry (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  date       TEXT NOT NULL,              -- YYYY-MM-DD
  meal       TEXT NOT NULL CHECK (meal IN ('desayuno', 'comida', 'cena', 'snack')),
  food_id    INTEGER NOT NULL REFERENCES food (id),
  grams      REAL NOT NULL CHECK (grams > 0),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_diary_entry_date ON diary_entry (date);

-- Entrenos sincronizados desde Hevy. raw_json guarda la respuesta completa por si la necesitamos luego.
CREATE TABLE workout (
  id             TEXT PRIMARY KEY,       -- id de Hevy
  title          TEXT NOT NULL,
  start_time     TEXT NOT NULL,
  end_time       TEXT NOT NULL,
  volume_kg      REAL NOT NULL DEFAULT 0,
  estimated_kcal REAL,
  raw_json       TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);
CREATE INDEX idx_workout_start_time ON workout (start_time);

-- Objetivos diarios. Se guarda el histórico; el vigente es el de valid_from más reciente.
CREATE TABLE goal (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  valid_from TEXT NOT NULL,              -- YYYY-MM-DD
  kcal       REAL NOT NULL,
  protein_g  REAL NOT NULL,
  carbs_g    REAL NOT NULL,
  fat_g      REAL NOT NULL
);
