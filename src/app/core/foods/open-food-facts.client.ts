import { Injectable } from '@angular/core';
import { fetch } from '@tauri-apps/plugin-http';
import { FoodItem, isBarcode, OFF_FIELDS, OffProduct, parseOffProduct } from './food';

const BASE_URL = 'https://world.openfoodfacts.org';

/**
 * Cliente de Open Food Facts (base de datos abierta de alimentos, sin cuenta ni API key).
 * Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Todo lo que dependa de la forma de la API se queda aquí.
 * Usa el fetch de Tauri (no el del navegador) para evitar problemas de CORS.
 */
@Injectable({ providedIn: 'root' })
export class OpenFoodFactsClient {
  /** Busca por nombre, o por código de barras si el texto son solo cifras. */
  async search(text: string): Promise<FoodItem[]> {
    const query = text.trim();
    if (!query) {
      return [];
    }
    if (isBarcode(query)) {
      const food = await this.byBarcode(query.replace(/\s/g, ''));
      return food ? [food] : [];
    }
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      lc: 'es',
      page_size: '25',
      sort_by: 'unique_scans_n',
      fields: OFF_FIELDS,
    });
    const body = await this.get<{ products?: OffProduct[] }>(`/cgi/search.pl?${params}`);
    return (body.products ?? []).map(parseOffProduct).filter((f): f is FoodItem => f !== undefined);
  }

  async byBarcode(code: string): Promise<FoodItem | undefined> {
    const body = await this.get<{ status?: number; product?: OffProduct }>(
      `/api/v2/product/${encodeURIComponent(code)}?fields=${OFF_FIELDS}&lc=es`,
      true,
    );
    return body.status === 1 && body.product
      ? parseOffProduct({ code, ...body.product })
      : undefined;
  }

  private async get<T>(path: string, notFoundIsEmpty = false): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}${path}`, { headers: { accept: 'application/json' } });
    } catch {
      throw new Error('No se pudo conectar con Open Food Facts. ¿Hay internet?');
    }
    if (notFoundIsEmpty && response.status === 404) {
      return {} as T;
    }
    if (response.status === 429 || response.status === 503) {
      throw new Error('Open Food Facts está saturado ahora mismo. Prueba en unos segundos.');
    }
    if (!response.ok) {
      throw new Error(`Open Food Facts respondió ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }
}
