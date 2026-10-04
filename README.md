# Speckweg

App de escritorio para Windows para llevar el control de lo que comes (calorías y macros) junto con tus entrenos de [Hevy](https://www.hevyapp.com/), y recomendarte qué comer durante la semana. Todo se guarda en local; no hace falta servidor.

## Instalar la app (sin programar)

1. Ve a [Releases](https://github.com/bakaruu/Speckweg/releases/latest) y descarga **`Speckweg_x.y.z_x64-setup.exe`**.
2. Ábrelo y sigue el asistente. No pide permisos de administrador.
3. Windows puede mostrar "Windows protegió su PC" porque la app no está firmada: pulsa **Más información** y luego **Ejecutar de todas formas**.
4. Abre **Speckweg** desde el menú Inicio o el acceso directo del escritorio.
5. A partir de ahí, cuando haya una versión nueva la app te avisará al abrirla.

Tus datos (base de datos y ajustes) se guardan en `%APPDATA%\com.bakaruu.speckweg`.

### Cómo se prueba y se publica una versión

Hay dos apps que se instalan por separado y cada una tiene sus propios datos:

- **Speckweg**: la versión normal, para el día a día.
- **Speckweg Beta** (icono naranja): la versión de pruebas. Así las pruebas no ensucian tu diario real.

Las dos comprueban al abrirse si hay una versión nueva. Si la hay, sale un aviso con el botón **Actualizar**, que la instala y reinicia la app.

El flujo de trabajo es este:

1. **Cada cambio va en una rama con su pull request contra `dev`.** El check *Comprobar* pasa los tests y compila la app.
2. **Al fusionar en `dev`**, GitHub compila la Beta y la publica en la release [`beta`](https://github.com/bakaruu/Speckweg/releases/tag/beta). La Beta que tengas instalada se actualiza al abrirla.
3. **Cuando la Beta esté bien**, se abre un pull request de `dev` a `main` subiendo el número de versión en `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml` y `package.json`.
4. **Al fusionarlo**, se lanza *Actions → Release → Run workflow* sobre `main`. Esto publica la versión final `vX.Y.Z` y la app normal se actualiza sola.

La primera vez, descarga e instala la Beta desde la [release beta](https://github.com/bakaruu/Speckweg/releases/tag/beta).

### Firma de actualizaciones

Las actualizaciones van firmadas para que la app solo acepte instaladores salidos de este repo. La clave pública está en `src-tauri/tauri.conf.json`. La privada se guarda como secreto del repo, con el nombre `TAURI_SIGNING_PRIVATE_KEY` (y su contraseña, si tiene, en `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`), en *Settings → Secrets and variables → Actions*. Si se pierde, las apps ya instaladas no podrán actualizarse solas y habrá que reinstalarlas a mano.

## Stack

- **Tauri 2**: empaqueta la app como `.exe`/`.msi` ligero.
- **Angular 21**: interfaz y lógica (TypeScript).
- **SQLite** (`tauri-plugin-sql`): base de datos local `speckweg.db`.
- **Hevy API** (requiere Hevy Pro): API key en `hevy.com/settings?developer`.
- **Open Food Facts** y **USDA FoodData Central**: datos de alimentos.

## Desarrollo en Windows (paso a paso)

Solo hace falta si quieres modificar el código.

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
npm run build:app  # genera el instalador (-setup.exe) en src-tauri/target/release/bundle/nsis
npm test           # tests de Angular
```

## Estructura

```
src/app/
  core/db/          acceso a SQLite
  core/settings/    ajustes locales (API key de Hevy, peso)
  core/updates/     aviso de actualización (updater de Tauri)
  training/         cliente de la API de Hevy
  settings/         pantalla de ajustes
  today/            resumen del día
src-tauri/
  migrations/       esquema SQL (añade una migración nueva por cada cambio)
  capabilities/     permisos: qué URLs puede llamar la app
  src/lib.rs        registro de plugins y migraciones
```
