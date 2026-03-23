import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import type { FeedbackType } from '../../types/exercise.types';

const SUCCESS_MESSAGES = [
  'Bravo!',
  'Perfetto!',
  'Complimenti!',
  'Ottimo lavoro!',
  'Sei un campione!',
];

const RETRY_MESSAGES = ['Ritenta!', 'Prova ancora!', 'Quasi! Riprova!', 'Puoi farcela!'];

function randomFrom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

interface Cell {
  row: number;
  col: number;
}

@Component({
  selector: 'app-multiplication-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, FeedbackComponent],
  host: { class: 'block' },
  template: `
    <app-header title="Moltiplicazioni a Griglia" />

    <main class="page-main">
      <!-- Exercise -->
      <div class="exercise-card" role="region" aria-label="Esercizio corrente">
        <div
          class="exercise-operation"
          [attr.aria-label]="exercise().a + ' per ' + exercise().b + ' uguale quanto?'"
        >
          {{ exercise().a }} × {{ exercise().b }} =
          <span class="answer-placeholder">?</span>
        </div>
        <p class="exercise-hint">
          Colora un rettangolo di
          <strong>{{ exercise().a }}</strong> colonne e <strong>{{ exercise().b }}</strong> righe (o
          viceversa)
        </p>
      </div>

      <!-- Instruction -->
      <p class="instruction" role="status" aria-live="polite">{{ instructionText() }}</p>

      <!-- Grid -->
      <div class="grid-scroll-outer">
        <div
          class="grid-wrap"
          role="grid"
          aria-label="Griglia 10 per 10 celle"
          aria-describedby="grid-hint"
        >
          <p id="grid-hint" class="sr-only">
            Griglia 10 righe per 10 colonne. Tocca una cella per iniziare la selezione, poi tocca la
            cella opposta per completare il rettangolo.
          </p>

          <!-- Corner -->
          <div class="grid-corner" aria-hidden="true"></div>

          <!-- Column headers -->
          @for (col of cols; track col) {
            <div class="grid-col-header" aria-hidden="true">{{ col + 1 }}</div>
          }

          <!-- Rows: row header + cells -->
          @for (row of rows; track row) {
            <div class="grid-row-header" aria-hidden="true">{{ row + 1 }}</div>
            @for (col of cols; track col) {
              <button
                class="grid-cell"
                [class.cell-selected]="isCellSelected(row, col)"
                [class.cell-preview]="isCellPreview(row, col)"
                [disabled]="showFeedback()"
                (click)="onCellClick(row, col)"
                (mouseenter)="onCellHover(row, col)"
                (mouseleave)="onCellLeave()"
                role="gridcell"
                [attr.aria-label]="getCellLabel(row, col)"
                [attr.aria-pressed]="isCellSelected(row, col)"
              ></button>
            }
          }
        </div>
      </div>

      <!-- Selection info -->
      @if (selectionDimensions()) {
        <div class="selection-info" role="status" aria-live="polite">
          Selezione: {{ selectionDimensions()!.cols }} colonne ×
          {{ selectionDimensions()!.rows }} righe =
          {{ selectionDimensions()!.cols * selectionDimensions()!.rows }} celle
        </div>
      }

      <!-- Buttons -->
      <div class="btn-row">
        @if (canVerify()) {
          <button class="btn btn-success" (click)="verify()">✅ Verifica</button>
        }
        @if (startCell() !== null) {
          <button class="btn btn-primary" (click)="resetSelection()">🔄 Reimposta</button>
        }
        <button class="btn btn-primary" (click)="newExercise()">➡️ Nuovo esercizio</button>
      </div>
    </main>

    <app-feedback
      [show]="showFeedback()"
      [type]="feedbackType()"
      [message]="feedbackMessage()"
      (next)="newExercise()"
      (close)="retrySelection()"
    />
  `,
  styles: [
    `
      :host {
        display: block;
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

      .page-main {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
        padding: 1rem;
        min-height: calc(100vh - 80px);
      }

      .exercise-card {
        background: white;
        border-radius: 1.5rem;
        padding: 1.25rem 2rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border: 2px solid var(--color-primary, #a8d8ea);
        text-align: center;
        width: 100%;
        max-width: 520px;
      }

      .exercise-operation {
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 700;
        color: var(--color-text-primary, #4a5568);
      }

      .answer-placeholder {
        color: var(--color-primary, #a8d8ea);
        font-size: 1.1em;
      }

      .exercise-hint {
        margin-top: 0.5rem;
        font-size: 0.95rem;
        color: var(--color-text-secondary, #718096);
      }

      .instruction {
        font-size: 1rem;
        color: var(--color-text-secondary, #718096);
        min-height: 1.5em;
        text-align: center;
      }

      .grid-scroll-outer {
        width: 100%;
        overflow-x: auto;
      }

      .grid-wrap {
        display: grid;
        grid-template-columns: 1.75rem repeat(10, 1fr);
        gap: 2px;
        width: min(520px, 100%);
        margin: 0 auto;
      }

      .grid-corner {
        /* empty corner cell */
      }

      .grid-col-header,
      .grid-row-header {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--color-text-secondary, #9ca3af);
        user-select: none;
      }

      .grid-col-header {
        height: 1.75rem;
      }

      .grid-row-header {
        width: 1.75rem;
      }

      .grid-cell {
        aspect-ratio: 1;
        border: 1.5px solid #e5e7eb;
        border-radius: 3px;
        background: #f9fafb;
        cursor: pointer;
        transition:
          background 0.1s,
          border-color 0.1s,
          transform 0.08s;
        touch-action: manipulation;
        padding: 0;
        min-width: 0;
      }

      @media (hover: hover) {
        .grid-cell:hover:not(:disabled):not(.cell-selected):not(.cell-preview) {
          border-color: var(--color-primary, #a8d8ea);
          background: #eff6ff;
        }
      }

      .grid-cell:focus-visible {
        outline: 3px solid var(--color-primary, #a8d8ea);
        outline-offset: 1px;
        z-index: 1;
        position: relative;
      }

      .grid-cell:disabled {
        cursor: default;
      }

      .grid-cell.cell-preview {
        background: #fef9c3;
        border-color: #fbbf24;
      }

      .grid-cell.cell-selected {
        background: #86efac;
        border-color: #22c55e;
      }

      .selection-info {
        font-size: 1rem;
        font-weight: 600;
        color: var(--color-text-primary, #4a5568);
        background: #f0fdf4;
        padding: 0.5rem 1.5rem;
        border-radius: 1rem;
        border: 2px solid #86efac;
        text-align: center;
      }

      .btn-row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        justify-content: center;
        padding-bottom: 1.5rem;
      }
    `,
  ],
})
export class MultiplicationGridComponent {
  readonly rows = Array.from({ length: 10 }, (_, i) => i);
  readonly cols = Array.from({ length: 10 }, (_, i) => i);

  exercise = signal(this.generateExercise());
  startCell = signal<Cell | null>(null);
  endCell = signal<Cell | null>(null);
  hoverCell = signal<Cell | null>(null);
  showFeedback = signal(false);
  isCorrect = signal(false);
  feedbackMessage = signal('');

  feedbackType = computed<FeedbackType>(() => (this.isCorrect() ? 'success' : 'retry'));

  selectionBounds = computed(() => {
    const start = this.startCell();
    const end = this.endCell();
    if (!start) return null;
    const complete = end !== null;
    const e = end ?? start;
    return {
      minRow: Math.min(start.row, e.row),
      maxRow: Math.max(start.row, e.row),
      minCol: Math.min(start.col, e.col),
      maxCol: Math.max(start.col, e.col),
      startRow: start.row,
      startCol: start.col,
      complete,
    };
  });

  previewBounds = computed(() => {
    const start = this.startCell();
    const end = this.endCell();
    if (!start || end) return null;
    const hover = this.hoverCell();
    if (!hover || (hover.row === start.row && hover.col === start.col)) return null;
    return {
      minRow: Math.min(start.row, hover.row),
      maxRow: Math.max(start.row, hover.row),
      minCol: Math.min(start.col, hover.col),
      maxCol: Math.max(start.col, hover.col),
    };
  });

  selectionDimensions = computed(() => {
    const bounds = this.selectionBounds();
    if (!bounds?.complete) return null;
    return {
      rows: bounds.maxRow - bounds.minRow + 1,
      cols: bounds.maxCol - bounds.minCol + 1,
    };
  });

  canVerify = computed(() => this.startCell() !== null && this.endCell() !== null);

  instructionText = computed(() => {
    if (!this.startCell()) return 'Tocca la prima cella del rettangolo';
    if (!this.endCell()) return 'Ora tocca la cella opposta del rettangolo';
    return 'Premi "Verifica" per controllare la tua risposta';
  });

  isCellSelected(row: number, col: number): boolean {
    const bounds = this.selectionBounds();
    if (!bounds) return false;
    if (!bounds.complete) {
      return bounds.startRow === row && bounds.startCol === col;
    }
    return (
      row >= bounds.minRow && row <= bounds.maxRow && col >= bounds.minCol && col <= bounds.maxCol
    );
  }

  isCellPreview(row: number, col: number): boolean {
    if (this.isCellSelected(row, col)) return false;
    const bounds = this.previewBounds();
    if (!bounds) return false;
    return (
      row >= bounds.minRow && row <= bounds.maxRow && col >= bounds.minCol && col <= bounds.maxCol
    );
  }

  getCellLabel(row: number, col: number): string {
    const selected = this.isCellSelected(row, col);
    return `Cella riga ${row + 1} colonna ${col + 1}${selected ? ', selezionata' : ''}`;
  }

  onCellClick(row: number, col: number): void {
    if (this.showFeedback()) return;
    const start = this.startCell();
    const end = this.endCell();

    if (!start) {
      this.startCell.set({ row, col });
    } else if (!end) {
      if (start.row === row && start.col === col) {
        this.startCell.set(null);
      } else {
        this.endCell.set({ row, col });
      }
    } else {
      // Both already set → restart selection
      this.startCell.set({ row, col });
      this.endCell.set(null);
    }
    this.hoverCell.set(null);
  }

  onCellHover(row: number, col: number): void {
    this.hoverCell.set({ row, col });
  }

  onCellLeave(): void {
    this.hoverCell.set(null);
  }

  verify(): void {
    const dims = this.selectionDimensions();
    if (!dims) return;
    const { a, b } = this.exercise();
    const correct = (dims.cols === a && dims.rows === b) || (dims.cols === b && dims.rows === a);
    this.isCorrect.set(correct);
    this.feedbackMessage.set(
      correct
        ? `${randomFrom(SUCCESS_MESSAGES)} ${a} × ${b} = ${a * b}`
        : randomFrom(RETRY_MESSAGES),
    );
    this.showFeedback.set(true);
  }

  resetSelection(): void {
    this.startCell.set(null);
    this.endCell.set(null);
  }

  retrySelection(): void {
    this.startCell.set(null);
    this.endCell.set(null);
    this.showFeedback.set(false);
  }

  newExercise(): void {
    this.exercise.set(this.generateExercise());
    this.startCell.set(null);
    this.endCell.set(null);
    this.hoverCell.set(null);
    this.showFeedback.set(false);
  }

  private generateExercise(): { a: number; b: number } {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    return { a, b };
  }
}
