import { Component, output, ChangeDetectionStrategy } from '@angular/core';

const PASTEL_COLORS = [
  '#a8d8ea', // azzurro
  '#ffb6c1', // rosa
  '#b4e7ce', // verde menta
  '#ffd8a8', // pesca
  '#d8b4fe', // lavanda
  '#fef08a', // giallo
  '#a5f3fc', // ciano
  '#fca5a5', // rosso chiaro
  '#86efac', // verde
  '#fdba74', // arancione
];

@Component({
  selector: 'app-times-table-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="selector-container">
      <p class="selector-subtitle">Scegli la tabellina da esercitare:</p>
      <div class="selector-grid" role="list">
        @for (n of numbers; track n) {
          <button
            class="selector-btn"
            [style.background-color]="getColor(n)"
            [attr.aria-label]="'Scegli la tabellina del ' + n"
            role="listitem"
            (click)="selected.emit(n)"
          >
            {{ n }}
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .selector-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
        padding: 2rem 1rem;
      }

      .selector-subtitle {
        font-size: 1.25rem;
        color: var(--color-text-secondary, #718096);
        text-align: center;
      }

      .selector-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1rem;
        max-width: 520px;
        width: 100%;
      }

      @media (max-width: 480px) {
        .selector-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .selector-btn {
        min-width: 80px;
        min-height: 80px;
        border: none;
        border-radius: 1.25rem;
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-primary, #4a5568);
        cursor: pointer;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .selector-btn:hover,
      .selector-btn:focus-visible {
        transform: scale(1.1);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        outline: 3px solid var(--color-primary, #a8d8ea);
        outline-offset: 2px;
      }

      .selector-btn:active {
        transform: scale(0.97);
      }
    `,
  ],
})
export class TimesTableSelectorComponent {
  selected = output<number>();

  readonly numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  getColor(n: number): string {
    return PASTEL_COLORS[(n - 1) % PASTEL_COLORS.length];
  }
}
