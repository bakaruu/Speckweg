import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '../db/database.service';
import { MealIdea, MealSlot } from '../../planner/meal-catalog';
import { FoodItem } from '../foods/food';

export interface DiaryRow {
  id: number;
  slot: MealSlot;
  name: string;
  grams: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
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

  /** Apunta un alimento de Open Food Facts, guardándolo (o actualizándolo) en la tabla de alimentos. */
  async logFood(date: string, slot: MealSlot, food: FoodItem, grams: number): Promise<void> {
    await this.db.execute(
      `INSERT INTO food (source, external_id, name, brand, kcal_100g, protein_100g, carbs_100g, fat_100g)
       VALUES ('off', $1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (source, external_id) DO UPDATE SET
         name = excluded.name, brand = excluded.brand, kcal_100g = excluded.kcal_100g,
         protein_100g = excluded.protein_100g, carbs_100g = excluded.carbs_100g, fat_100g = excluded.fat_100g`,
      [food.code, food.name, food.brand ?? null, food.kcal100, food.protein100, food.carbs100, food.fat100],
    );
    const [row] = await this.db.select<{ id: number }>(`SELECT id FROM food WHERE source = 'off' AND external_id = $1`, [
      food.code,
    ]);
    await this.db.execute(`INSERT INTO diary_entry (date, meal, food_id, grams) VALUES ($1, $2, $3, $4)`, [
      date,
      DB_MEAL[slot],
      row.id,
      grams,
    ]);
  }

  /** Alimentos de Open Food Facts apuntados últimamente, para repetirlos sin buscar. */
  async recentFoods(limit = 12): Promise<FoodItem[]> {
    const rows = await this.db.select<{
      external_id: string;
      name: string;
      brand: string | null;
      kcal_100g: number;
      protein_100g: number;
      carbs_100g: number;
      fat_100g: number;
    }>(
      `SELECT f.external_id, f.name, f.brand, f.kcal_100g, f.protein_100g, f.carbs_100g, f.fat_100g
       FROM food f JOIN diary_entry e ON e.food_id = f.id
       WHERE f.source = 'off'
       GROUP BY f.id ORDER BY MAX(e.id) DESC LIMIT $1`,
      [limit],
    );
    return rows.map((r) => ({
      code: r.external_id,
      name: r.name,
      brand: r.brand ?? undefined,
      kcal100: r.kcal_100g,
      protein100: r.protein_100g,
      carbs100: r.carbs_100g,
      fat100: r.fat_100g,
    }));
  }

  async entriesFor(date: string): Promise<DiaryRow[]> {
    const rows = await this.db.select<{ id: number; meal: string; name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }>(
      `SELECT e.id, e.meal, f.name, e.grams,
              f.kcal_100g * e.grams / 100 AS kcal, f.protein_100g * e.grams / 100 AS protein,
              f.carbs_100g * e.grams / 100 AS carbs, f.fat_100g * e.grams / 100 AS fat
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
      carbsG: Math.round(r.carbs),
      fatG: Math.round(r.fat),
    }));
  }

  async remove(id: number): Promise<void> {
    await this.db.execute(`DELETE FROM diary_entry WHERE id = $1`, [id]);
  }
}
