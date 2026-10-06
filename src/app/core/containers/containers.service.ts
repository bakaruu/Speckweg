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
        this.list.set((await (await this.open()).get<FoodContainer[]>('containers')) ?? []);
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
