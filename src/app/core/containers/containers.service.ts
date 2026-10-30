import { Injectable, signal } from '@angular/core';
import { load, Store } from '@tauri-apps/plugin-store';

/** Un plato, bol o táper que usas para pesar, con lo que pesa vacío y una foto para reconocerlo. */
export interface FoodContainer {
  id: string;
  name: string;
  grams: number;
  /** Miniatura en data URL (JPEG pequeño), opcional. */
  photo?: string;
}

/** Recipientes de Aru que la app añade una sola vez (luego se pueden cambiar o borrar). */
export const DEFAULT_CONTAINERS: FoodContainer[] = [
  { id: 'plato-transparente-marron', name: 'Plato transparente marrón hondo', grams: 396 },
  { id: 'taza', name: 'Taza', grams: 179 },
  { id: 'plato-blanco-ondulado', name: 'Plato blanco ondulado', grams: 363 },
  { id: 'plato-grande-dibujo-marron', name: 'Plato grande con dibujo marrón', grams: 435 },
  { id: 'plato-pequeno-dibujo-marron', name: 'Plato pequeño con dibujo marrón', grams: 277 },
  { id: 'plato-transparente-marron-plano', name: 'Plato transparente marrón plano', grams: 460 },
  { id: 'vaso-batidora', name: 'Vaso de la batidora', grams: 153 },
  { id: 'plato-postre-dibujo-marron', name: 'Plato de postre con dibujo marrón en el centro', grams: 176 },
  { id: 'bol-cristal-asa', name: 'Bol de cristal con asa', grams: 199 },
];

/** Añade los recipientes iniciales que falten y que no se hayan añadido antes. */
export function addDefaultContainers(list: FoodContainer[], added: string[]): { list: FoodContainer[]; added: string[] } {
  // Antes solo había un plato transparente marrón; ahora hay hondo y plano.
  const result = list.map((c) =>
    c.id === 'plato-transparente-marron' && c.name === 'Plato transparente marrón' ? { ...c, name: 'Plato transparente marrón hondo' } : c,
  );
  for (const c of DEFAULT_CONTAINERS) {
    const exists = result.some((x) => x.id === c.id || x.name.trim().toLowerCase() === c.name.toLowerCase());
    if (!added.includes(c.id) && !exists) {
      result.push({ ...c });
    }
  }
  return { list: result, added: DEFAULT_CONTAINERS.map((c) => c.id) };
}

/** Tus recipientes, guardados en containers.json en la carpeta de datos de la app. */
@Injectable({ providedIn: 'root' })
export class ContainersService {
  private store?: Promise<Store>;
  private loaded?: Promise<void>;

  readonly list = signal<FoodContainer[]>([]);

  private open(): Promise<Store> {
    this.store ??= load('containers.json', { defaults: {}, autoSave: false });
    return this.store;
  }

  load(): Promise<void> {
    this.loaded ??= (async () => {
      try {
        const store = await this.open();
        const saved = (await store.get<FoodContainer[]>('containers')) ?? [];
        const before = (await store.get<string[]>('defaultsAdded')) ?? [];
        const { list, added } = addDefaultContainers(saved, before);
        this.list.set(list);
        if (added.length !== before.length || list.some((c, i) => c !== saved[i])) {
          await store.set('defaultsAdded', added);
          await this.persist();
        }
      } catch {
        // Fuera de la app de escritorio no hay almacenamiento.
      }
    })();
    return this.loaded;
  }

  async save(container: FoodContainer): Promise<void> {
    this.list.update((list) =>
      list.some((c) => c.id === container.id) ? list.map((c) => (c.id === container.id ? container : c)) : [...list, container],
    );
    await this.persist();
  }

  async remove(id: string): Promise<void> {
    this.list.update((list) => list.filter((c) => c.id !== id));
    await this.persist();
  }

  private async persist(): Promise<void> {
    const store = await this.open();
    await store.set('containers', this.list());
    await store.save();
  }
}

/** Reduce una foto a una miniatura JPEG cuadrada, para no guardar fotos enormes. */
export function photoToThumbnail(file: File, size = 160): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      canvas
        .getContext('2d')!
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la foto'));
    };
    img.src = url;
  });
}
