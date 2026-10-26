use tauri_plugin_sql::{Migration, MigrationKind};

/// Migraciones de SQLite. Se aplican solas al abrir la base de datos desde el frontend.
/// Para cambiar el esquema, añade una migración nueva con la siguiente versión; no edites las existentes.
fn migrations() -> Vec<Migration> {
  vec![Migration {
    version: 1,
    description: "esquema_inicial",
    sql: include_str!("../migrations/0001_esquema_inicial.sql"),
    kind: MigrationKind::Up,
  }]
}

/// Archivo que deja el Atajo del iPhone con la energía activa del Apple Watch.
#[derive(serde::Serialize)]
struct HealthFile {
  path: String,
  content: String,
}

/// Sitios donde iCloud para Windows suele dejar el archivo del Atajo, del más al menos probable.
fn health_file_candidates(file_name: &str) -> Vec<std::path::PathBuf> {
  let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) else {
    return Vec::new();
  };
  let icloud = std::path::PathBuf::from(home).join("iCloudDrive");
  ["iCloud~is~workflow~my~workflows", "Shortcuts", "Atajos", ""]
    .iter()
    .map(|folder| icloud.join(folder).join("Speckweg").join(file_name))
    .collect()
}

/// Lee el archivo del Atajo: el de la ruta indicada en Ajustes o, si no hay, el primero que exista en iCloud Drive.
#[tauri::command]
fn read_health_file(
  custom_path: Option<String>,
  file_name: Option<String>,
) -> Result<Option<HealthFile>, String> {
  // Solo un nombre de archivo dentro de la carpeta Speckweg, nunca una ruta.
  let file_name = file_name.unwrap_or_else(|| "energia.txt".to_string());
  if file_name.contains(['/', '\\']) || file_name.contains("..") {
    return Err(format!("Nombre de archivo no válido: {file_name}"));
  }
  let candidates = match custom_path.filter(|p| !p.trim().is_empty()) {
    Some(path) => vec![std::path::PathBuf::from(path.trim())],
    None => health_file_candidates(&file_name),
  };
  for path in candidates {
    if path.is_file() {
      let content = std::fs::read_to_string(&path).map_err(|e| format!("{}: {e}", path.display()))?;
      return Ok(Some(HealthFile { path: path.display().to_string(), content }));
    }
  }
  Ok(None)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(
      tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:speckweg.db", migrations())
        .build(),
    )
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .plugin(tauri_plugin_updater::Builder::new().build())
    .plugin(tauri_plugin_process::init())
    .invoke_handler(tauri::generate_handler![read_health_file])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while building tauri application");
}
