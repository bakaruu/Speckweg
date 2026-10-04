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
