# Speckweg

App de escritorio para Windows para llevar el control de lo que comes (calorías y macros) junto con tus entrenos de [Hevy](https://www.hevyapp.com/), y recomendarte qué comer durante la semana. Todo se guarda en local; no hace falta servidor.

## Stack

- **Tauri 2**: empaqueta la app como `.exe`/`.msi` ligero.
- **Angular 21**: interfaz y lógica (TypeScript).
- **SQLite** (`tauri-plugin-sql`): base de datos local `speckweg.db`.
- **Hevy API** (requiere Hevy Pro): API key en `hevy.com/settings?developer`.
- **Open Food Facts** y **USDA FoodData Central**: datos de alimentos.

## Instalación en Windows (paso a paso)

### 1. Instala las herramientas (solo la primera vez)

| Herramienta | Descarga | Con winget (alternativa) |
|---|---|---|
| **Node.js 22 LTS** (22.12 o superior) | https://nodejs.org/es/download | `winget install OpenJS.NodeJS.LTS` |
| **Microsoft C++ Build Tools** | https://visualstudio.microsoft.com/es/visual-cpp-build-tools/ | `winget install Microsoft.VisualStudio.2022.BuildTools` |
| **Rust** (rustup) | https://rustup.rs/ (descarga `rustup-init.exe`) | `winget install Rustlang.Rustup` |

Notas:

- **C++ Build Tools**: en el instalador marca la carga de trabajo **"Desarrollo para el escritorio con C++"** y dale a instalar. Hazlo antes de instalar Rust.
- **Rust**: acepta las opciones por defecto (toolchain `stable-x86_64-pc-windows-msvc`).
- **WebView2** ya viene instalado en Windows 10 y 11; no tienes que hacer nada.
- Guía oficial de Tauri con capturas: https://v2.tauri.app/es/start/prerequisites/

Cierra y vuelve a abrir la terminal (PowerShell) y comprueba que todo está:

```powershell
node -v      # v22.12 o superior
npm -v
rustc -V
cargo -V
```

### 2. Descarga el proyecto

```powershell
git clone https://github.com/bakaruu/speckweg.git
cd speckweg
npm install
```

Si no tienes Git: https://git-scm.com/download/win (o `winget install Git.Git`).

### 3. Arranca la app

```powershell
npm run dev
```

La primera vez tarda varios minutos porque compila la parte de Rust; las siguientes son mucho más rápidas. Se abrirá la ventana de Speckweg.

### 4. Conecta Hevy

En la app ve a **Ajustes**, pega tu API key de Hevy (la sacas en https://hevy.com/settings?developer, requiere Hevy Pro) y pulsa **Guardar y probar**.

## Comandos

```powershell
npm run dev        # abre la app en modo desarrollo
npm run build:app  # genera el instalador (.msi y .exe) en src-tauri/target/release/bundle
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
