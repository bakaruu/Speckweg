import { Injectable } from '@angular/core';
import Database from '@tauri-apps/plugin-sql';

/**
 * Acceso a la base de datos SQLite local (speckweg.db, en la carpeta de datos de la app).
 * Las migraciones viven en src-tauri/migrations y se aplican al cargar la base de datos.
 */
@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private db?: Promise<Database>;

  private connection(): Promise<Database> {
    this.db ??= Database.load('sqlite:speckweg.db');
    return this.db;
  }

  async select<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return (await this.connection()).select<T[]>(sql, params);
  }

  async execute(sql: string, params: unknown[] = []): Promise<void> {
    await (await this.connection()).execute(sql, params);
  }
}
