import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import type { TimesTableRow } from '../../types/exercise.types';

@Component({
  selector: 'app-times-table-exercise',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DragDropModule],
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

      <!-- Colonna destra: risultati drag-and-drop -->
      <div
        class="results-col"
        cdkDropList
        cdkDropListOrientation="vertical"
        [cdkDropListData]="currentOrderMutable"
        (cdkDropListDropped)="onDrop($event)"
        aria-label="Risultati da riordinare"
        aria-describedby="drag-instructions"
      >
        <p id="drag-instructions" class="sr-only">
          Premi Spazio per iniziare a spostare un risultato. Usa i tasti freccia su e giù per
          spostarti nella lista. Premi di nuovo Spazio per rilasciare.
        </p>
        @for (result of currentOrderMutable; track result; let i = $index) {
          <div
            cdkDrag
            class="row-item result-item"
            [class.result-correct]="positionCorrect()[i] === true"
            [class.result-wrong]="
              positionCorrect()[i] === false && positionCorrect()[i] !== undefined
            "
            [cdkDragDisabled]="isCompleted()"
            [attr.aria-label]="
              'Risultato ' + result + (positionCorrect()[i] ? ', posizione corretta' : '')
            "
          >
            <span class="result-text">{{ result }}</span>
            <div class="drag-handle" cdkDragHandle aria-hidden="true">⠿</div>
            <!-- Preview durante il drag -->
            <div *cdkDragPlaceholder class="drag-placeholder"></div>
          </div>
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
        padding: 0.5rem 0.75rem;
        background: white;
        border: 2px solid var(--color-primary, #a8d8ea);
        cursor: grab;
        justify-content: space-between;
        user-select: none;
        transition:
          background 0.2s,
          border-color 0.2s;
      }

      .result-item:active {
        cursor: grabbing;
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

      .drag-handle {
        font-size: 1.2rem;
        color: #9ca3af;
        cursor: grab;
        padding-left: 0.5rem;
        flex-shrink: 0;
      }

      .drag-placeholder {
        height: 56px;
        border-radius: 0.75rem;
        background: #e0f2fe;
        border: 2px dashed var(--color-primary, #a8d8ea);
        box-sizing: border-box;
        flex-shrink: 0;
      }

      .cdk-drag-preview {
        border-radius: 0.75rem;
        background: white;
        border: 2px solid var(--color-primary, #a8d8ea);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        display: flex;
        align-items: center;
        padding: 0.5rem 0.75rem;
        font-size: clamp(1.2rem, 3vw, 1.6rem);
        font-weight: 600;
        color: var(--color-text-primary, #4a5568);
      }

      .cdk-drag-animating {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
      }

      .results-col.cdk-drop-list-dragging .result-item:not(.cdk-drag-placeholder) {
        transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
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

  // Copia mutabile dell'array per il CDK drag-drop (che richiede mutabilità)
  get currentOrderMutable(): number[] {
    return [...this.currentOrder()];
  }

  onDrop(event: CdkDragDrop<number[]>): void {
    const newOrder = [...this.currentOrder()];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
    this.orderChange.emit(newOrder);
  }
}
