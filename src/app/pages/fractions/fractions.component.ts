import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { NumericKeyboardComponent } from '../../components/numeric-keyboard/numeric-keyboard.component';
import { FeedbackService } from '../../services/feedback.service';
import { FractionOptionsStorageService } from '../../services/fraction-options-storage.service';
import type {
  FeedbackType,
  FractionOptions,
  FractionDenominatorGroup,
  FractionFigureType,
  FractionMode,
  FractionExercise,
} from '../../types/exercise.types';

// ---- palettes ----
const PIE_FILLED_COLOR = '#a8d8ea';
const PIE_EMPTY_COLOR = '#f0f4f8';
const BAR_FILLED_COLOR = '#ffb6c1';
const BAR_EMPTY_COLOR = '#f0f4f8';
const OBJECT_FILLED_COLOR = '#b4e7ce';
const OBJECT_EMPTY_COLOR = '#e2e8f0';

// denominators per group
const DENOM_MAP: Record<FractionDenominatorGroup, number[]> = {
  halves: [2, 4, 8],
  thirds: [3, 6, 9],
  mixed: [2, 3, 4, 6, 8],
};

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateChoices(
  correct: { numerator: number; denominator: number },
  pool: number[],
): Array<{ numerator: number; denominator: number }> {
  const choices: Array<{ numerator: number; denominator: number }> = [correct];
  let tries = 0;
  while (choices.length < 4 && tries < 40) {
    tries++;
    const d = pool[rnd(0, pool.length - 1)];
    const n = rnd(1, d - 1);
    const already = choices.some((c) => c.numerator === n && c.denominator === d);
    if (!already) choices.push({ numerator: n, denominator: d });
  }
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

@Component({
  selector: 'app-fractions',
  imports: [HeaderComponent, FeedbackComponent, NumericKeyboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Frazioni Visive" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <div class="lg:hidden flex justify-start mb-4">
              <button
                (click)="toggleMobileMenu()"
                class="btn btn-primary"
                [attr.aria-expanded]="mobileMenuOpen()"
                aria-label="Apri opzioni"
              >
                {{ mobileMenuOpen() ? '✕ Chiudi' : '☰ Opzioni' }}
              </button>
            </div>

            <div
              class="fixed lg:relative inset-y-0 left-0 w-80 bg-white shadow-lg p-6 space-y-6 z-40 transition-transform duration-300 lg:translate-x-0 max-h-screen overflow-y-auto"
              [class.translate-x-[-100%]]="!mobileMenuOpen()"
            >
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-(--color-text-primary)">Opzioni</h3>
                <button
                  (click)="toggleMobileMenu()"
                  class="lg:hidden text-2xl text-(--color-text-primary)"
                  aria-label="Chiudi opzioni"
                >
                  ✕
                </button>
              </div>

              <!-- Modalità -->
              <div class="space-y-2">
                <span class="section-label">Modalità:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="mode"
                      value="figure-to-fraction"
                      class="option-input"
                      [checked]="options().mode === 'figure-to-fraction'"
                      (change)="setMode('figure-to-fraction')"
                    />
                    <span class="option-label">🖼️ → Scrivi la frazione</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="mode"
                      value="fraction-to-figure"
                      class="option-input"
                      [checked]="options().mode === 'fraction-to-figure'"
                      (change)="setMode('fraction-to-figure')"
                    />
                    <span class="option-label">🔢 → Scegli la figura</span>
                  </label>
                </div>
              </div>

              <!-- Tipo di figura -->
              <div class="space-y-2">
                <span class="section-label">Tipo di figura:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="figureType"
                      value="pie"
                      class="option-input"
                      [checked]="options().figureType === 'pie'"
                      (change)="setFigureType('pie')"
                    />
                    <span class="option-label">🥧 Torta</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="figureType"
                      value="bar"
                      class="option-input"
                      [checked]="options().figureType === 'bar'"
                      (change)="setFigureType('bar')"
                    />
                    <span class="option-label">📊 Barra</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="figureType"
                      value="objects"
                      class="option-input"
                      [checked]="options().figureType === 'objects'"
                      (change)="setFigureType('objects')"
                    />
                    <span class="option-label">⭕ Oggetti</span>
                  </label>
                </div>
              </div>

              <!-- Denominatori -->
              <div class="space-y-2">
                <span class="section-label">Denominatori:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="denominatorGroup"
                      value="halves"
                      class="option-input"
                      [checked]="options().denominatorGroup === 'halves'"
                      (change)="setDenominatorGroup('halves')"
                    />
                    <span class="option-label">2, 4, 8</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="denominatorGroup"
                      value="thirds"
                      class="option-input"
                      [checked]="options().denominatorGroup === 'thirds'"
                      (change)="setDenominatorGroup('thirds')"
                    />
                    <span class="option-label">3, 6, 9</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="denominatorGroup"
                      value="mixed"
                      class="option-input"
                      [checked]="options().denominatorGroup === 'mixed'"
                      (change)="setDenominatorGroup('mixed')"
                    />
                    <span class="option-label">Misto (2, 3, 4, 6, 8)</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Pulsante cambia -->
              <div class="text-center mb-8">
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Genera un nuovo esercizio"
                >
                  ➜ Cambia esercizio
                </button>
              </div>

              <!-- ===== MODALITÀ: figura → scrivi frazione ===== -->
              @if (options().mode === 'figure-to-fraction') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                  Guarda la figura e scrivi la frazione corrispondente:
                </p>

                <!-- Figura centrale -->
                <div class="flex justify-center mb-10" aria-hidden="true">
                  <div class="fraction-figure-wrapper">
                    @if (exercise().figureType === 'pie') {
                      <svg
                        [attr.viewBox]="'0 0 200 200'"
                        width="180"
                        height="180"
                        role="img"
                        [attr.aria-label]="figureAriaLabel()"
                      >
                        @for (slice of pieSlices(); track $index) {
                          <path
                            [attr.d]="slice.d"
                            [attr.fill]="slice.filled ? pieFilledColor : pieEmptyColor"
                            stroke="white"
                            stroke-width="3"
                          />
                        }
                      </svg>
                    }

                    @if (exercise().figureType === 'bar') {
                      <div class="bar-container" [attr.aria-label]="figureAriaLabel()">
                        @for (cell of barCells(); track $index) {
                          <div
                            class="bar-cell"
                            [style.background]="cell.filled ? barFilledColor : barEmptyColor"
                          ></div>
                        }
                      </div>
                    }

                    @if (exercise().figureType === 'objects') {
                      <div
                        class="objects-grid"
                        [style.--cols]="exercise().denominator"
                        [attr.aria-label]="figureAriaLabel()"
                      >
                        @for (obj of objectCells(); track $index) {
                          <div
                            class="fraction-object"
                            [style.background]="obj.filled ? objectFilledColor : objectEmptyColor"
                          ></div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Input numeratore / denominatore -->
                <div class="max-w-sm mx-auto space-y-6">
                  <!-- visualizzazione fraction con buchi -->
                  <div class="fraction-input-display" aria-label="Inserisci la frazione">
                    <button
                      class="fraction-slot"
                      [class.fraction-slot--active]="activeField() === 'numerator'"
                      [class.fraction-slot--filled]="numeratorStr().length > 0"
                      (click)="activateField('numerator')"
                      aria-label="Numeratore. Clicca per inserire"
                    >
                      {{ numeratorStr() || '?' }}
                    </button>
                    <div class="fraction-bar" aria-hidden="true"></div>
                    <button
                      class="fraction-slot"
                      [class.fraction-slot--active]="activeField() === 'denominator'"
                      [class.fraction-slot--filled]="denominatorStr().length > 0"
                      (click)="activateField('denominator')"
                      aria-label="Denominatore. Clicca per inserire"
                    >
                      {{ denominatorStr() || '?' }}
                    </button>
                  </div>

                  <!-- Tastiera numerica -->
                  @if (activeField() !== null) {
                    <app-numeric-keyboard
                      (numberPressed)="onNumberPressed($event)"
                      (backspacePressed)="onBackspacePressed()"
                      (clearPressed)="onClearPressed()"
                    />
                  }

                  <button
                    (click)="verifyFigureToFraction()"
                    class="btn btn-primary w-full"
                    [disabled]="numeratorStr().length === 0 || denominatorStr().length === 0"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- ===== MODALITÀ: frazione → scegli figura ===== -->
              @if (options().mode === 'fraction-to-figure') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-6">
                  Quale figura rappresenta la frazione?
                </p>

                <!-- Frazione visualizzata -->
                <div
                  class="fraction-display-large"
                  role="heading"
                  aria-level="2"
                  [attr.aria-label]="exercise().numerator + ' su ' + exercise().denominator"
                >
                  <span class="fraction-num">{{ exercise().numerator }}</span>
                  <div class="fraction-bar-lg" aria-hidden="true"></div>
                  <span class="fraction-den">{{ exercise().denominator }}</span>
                </div>

                <!-- 4 scelte figure -->
                <div class="choices-grid" role="group" aria-label="Scegli la figura corretta">
                  @for (choice of exercise().choices; track $index) {
                    <button
                      class="choice-card"
                      [class.choice-card--selected]="selectedChoice() === $index"
                      [class.choice-card--correct]="
                        showFeedback() && $index === exercise().correctChoiceIndex
                      "
                      [class.choice-card--wrong]="
                        showFeedback() &&
                        selectedChoice() === $index &&
                        $index !== exercise().correctChoiceIndex
                      "
                      (click)="selectChoice($index)"
                      [attr.aria-label]="
                        'Figura ' +
                        ($index + 1) +
                        ': ' +
                        choice.numerator +
                        ' su ' +
                        choice.denominator
                      "
                      [attr.aria-pressed]="selectedChoice() === $index"
                    >
                      @if (exercise().figureType === 'pie') {
                        <svg viewBox="0 0 100 100" width="80" height="80" aria-hidden="true">
                          @for (
                            slice of getPieSlices(choice.numerator, choice.denominator);
                            track $index
                          ) {
                            <path
                              [attr.d]="slice.d"
                              [attr.fill]="slice.filled ? pieFilledColor : pieEmptyColor"
                              stroke="white"
                              stroke-width="2"
                            />
                          }
                        </svg>
                      }
                      @if (exercise().figureType === 'bar') {
                        <div class="bar-container bar-sm" aria-hidden="true">
                          @for (
                            cell of getBarCells(choice.numerator, choice.denominator);
                            track $index
                          ) {
                            <div
                              class="bar-cell"
                              [style.background]="cell.filled ? barFilledColor : barEmptyColor"
                            ></div>
                          }
                        </div>
                      }
                      @if (exercise().figureType === 'objects') {
                        <div
                          class="objects-grid objects-sm"
                          [style.--cols]="choice.denominator"
                          aria-hidden="true"
                        >
                          @for (
                            obj of getObjectCells(choice.numerator, choice.denominator);
                            track $index
                          ) {
                            <div
                              class="fraction-object fraction-object--sm"
                              [style.background]="obj.filled ? objectFilledColor : objectEmptyColor"
                            ></div>
                          }
                        </div>
                      }
                      <span class="choice-label">
                        {{ choice.numerator }}/{{ choice.denominator }}
                      </span>
                    </button>
                  }
                </div>

                <div class="mt-6 max-w-sm mx-auto">
                  <button
                    (click)="verifyFractionToFigure()"
                    class="btn btn-primary w-full"
                    [disabled]="selectedChoice() === null"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- Feedback overlay -->
              <app-feedback
                [show]="showFeedback()"
                [type]="feedbackType()"
                [message]="feedbackMessage()"
                (close)="closeFeedback()"
                (next)="nextExercise()"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ---- Torta SVG ---- */
      .fraction-figure-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.12));
      }

      /* ---- Barra ---- */
      .bar-container {
        display: flex;
        border-radius: 12px;
        overflow: hidden;
        gap: 3px;
        padding: 3px;
        background: #e2e8f0;
        width: 300px;
        height: 70px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
      }

      .bar-sm {
        width: 120px;
        height: 36px;
      }

      .bar-cell {
        flex: 1;
        border-radius: 8px;
        transition: background 0.2s;
      }

      /* ---- Oggetti ---- */
      .objects-grid {
        display: grid;
        grid-template-columns: repeat(var(--cols), 1fr);
        gap: 6px;
        padding: 4px;
      }

      .objects-sm {
        gap: 4px;
      }

      .fraction-object {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        transition: background 0.2s;
      }

      .fraction-object--sm {
        width: 18px;
        height: 18px;
      }

      /* ---- Input frazione (figura→frazione) ---- */
      .fraction-input-display {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
      }

      .fraction-slot {
        width: 100px;
        height: 70px;
        border: 3px dashed var(--color-primary);
        border-radius: 16px;
        background: white;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        touch-action: manipulation;
      }

      .fraction-slot--active {
        border-style: solid;
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
        transform: scale(1.05);
      }

      .fraction-slot--filled {
        border-style: solid;
        border-color: var(--color-primary);
      }

      .fraction-bar {
        width: 120px;
        height: 5px;
        background: var(--color-text-primary);
        border-radius: 3px;
        margin: 4px 0;
      }

      /* ---- Frazione grande (frazione→figura) ---- */
      .fraction-display-large {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
        margin-bottom: 2rem;
      }

      .fraction-num,
      .fraction-den {
        font-size: 4rem;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
      }

      .fraction-bar-lg {
        width: 100px;
        height: 6px;
        background: var(--color-text-primary);
        border-radius: 3px;
        margin: 6px 0;
      }

      /* ---- Griglia scelte ---- */
      .choices-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        max-width: 480px;
        margin: 0 auto;
      }

      .choice-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        border: 3px solid #e2e8f0;
        border-radius: 20px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        touch-action: manipulation;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
      }

      @media (hover: hover) {
        .choice-card:hover {
          border-color: var(--color-primary);
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        }
      }

      .choice-card--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.07);
        transform: scale(1.04);
      }

      .choice-card--correct {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25) !important;
      }

      .choice-card--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
      }

      .choice-label {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class FractionsComponent {
  readonly pieFilledColor = PIE_FILLED_COLOR;
  readonly pieEmptyColor = PIE_EMPTY_COLOR;
  readonly barFilledColor = BAR_FILLED_COLOR;
  readonly barEmptyColor = BAR_EMPTY_COLOR;
  readonly objectFilledColor = OBJECT_FILLED_COLOR;
  readonly objectEmptyColor = OBJECT_EMPTY_COLOR;

  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(FractionOptionsStorageService);

  options = signal<FractionOptions>(this.storageService.loadOptions());
  exercise = signal<FractionExercise>(this.buildExercise());

  // figure-to-fraction state
  activeField = signal<'numerator' | 'denominator' | null>('numerator');
  numeratorStr = signal<string>('');
  denominatorStr = signal<string>('');

  // fraction-to-figure state
  selectedChoice = signal<number | null>(null);

  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  figureAriaLabel = computed(() => {
    const ex = this.exercise();
    return `Figura: ${ex.numerator} su ${ex.denominator} parti colorate`;
  });

  feedbackMessage = computed(() => {
    const ex = this.exercise();
    if (this.feedbackType() === 'success') {
      return this.feedbackService.getMessage('success');
    }
    if (this.feedbackType() === 'show-answer') {
      return `La risposta corretta è ${ex.numerator}/${ex.denominator}. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  pieSlices = computed(() =>
    this.getPieSlices(this.exercise().numerator, this.exercise().denominator),
  );
  barCells = computed(() =>
    this.getBarCells(this.exercise().numerator, this.exercise().denominator),
  );
  objectCells = computed(() =>
    this.getObjectCells(this.exercise().numerator, this.exercise().denominator),
  );

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
  }

  // ---- input handlers (figure-to-fraction) ----

  activateField(field: 'numerator' | 'denominator'): void {
    this.activeField.set(field);
  }

  onNumberPressed(num: number): void {
    const field = this.activeField();
    if (field === 'numerator') {
      if (this.numeratorStr().length < 2) this.numeratorStr.update((s) => s + num);
    } else if (field === 'denominator') {
      if (this.denominatorStr().length < 2) this.denominatorStr.update((s) => s + num);
    }
  }

  onBackspacePressed(): void {
    const field = this.activeField();
    if (field === 'numerator') this.numeratorStr.update((s) => s.slice(0, -1));
    else if (field === 'denominator') this.denominatorStr.update((s) => s.slice(0, -1));
  }

  onClearPressed(): void {
    const field = this.activeField();
    if (field === 'numerator') this.numeratorStr.set('');
    else if (field === 'denominator') this.denominatorStr.set('');
  }

  verifyFigureToFraction(): void {
    const n = parseInt(this.numeratorStr(), 10);
    const d = parseInt(this.denominatorStr(), 10);
    const ex = this.exercise();
    const correct = n === ex.numerator && d === ex.denominator;
    this.attemptCount.update((c) => c + 1);
    if (correct) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- choice handlers (fraction-to-figure) ----

  selectChoice(index: number): void {
    if (!this.showFeedback()) this.selectedChoice.set(index);
  }

  verifyFractionToFigure(): void {
    const chosen = this.selectedChoice();
    if (chosen === null) return;
    this.attemptCount.update((c) => c + 1);
    const correct = chosen === this.exercise().correctChoiceIndex;
    if (correct) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.numeratorStr.set('');
    this.denominatorStr.set('');
    this.activeField.set('numerator');
    this.selectedChoice.set(null);
  }

  nextExercise(): void {
    this.exercise.set(this.buildExercise());
    this.numeratorStr.set('');
    this.denominatorStr.set('');
    this.activeField.set('numerator');
    this.selectedChoice.set(null);
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  setMode(mode: FractionMode): void {
    this.options.update((o) => ({ ...o, mode }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setFigureType(figureType: FractionFigureType): void {
    this.options.update((o) => ({ ...o, figureType }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setDenominatorGroup(denominatorGroup: FractionDenominatorGroup): void {
    this.options.update((o) => ({ ...o, denominatorGroup }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  // ---- figure helpers (public for template reuse) ----

  getPieSlices(numerator: number, denominator: number): Array<{ d: string; filled: boolean }> {
    const slices: Array<{ d: string; filled: boolean }> = [];
    const cx = 100,
      cy = 100,
      r = 90;
    for (let i = 0; i < denominator; i++) {
      const startAngle = (i / denominator) * 2 * Math.PI - Math.PI / 2;
      const endAngle = ((i + 1) / denominator) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const largeArc = denominator === 1 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
      slices.push({ d, filled: i < numerator });
    }
    return slices;
  }

  getBarCells(numerator: number, denominator: number): Array<{ filled: boolean }> {
    return Array.from({ length: denominator }, (_, i) => ({ filled: i < numerator }));
  }

  getObjectCells(numerator: number, denominator: number): Array<{ filled: boolean }> {
    return Array.from({ length: denominator }, (_, i) => ({ filled: i < numerator }));
  }

  // ---- exercise generation ----

  private buildExercise(): FractionExercise {
    const options = this.options();
    const pool = DENOM_MAP[options.denominatorGroup];
    const denominator = pool[rnd(0, pool.length - 1)];
    const numerator = rnd(1, denominator - 1);
    const correct = { numerator, denominator };

    // generate distractors from the same denominator group
    const choices = generateChoices(correct, pool);
    const correctChoiceIndex = choices.findIndex(
      (c) => c.numerator === numerator && c.denominator === denominator,
    );

    return {
      numerator,
      denominator,
      figureType: options.figureType,
      mode: options.mode,
      choices,
      correctChoiceIndex,
    };
  }
}
