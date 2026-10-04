import { Component } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { mealsFor } from './meal-suggestions';

@Component({
  selector: 'app-today-page',
  imports: [DecimalPipe],
  template: `
    <h1>Hoy</h1>
    <section class="card day">
      <p class="date">{{ dateLabel }}</p>
      <h2>Platos recomendados</h2>
      <ul>
        @for (meal of meals; track meal.slot) {
          <li>
            <span class="slot">{{ meal.slot }}</span>
            <span class="name">{{ meal.name }}</span>
            <span class="macros">{{ meal.protein }} g proteína · {{ meal.kcal | number }} kcal</span>
          </li>
        }
      </ul>
      <p class="total">
        Total aprox.: <strong>{{ totalProtein }} g de proteína</strong> · {{ totalKcal | number }} kcal
      </p>
    </section>
  `,
  styles: `
    .date {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--accent);
    }
    .date::first-letter {
      text-transform: uppercase;
    }
    h2 {
      font-size: 1rem;
      margin: 12px 0 8px;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    li {
      display: grid;
      grid-template-columns: 90px 1fr;
      gap: 2px 12px;
      padding: 10px 0;
      border-top: 1px solid var(--border);
    }
    .slot {
      grid-row: span 2;
      font-weight: 600;
    }
    .macros {
      font-size: 0.85rem;
      opacity: 0.7;
    }
    .total {
      margin: 8px 0 0;
      padding-top: 10px;
      border-top: 1px solid var(--border);
    }
  `,
})
export class TodayPage {
  private readonly today = new Date();

  protected readonly dateLabel = this.today.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  protected readonly meals = mealsFor(this.today);
  protected readonly totalProtein = this.meals.reduce((sum, m) => sum + m.protein, 0);
  protected readonly totalKcal = this.meals.reduce((sum, m) => sum + m.kcal, 0);
}
