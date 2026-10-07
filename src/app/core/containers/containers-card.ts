import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { newId } from '../../planner/menu-model';
import { ContainersService, FoodContainer, photoToThumbnail } from './containers.service';

/** Ajustes → Mis recipientes: platos y boles con su peso en vacío y una foto. */
@Component({
  selector: 'app-containers-card',
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2>Mis recipientes</h2>
      <p class="muted">
        Si pesas la comida ya servida, apunta aquí lo que pesa cada plato o táper vacío. Al apuntar una comida eliges
        «Pesado con…» y se resta solo. Si usas la tara de la báscula no hace falta.
      </p>

      <ul class="list">
        @for (c of containers.list(); track c.id) {
          <li>
            @if (c.photo) {
              <img [src]="c.photo" alt="" />
            } @else {
              <span class="nophoto">🍽️</span>
            }
            <div class="info">
              <strong>{{ c.name }}</strong>
              <span class="muted">{{ c.grams }} g vacío</span>
            </div>
            <div class="actions">
              <button class="secondary" (click)="edit(c)">Editar</button>
              <button class="secondary danger" (click)="remove(c)">{{ confirm() === c.id ? '¿Seguro?' : 'Borrar' }}</button>
            </div>
          </li>
        } @empty {
          <li class="muted empty">Todavía no tienes recipientes.</li>
        }
      </ul>

      @if (draft(); as d) {
        <div class="editor">
          <label>
            Nombre
            <input [(ngModel)]="d.name" placeholder="Plato hondo blanco" />
          </label>
          <label>
            Peso vacío (g)
            <input type="number" min="1" [(ngModel)]="d.grams" placeholder="Pésalo vacío una vez" />
          </label>
          <label>
            Foto (opcional)
            <input type="file" accept="image/*" (change)="pickPhoto($event)" />
          </label>
          @if (d.photo) {
            <p class="preview">
              <img [src]="d.photo" alt="" />
              <button class="secondary" (click)="d.photo = undefined">Quitar foto</button>
            </p>
          }
          <div class="actions">
            <button (click)="saveDraft()">Guardar</button>
            <button class="secondary" (click)="draft.set(null)">Cancelar</button>
          </div>
        </div>
      } @else {
        <button class="secondary" (click)="add()">Añadir recipiente</button>
      }

      @if (message(); as m) {
        <p [class.error]="m.error">{{ m.text }}</p>
      }
    </section>
  `,
  styles: `
    .list {
      list-style: none;
      padding: 0;
      margin: 0 0 12px;
    }
    li {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 8px 0;
      border-top: 1px solid var(--border);
    }
    li.empty {
      display: block;
    }
    img {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      object-fit: cover;
    }
    .nophoto {
      width: 56px;
      height: 56px;
      border-radius: 8px;
      display: grid;
      place-items: center;
      background: var(--bg);
      font-size: 1.5rem;
    }
    .info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .actions {
      display: flex;
      gap: 8px;
    }
    .editor {
      border-top: 1px solid var(--border);
      padding-top: 12px;
    }
    .preview {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    button.danger {
      color: var(--error);
    }
  `,
})
export class ContainersCard implements OnInit {
  protected readonly containers = inject(ContainersService);
  protected readonly draft = signal<FoodContainer | null>(null);
  protected readonly confirm = signal<string | null>(null);
  protected readonly message = signal<{ text: string; error: boolean } | null>(null);

  async ngOnInit(): Promise<void> {
    await this.containers.load();
  }

  protected add(): void {
    this.message.set(null);
    this.draft.set({ id: '', name: '', grams: 0 });
  }

  protected edit(c: FoodContainer): void {
    this.message.set(null);
    this.draft.set({ ...c });
  }

  protected async pickPhoto(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const d = this.draft();
    if (!file || !d) {
      return;
    }
    try {
      const photo = await photoToThumbnail(file);
      this.draft.set({ ...d, photo });
    } catch (e) {
      this.message.set({ text: e instanceof Error ? e.message : String(e), error: true });
    }
  }

  protected async saveDraft(): Promise<void> {
    const d = this.draft();
    if (!d) {
      return;
    }
    const name = d.name.trim();
    const grams = Number(d.grams);
    if (!name || !(grams > 0)) {
      this.message.set({ text: 'Ponle un nombre y lo que pesa vacío.', error: true });
      return;
    }
    const container: FoodContainer = {
      ...d,
      id: d.id || newId(name, this.containers.list().map((c) => c.id)),
      name,
      grams: Math.round(grams),
    };
    try {
      await this.containers.save(container);
      this.draft.set(null);
      this.message.set({ text: `Guardado «${name}».`, error: false });
    } catch (e) {
      this.message.set({ text: `No se pudo guardar: ${e instanceof Error ? e.message : String(e)}`, error: true });
    }
  }

  protected async remove(c: FoodContainer): Promise<void> {
    if (this.confirm() !== c.id) {
      this.confirm.set(c.id);
      return;
    }
    this.confirm.set(null);
    await this.containers.remove(c.id);
  }
}
