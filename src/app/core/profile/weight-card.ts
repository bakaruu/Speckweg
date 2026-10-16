import { Component, computed, effect, inject, signal } from '@angular/core';
import { SettingsService } from '../settings/settings.service';
import { TrainingService } from '../../training/training.service';
import { WeightEntry } from './body';
import {
  buildChart,
  inRange,
  kgLabel,
  shortDate,
  TrendPoint,
  WEIGHT_RANGES,
  WeightRange,
  weightTrend,
} from './weight-chart';

const BOX = { width: 520, height: 210, left: 40, right: 14, top: 14, bottom: 28 };

/** Resumen → gráfica del peso de la báscula con su tendencia y lo que llevas bajado. */
@Component({
  selector: 'app-weight-card',
  template: `
    @if (all().length > 0) {
      <section class="card weight">
        <header>
          <div>
            <h2>Peso</h2>
            <p class="now">
              <strong>{{ kg(shown().kg) }}</strong> kg
              @if (hovered(); as h) {
                <span class="muted">· {{ date(h.date) }}</span>
              }
            </p>
            @if (hovered(); as h) {
              <p class="muted small">Tendencia ese día: {{ kg(h.trend) }} kg</p>
            } @else if (total(); as t) {
              <p class="small" [class.good]="t.kg < 0">
                {{ t.kg < 0 ? 'Has bajado' : t.kg > 0 ? 'Has subido' : 'Igual que' }}
                @if (t.kg !== 0) {
                  <strong>{{ kg(abs(t.kg)) }} kg</strong> desde
                }
                tu primer pesaje ({{ date(t.since) }})
              </p>
            }
          </div>
          <div class="ranges" role="group" aria-label="Periodo">
            @for (r of ranges; track r.range) {
              <button class="secondary" [class.selected]="range() === r.range" (click)="range.set(r.range)">
                {{ r.label }}
              </button>
            }
          </div>
        </header>

        @if (chart(); as c) {
          <svg [attr.viewBox]="viewBox" role="img" [attr.aria-label]="ariaLabel()" (mouseleave)="hovered.set(null)">
            <defs>
              <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stop-color="var(--accent)" stop-opacity="0.28" />
                <stop offset="1" stop-color="var(--accent)" stop-opacity="0" />
              </linearGradient>
            </defs>
            @for (t of c.yTicks; track t.label) {
              <line class="grid" [attr.x1]="box.left" [attr.x2]="box.width - box.right" [attr.y1]="t.y" [attr.y2]="t.y" />
              <text class="axis" [attr.x]="box.left - 6" [attr.y]="t.y + 4" text-anchor="end">{{ t.label }}</text>
            }
            @for (t of c.xTicks; track t.label; let first = $first; let last = $last) {
              <text
                class="axis"
                [attr.x]="t.x"
                [attr.y]="box.height - 8"
                [attr.text-anchor]="first ? 'start' : last ? 'end' : 'middle'"
              >
                {{ t.label }}
              </text>
            }
            <path class="area" [attr.d]="c.areaPath" fill="url(#weight-fill)" />
            <path class="trend" [attr.d]="c.trendPath" />
            @for (d of c.dots; track d.date; let last = $last) {
              <circle class="dot" [class.last]="last" [class.on]="hovered()?.date === d.date" [attr.cx]="d.x" [attr.cy]="d.y" [attr.r]="last ? 5 : 3" />
            }
            @if (hovered(); as h) {
              @for (d of c.dots; track d.date) {
                @if (d.date === h.date) {
                  <line class="cursor" [attr.x1]="d.x" [attr.x2]="d.x" [attr.y1]="box.top" [attr.y2]="box.height - box.bottom" />
                }
              }
            }
            @for (d of c.dots; track d.date) {
              <circle class="hit" [attr.cx]="d.x" [attr.cy]="d.y" r="12" (mouseenter)="hovered.set(d)" />
            }
          </svg>
          <p class="legend muted small">
            <span><i class="dot-key"></i> Cada pesaje</span>
            <span><i class="line-key"></i> Tendencia (la media, sin los subidones de un día)</span>
          </p>
          @if (periodChange(); as p) {
            <p class="small">
              En {{ rangeLabel() }} tu tendencia ha {{ p < 0 ? 'bajado' : 'subido' }}
              <strong [class.good]="p < 0">{{ kg(abs(p)) }} kg</strong>.
            </p>
          }
        } @else {
          <p class="muted small">
            Cuando haya al menos dos pesajes en este periodo verás aquí la gráfica. El peso llega solo desde la báscula
            con el Atajo del iPhone.
          </p>
        }
      </section>
    }
  `,
  styles: `
    .weight {
      max-width: var(--card-max, 860px);
      margin-bottom: 16px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    h2 {
      margin: 0 0 4px;
    }
    p {
      margin: 0 0 4px;
    }
    .now strong {
      font-size: 1.8rem;
      color: var(--accent);
    }
    .small {
      font-size: 0.85rem;
    }
    .good {
      color: var(--accent);
    }
    .ranges {
      display: flex;
      gap: 4px;
    }
    .ranges button {
      padding: 4px 10px;
      font-size: 0.85rem;
    }
    .ranges button.selected {
      background: var(--accent);
      color: #fff;
    }
    svg {
      width: 100%;
      height: auto;
      display: block;
      margin: 8px 0 4px;
      overflow: visible;
    }
    .grid {
      stroke: var(--border);
      stroke-width: 1;
    }
    .axis {
      fill: currentColor;
      opacity: 0.55;
      font-size: 11px;
    }
    .trend {
      fill: none;
      stroke: var(--accent);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .dot {
      fill: var(--surface);
      stroke: var(--accent);
      stroke-width: 1.5;
      opacity: 0.7;
    }
    .dot.last,
    .dot.on {
      fill: var(--accent);
      opacity: 1;
    }
    .cursor {
      stroke: var(--accent);
      stroke-dasharray: 3 3;
      opacity: 0.6;
    }
    .hit {
      fill: transparent;
      cursor: pointer;
    }
    .legend {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    .legend i {
      display: inline-block;
      vertical-align: middle;
      margin-right: 4px;
    }
    .dot-key {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      border: 1.5px solid var(--accent);
    }
    .line-key {
      width: 18px;
      height: 3px;
      border-radius: 2px;
      background: var(--accent);
    }
  `,
})
export class WeightCard {
  private readonly settings = inject(SettingsService);
  private readonly training = inject(TrainingService);

  protected readonly box = BOX;
  protected readonly viewBox = `0 0 ${BOX.width} ${BOX.height}`;
  protected readonly ranges = WEIGHT_RANGES;
  protected readonly range = signal<WeightRange>('3m');
  protected readonly hovered = signal<TrendPoint | null>(null);

  private readonly log = signal<WeightEntry[]>([]);
  protected readonly all = computed(() => weightTrend(this.log()));
  protected readonly points = computed(() => inRange(this.all(), this.range()));
  protected readonly chart = computed(() => buildChart(this.points(), BOX));
  protected readonly shown = computed(() => this.hovered() ?? this.all().at(-1)!);
  protected readonly total = computed(() => {
    const all = this.all();
    if (all.length < 2) {
      return undefined;
    }
    return { kg: round(all.at(-1)!.kg - all[0].kg), since: all[0].date };
  });
  protected readonly periodChange = computed(() => {
    const p = this.points();
    const change = p.length < 2 ? 0 : round(p.at(-1)!.trend - p[0].trend);
    return change === 0 ? undefined : change;
  });
  protected readonly rangeLabel = computed(() =>
    this.range() === '1m' ? 'el último mes' : this.range() === '3m' ? 'los últimos 3 meses' : 'todo este tiempo',
  );
  protected readonly ariaLabel = computed(() => {
    const p = this.points();
    return p.length ? `Peso de ${kgLabel(p[0].kg)} a ${kgLabel(p.at(-1)!.kg)} kg` : 'Peso';
  });

  constructor() {
    // Se vuelve a leer cuando la sincronización trae pesos nuevos de la báscula.
    effect(() => {
      this.training.version();
      void this.settings.getWeightLog().then((log) => this.log.set(log));
    });
  }

  protected kg(kg: number): string {
    return kgLabel(Math.round(kg * 10) / 10);
  }

  protected date(date: string): string {
    return shortDate(date);
  }

  protected abs(n: number): number {
    return Math.abs(n);
  }
}

function round(kg: number): number {
  return Math.round(kg * 10) / 10;
}
