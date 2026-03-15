import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import type { TimesTableRow } from '../../types/exercise.types';

@Component({
  selector: 'app-times-table-exercise',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="exercise-grid" aria-label="Esercizio tabelline">
      <!-- Colonna sinistra: operazioni fisse -->
      <div class="operations-col" aria-label="Operazioni">
        @for (row of rows(); track row.factor) {
          <div
            class="row-item operation-item"
            [attr.aria-label]="row.multiplier + ' per ' + row.factor + ' uguale'"
          >
            <span class="op-text">{{ row.multiplier }} × {{ row.factor }} =</span>
          </div>
        }
      </div>

      <!-- Colonna destra: risultati tap-to-swap -->
      <div
        class="results-col"
        role="group"
        aria-label="Risultati da riordinare. Tocca due numeri per scambiarli di posto."
      >
        <p class="sr-only">
          Tocca un numero per selezionarlo, poi tocca un altro numero per scambiarli di posto.
        </p>
        @for (result of currentOrder(); track $index; let i = $index) {
          <button
            class="row-item result-item"
            [class.result-selected]="selectedIndex() === i"
            [class.result-correct]="positionCorrect()[i] === true"
            [class.result-wrong]="
              positionCorrect()[i] === false && positionCorrect()[i] !== undefined
            "
            [disabled]="isCompleted()"
            (click)="toggleSelect(i)"
            [attr.aria-label]="
              'Risultato ' +
              result +
              (positionCorrect()[i] === true ? ', posizione corretta' : '') +
              (selectedIndex() === i ? ', selezionato' : '')
            "
            [attr.aria-pressed]="selectedIndex() === i"
          >
            <span class="result-text">{{ result }}</span>
          </button>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }

      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .exercise-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        max-width: 560px;
        margin: 0 auto;
      }

      .operations-col,
      .results-col {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .row-item {
        height: 56px;
        display: flex;
        align-items: center;
        border-radius: 0.75rem;
        font-size: clamp(1.1rem, 3vw, 1.5rem);
        font-weight: 600;
        color: var(--color-text-primary, #4a5568);
        box-sizing: border-box;
        flex-shrink: 0;
      }

      .operation-item {
        padding: 0.5rem 1rem;
        background: var(--color-bg-secondary, #f0f8ff);
        border: 2px solid var(--color-primary, #a8d8ea);
        justify-content: flex-end;
      }

      .op-text {
        white-space: nowrap;
      }

      .result-item {
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: white;
        border: 2px solid var(--color-primary, #a8d8ea);
        cursor: pointer;
        justify-content: center;
        transition:
          background 0.15s,
          border-color 0.15s,
          transform 0.1s,
          box-shadow 0.15s;
        touch-action: manipulation;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      }

      @media (hover: hover) {
        .result-item:hover:not(:disabled) {
          border-color: #667eea;
          transform: scale(1.03);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }

      .result-item:disabled {
        cursor: default;
        opacity: 0.8;
      }

      .result-item.result-selected {
        border-color: #667eea;
        background: #eef2ff;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 6px rgba(0, 0, 0, 0.07);
        transform: scale(1.05);
      }

      .result-item.result-correct {
        background: #d1fae5;
        border-color: #34d399;
      }

      .result-item.result-wrong {
        background: #fef3c7;
        border-color: #fbbf24;
      }

      .result-text {
        font-size: clamp(1.2rem, 3vw, 1.6rem);
      }
    `,
  ],
})
export class TimesTableExerciseComponent {
  rows = input.required<TimesTableRow[]>();
  currentOrder = input.required<number[]>();
  positionCorrect = input.required<(boolean | undefined)[]>();
  isCompleted = input.required<boolean>();
  orderChange = output<number[]>();

  selectedIndex = signal<number | null>(null);

  toggleSelect(index: number): void {
    if (this.isCompleted()) return;
    const prev = this.selectedIndex();
    if (prev === null) {
      this.selectedIndex.set(index);
    } else if (prev === index) {
      this.selectedIndex.set(null);
    } else {
      const newOrder = [...this.currentOrder()];
      [newOrder[prev], newOrder[index]] = [newOrder[index], newOrder[prev]];
      this.selectedIndex.set(null);
      this.orderChange.emit(newOrder);
    }
  }
}
