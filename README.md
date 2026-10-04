# Speckweg

App de escritorio para Windows para llevar el control de lo que comes (calorías y macros) junto con tus entrenos de [Hevy](https://www.hevyapp.com/), y recomendarte qué comer durante la semana. Todo se guarda en local; no hace falta servidor.

## Stack

- **Tauri 2**: empaqueta la app como `.exe`/`.msi` ligero.
- **Angular 21**: interfaz y lógica (TypeScript).
- **SQLite** (`tauri-plugin-sql`): base de datos local `speckweg.db`.
- **Hevy API** (requiere Hevy Pro): API key en `hevy.com/settings?developer`.
- **Open Food Facts** y **USDA FoodData Central**: datos de alimentos.

## Requisitos (Windows)

1. [Node.js](https://nodejs.org/) 22 LTS o superior.
2. [Rust](https://rustup.rs/) (toolchain MSVC).
3. Microsoft C++ Build Tools ("Desarrollo para el escritorio con C++"). WebView2 ya viene con Windows 10/11.

Guía oficial: https://v2.tauri.app/start/prerequisites/

## Uso

```bash
npm install
npm run dev        # abre la app en modo desarrollo
npm run build:app  # genera el instalador en src-tauri/target/release/bundle
npm test           # tests de Angular
```

## Estructura

```
src/app/
  core/db/          acceso a SQLite
  core/settings/    ajustes locales (API key de Hevy)
  training/         cliente de la API de Hevy
  settings/         pantalla de ajustes
  today/            resumen del día
src-tauri/
  migrations/       esquema SQL (añade una migración nueva por cada cambio)
  capabilities/     permisos: qué URLs puede llamar la app
  src/lib.rs        registro de plugins y migraciones
```
