import { Component, computed, input, output, signal } from '@angular/core';
import { monthGrid } from './calendar';

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

/** Calendario de un mes para saltar a un día. Marca con un punto los días que tienen datos. */
@Component({
  selector: 'app-month-calendar',
  template: `
    <div class="calendar">
      <header>
        <button class="secondary" (click)="move(-1)" aria-label="Mes anterior">‹</button>
        <strong>{{ monthLabel() }}</strong>
        <button
          class="secondary"
          (click)="move(1)"
          [disabled]="!canGoForward()"
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </header>
      <div class="grid">
        @for (w of weekdays; track $index) {
          <span class="weekday muted">{{ w }}</span>
        }
        @for (week of weeks(); track $index) {
          @for (d of week; track d.iso) {
            <button
              class="day"
              [class.out]="!d.inMonth"
              [class.selected]="d.iso === selected()"
              [class.today]="d.iso === max()"
              [disabled]="d.iso > max()"
              (click)="pick.emit(d.iso)"
            >
              {{ d.day }}
              <span class="dot" [class.on]="marked().has(d.iso)"></span>
            </button>
          }
        }
      </div>
    </div>
  `,
  styles: `
    .calendar {
      width: 280px;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow: 0 8px 24px rgb(0 0 0 / 0.35);
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    header button {
      padding: 2px 10px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      text-align: center;
    }
    .weekday {
      font-size: 0.75rem;
      padding: 4px 0;
    }
    .day {
      position: relative;
      padding: 6px 0 10px;
      border: 1px solid transparent;
      border-radius: 6px;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }
    .day:hover:not(:disabled) {
      background: var(--accent-soft);
    }
    .day.out {
      opacity: 0.4;
    }
    .day:disabled {
      opacity: 0.25;
      cursor: default;
    }
    .day.today {
      border-color: var(--border);
    }
    .day.selected {
      background: var(--accent);
      color: var(--bg);
      font-weight: 700;
    }
    .dot {
      position: absolute;
      left: 50%;
      bottom: 3px;
      width: 4px;
      height: 4px;
      margin-left: -2px;
      border-radius: 50%;
    }
    .dot.on {
      background: var(--accent);
    }
    .day.selected .dot.on {
      background: var(--bg);
    }
  `,
})
export class MonthCalendar {
  /** Día elegido y último día que se puede elegir (hoy), en YYYY-MM-DD. */
  readonly selected = input.required<string>();
  readonly max = input.required<string>();
  /** Días con algo apuntado, entreno o datos del reloj. */
  readonly marked = input(new Set<string>());
  /** Mes que se enseña al abrir. */
  readonly start = input.required<Date>();

  readonly pick = output<string>();

  protected readonly weekdays = WEEKDAYS;
  /** Meses que se ha movido desde el de `start`. */
  private readonly shift = signal(0);

  private readonly month = computed(() => {
    const s = this.start();
    return new Date(s.getFullYear(), s.getMonth() + this.shift(), 1);
  });
  protected readonly weeks = computed(() =>
    monthGrid(this.month().getFullYear(), this.month().getMonth()),
  );
  protected readonly monthLabel = computed(() => {
    const label = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(
      this.month(),
    );
    return label.charAt(0).toUpperCase() + label.slice(1);
  });
  protected readonly canGoForward = computed(() => {
    const next = new Date(this.month().getFullYear(), this.month().getMonth() + 1, 1);
    const [y, m] = this.max().split('-').map(Number);
    return next <= new Date(y, m - 1, 1);
  });

  protected move(months: number): void {
    this.shift.update((s) => s + months);
  }
}
