import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { MealIdea, MealSlot } from '../../planner/meal-catalog';

export interface DiaryRow {
  id: number;
  slot: MealSlot;
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
}

// En la base de datos la merienda se guarda como 'snack' (esquema inicial).
const DB_MEAL: Record<MealSlot, string> = { desayuno: 'desayuno', comida: 'comida', merienda: 'snack', cena: 'cena' };
const SLOT_FROM_DB: Record<string, MealSlot> = { desayuno: 'desayuno', comida: 'comida', snack: 'merienda', cena: 'cena' };

/** Diario de comidas: lo que se ha comido cada día, guardado en SQLite. */
@Injectable({ providedIn: 'root' })
export class DiaryService {
  private readonly db = inject(DatabaseService);

  /** Apunta un plato del catálogo con los gramos (pesados o estimados a ojo). */
  async logMeal(date: string, meal: MealIdea, grams: number): Promise<void> {
    // Cada plato del catálogo se guarda como un alimento propio, con sus valores por 100 g.
    const externalId = `plato:${meal.id}`;
    const per100 = 100 / meal.portionG;
    await this.db.execute(
      `INSERT INTO food (source, external_id, name, kcal_100g, protein_100g)
       VALUES ('custom', $1, $2, $3, $4)
       ON CONFLICT (source, external_id) DO UPDATE SET
         name = excluded.name, kcal_100g = excluded.kcal_100g, protein_100g = excluded.protein_100g`,
      [externalId, meal.name, meal.kcal * per100, meal.proteinG * per100],
    );
    const [food] = await this.db.select<{ id: number }>(
      `SELECT id FROM food WHERE source = 'custom' AND external_id = $1`,
      [externalId],
    );
    await this.db.execute(`INSERT INTO diary_entry (date, meal, food_id, grams) VALUES ($1, $2, $3, $4)`, [
      date,
      DB_MEAL[meal.slot],
      food.id,
      grams,
    ]);
  }

  async entriesFor(date: string): Promise<DiaryRow[]> {
    const rows = await this.db.select<{ id: number; meal: string; name: string; grams: number; kcal: number; protein: number }>(
      `SELECT e.id, e.meal, f.name, e.grams,
              f.kcal_100g * e.grams / 100 AS kcal, f.protein_100g * e.grams / 100 AS protein
       FROM diary_entry e JOIN food f ON f.id = e.food_id
       WHERE e.date = $1 ORDER BY e.created_at, e.id`,
      [date],
    );
    return rows.map((r) => ({
      id: r.id,
      slot: SLOT_FROM_DB[r.meal] ?? 'merienda',
      name: r.name,
      grams: Math.round(r.grams),
      kcal: Math.round(r.kcal),
      proteinG: Math.round(r.protein),
    }));
  }

  async remove(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM diary_entry WHERE id = $1`, [id]);
  }
}
