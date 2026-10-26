import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { isoDate } from '../../planner/daily-plan';
import { SettingsService } from '../settings/settings.service';
import { creatineStreak } from './creatine';

/** Casilla de Hoy para marcar si se ha tomado la creatina ese día, con la racha de días seguidos. */
@Component({
  selector: 'app-creatine-card',
  template: `
    <section class="card creatine">
      <label class="check">
        <input type="checkbox" [checked]="taken()" (change)="toggle()" />
        <span>Creatina {{ isToday() ? 'tomada hoy' : 'tomada ese día' }}</span>
      </label>
      <span class="muted streak">
        @if (streak() > 0) {
          🔥 {{ streak() }} {{ streak() === 1 ? 'día seguido' : 'días seguidos' }}
        } @else {
          Sin racha
        }
      </span>
    </section>
  `,
  styles: `
    .creatine {
      max-width: var(--card-max, 860px);
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 20px;
    }
    .check {
      flex-direction: row;
      align-items: center;
      gap: 10px;
      margin: 0;
      cursor: pointer;
      font-weight: 600;
    }
    .check input {
      width: 18px;
      height: 18px;
      accent-color: var(--accent);
      cursor: pointer;
    }
    .streak {
      font-size: 0.9rem;
    }
  `,
})
export class CreatineCard {
  private readonly settings = inject(SettingsService);

  /** Día que se está viendo en Hoy. */
  readonly date = input(new Date());

  private readonly days = signal(new Set<string>());

  protected readonly isToday = computed(() => isoDate(this.date()) === isoDate(new Date()));
  protected readonly taken = computed(() => this.days().has(isoDate(this.date())));
  protected readonly streak = computed(() => creatineStreak(this.days(), this.date()));

  constructor() {
    effect(() => {
      this.date();
      void this.load();
    });
  }

  private async load(): Promise<void> {
    this.days.set(new Set(await this.settings.getCreatineDays()));
  }

  protected async toggle(): Promise<void> {
    const day = isoDate(this.date());
    const days = new Set(this.days());
    if (days.has(day)) {
      days.delete(day);
    } else {
      days.add(day);
    }
    this.days.set(days);
    await this.settings.setCreatineDays([...days]);
  }
}
