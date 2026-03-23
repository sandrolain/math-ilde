import { Component, signal, computed, ChangeDetectionStrategy, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { TimesTableSelectorComponent } from '../../components/times-table-selector/times-table-selector.component';

interface QuizRow {
  factor: number;
  correct: number;
  userValue: string;
  status: 'idle' | 'correct' | 'wrong';
}

@Component({
  selector: 'app-times-table-quiz',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, TimesTableSelectorComponent, FormsModule],
  host: { class: 'block' },
  template: `
    <app-header title="Quiz Tabelline" />

    @if (multiplier() === null) {
      <div class="selector-wrap">
        <app-times-table-selector (selected)="onSelect($event)" />
      </div>
    } @else {
      <main class="main-wrap">
        <div class="quiz-header">
          <h2 class="quiz-title">Tabellina del {{ multiplier() }}</h2>
          <button class="btn btn-primary change-btn" (click)="reset()">🔢 Cambia tabellina</button>
        </div>

        <div
          class="progress-bar"
          role="progressbar"
          [attr.aria-valuenow]="correctCount()"
          aria-valuemin="0"
          [attr.aria-valuemax]="rows().length"
          [attr.aria-label]="correctCount() + ' su ' + rows().length + ' corrette'"
        >
          <div class="progress-fill" [style.width.%]="progressPct()"></div>
        </div>
        <p class="progress-label">{{ correctCount() }} / {{ rows().length }} corrette</p>

        <div class="quiz-table" role="list" aria-label="Esercizi tabellina">
          @for (row of rows(); track row.factor; let i = $index) {
            <div
              class="quiz-row"
              [class.row-correct]="row.status === 'correct'"
              [class.row-wrong]="row.status === 'wrong'"
              role="listitem"
            >
              <span
                class="operation-label"
                [attr.aria-label]="multiplier() + ' per ' + row.factor + ' uguale'"
              >
                {{ multiplier() }} × {{ row.factor }} =
              </span>
              <input
                type="number"
                inputmode="numeric"
                class="answer-input"
                [class.input-correct]="row.status === 'correct'"
                [class.input-wrong]="row.status === 'wrong'"
                [(ngModel)]="rows()[i].userValue"
                (ngModelChange)="onInput(i, $event)"
                [disabled]="row.status === 'correct'"
                [attr.aria-label]="'Risultato di ' + multiplier() + ' per ' + row.factor"
                [attr.aria-describedby]="'status-' + i"
                placeholder="?"
                min="0"
              />
              <span [id]="'status-' + i" class="status-icon" aria-live="polite">
                @if (row.status === 'correct') {
                  ✅
                }
                @if (row.status === 'wrong') {
                  ❌
                }
              </span>
            </div>
          }
        </div>

        @if (allCorrect()) {
          <div class="success-banner" role="alert" aria-live="assertive">
            🎉 Perfetto! Hai completato la tabellina del {{ multiplier() }}!
            <button class="btn btn-success" (click)="reset()">Scegli un'altra tabellina</button>
          </div>
        }
      </main>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .selector-wrap {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 80px);
        padding: 1rem;
      }

      .main-wrap {
        max-width: 560px;
        margin: 0 auto;
        padding: 1.5rem 1rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .quiz-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .quiz-title {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--color-text-primary, #4a5568);
      }

      .change-btn {
        white-space: nowrap;
      }

      .progress-bar {
        height: 12px;
        background: #e5e7eb;
        border-radius: 99px;
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: #34d399;
        border-radius: 99px;
        transition: width 0.4s ease;
      }

      .progress-label {
        font-size: 0.85rem;
        color: var(--color-text-secondary, #718096);
        text-align: right;
      }

      .quiz-table {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .quiz-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        background: white;
        border-radius: 0.875rem;
        border: 2px solid #e5e7eb;
        transition:
          border-color 0.25s,
          background 0.25s;
      }

      .quiz-row.row-correct {
        background: #d1fae5;
        border-color: #34d399;
      }

      .quiz-row.row-wrong {
        background: #fee2e2;
        border-color: #f87171;
      }

      .operation-label {
        flex: 1;
        font-size: clamp(1rem, 4vw, 1.35rem);
        font-weight: 600;
        color: var(--color-text-primary, #4a5568);
        white-space: nowrap;
      }

      .answer-input {
        width: 80px;
        height: 48px;
        border: 2px solid var(--color-primary, #a8d8ea);
        border-radius: 0.75rem;
        font-size: 1.35rem;
        font-weight: 700;
        text-align: center;
        padding: 0;
        color: var(--color-text-primary, #4a5568);
        background: white;
        transition:
          border-color 0.2s,
          background 0.2s;
        /* hide spin buttons */
        appearance: textfield;
        -moz-appearance: textfield;
      }

      .answer-input::-webkit-inner-spin-button,
      .answer-input::-webkit-outer-spin-button {
        display: none;
      }

      .answer-input:focus-visible {
        outline: 3px solid var(--color-primary, #a8d8ea);
        outline-offset: 2px;
      }

      .answer-input:disabled {
        cursor: default;
        background: transparent;
        border-color: #34d399;
      }

      .answer-input.input-wrong {
        background: #fee2e2;
        border-color: #f87171;
        color: #b91c1c;
      }

      .status-icon {
        font-size: 1.5rem;
        min-width: 2rem;
        text-align: center;
      }

      .success-banner {
        margin-top: 1rem;
        background: #d1fae5;
        border: 2px solid #34d399;
        border-radius: 1.25rem;
        padding: 1.5rem;
        text-align: center;
        font-size: 1.25rem;
        font-weight: 700;
        color: #065f46;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }
    `,
  ],
})
export class TimesTableQuizComponent {
  multiplier = signal<number | null>(null);
  rows = signal<QuizRow[]>([]);

  correctCount = computed(() => this.rows().filter((r) => r.status === 'correct').length);
  allCorrect = computed(
    () => this.rows().length > 0 && this.rows().every((r) => r.status === 'correct'),
  );
  progressPct = computed(() => {
    const total = this.rows().length;
    return total === 0 ? 0 : (this.correctCount() / total) * 100;
  });

  onSelect(n: number): void {
    this.multiplier.set(n);
    const generated: QuizRow[] = [];
    for (let f = 1; f <= 10; f++) {
      generated.push({ factor: f, correct: n * f, userValue: '', status: 'idle' });
    }
    this.rows.set(generated);
  }

  onInput(index: number, rawValue: unknown): void {
    const current = this.rows();
    const row = current[index];
    const strValue = rawValue == null ? '' : String(rawValue);
    if (strValue === '' || isNaN(Number(strValue))) {
      this.rows.set(
        current.map((r, i) => (i === index ? { ...r, userValue: strValue, status: 'idle' } : r)),
      );
      return;
    }
    const numeric = parseInt(strValue, 10);
    const status = numeric === row.correct ? 'correct' : 'wrong';
    this.rows.set(current.map((r, i) => (i === index ? { ...r, userValue: strValue, status } : r)));
  }

  reset(): void {
    this.multiplier.set(null);
    this.rows.set([]);
  }
}
