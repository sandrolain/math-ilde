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
import { MeasurementOptionsStorageService } from '../../services/measurement-options-storage.service';
import type {
  FeedbackType,
  MeasurementOptions,
  MeasurementCategory,
  MeasurementDirection,
  MeasurementLevel,
  MeasurementExercise,
} from '../../types/exercise.types';

// ---- Definizioni unità di misura ----

interface UnitDef {
  label: string;
  factor: number; // relativo all'unità base della categoria
}

const CATEGORY_UNITS: Record<Exclude<MeasurementCategory, 'mixed'>, UnitDef[]> = {
  length: [
    { label: 'mm', factor: 1 },
    { label: 'cm', factor: 10 },
    { label: 'dm', factor: 100 },
    { label: 'm', factor: 1000 },
    { label: 'km', factor: 1000000 },
  ],
  weight: [
    { label: 'g', factor: 1 },
    { label: 'etto', factor: 100 },
    { label: 'kg', factor: 1000 },
  ],
  capacity: [
    { label: 'ml', factor: 1 },
    { label: 'cl', factor: 10 },
    { label: 'dl', factor: 100 },
    { label: 'l', factor: 1000 },
  ],
  time: [
    { label: 'sec', factor: 1 },
    { label: 'min', factor: 60 },
    { label: 'ore', factor: 3600 },
    { label: 'giorni', factor: 86400 },
  ],
};

const CATEGORY_LABELS: Record<Exclude<MeasurementCategory, 'mixed'>, string> = {
  length: 'Lunghezza',
  weight: 'Peso',
  capacity: 'Capacità',
  time: 'Tempo',
};

const CATEGORY_EMOJIS: Record<Exclude<MeasurementCategory, 'mixed'>, string> = {
  length: '📏',
  weight: '⚖️',
  capacity: '💧',
  time: '⏱️',
};

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateExercise(opts: MeasurementOptions): MeasurementExercise {
  const catKeys: Array<Exclude<MeasurementCategory, 'mixed'>> = [
    'length',
    'weight',
    'capacity',
    'time',
  ];
  const cat: Exclude<MeasurementCategory, 'mixed'> =
    opts.category === 'mixed'
      ? catKeys[rnd(0, catKeys.length - 1)]
      : (opts.category as Exclude<MeasurementCategory, 'mixed'>);

  const allUnits = CATEGORY_UNITS[cat];
  const activeCount =
    opts.level === 'easy'
      ? 3
      : opts.level === 'medium'
        ? Math.min(4, allUnits.length)
        : allUnits.length;
  const units = allUnits.slice(0, activeCount);

  const maxVal = opts.level === 'easy' ? 9 : opts.level === 'medium' ? 20 : 50;
  const maxGap = opts.level === 'hard' ? 2 : 1;

  const dir: 'big-to-small' | 'small-to-big' =
    opts.direction === 'mixed'
      ? rnd(0, 1) === 0
        ? 'big-to-small'
        : 'small-to-big'
      : opts.direction;

  for (let tries = 0; tries < 60; tries++) {
    const gap = rnd(1, Math.min(maxGap, units.length - 1));
    const smallIdx = rnd(0, units.length - 1 - gap);
    const largeIdx = smallIdx + gap;
    const smallUnit = units[smallIdx];
    const largeUnit = units[largeIdx];
    const ratio = largeUnit.factor / smallUnit.factor;

    let fromValue: number;
    let result: number;
    let fromUnit: UnitDef;
    let toUnit: UnitDef;

    if (dir === 'big-to-small') {
      fromUnit = largeUnit;
      toUnit = smallUnit;
      const maxFrom = Math.min(maxVal, Math.floor(9999 / ratio));
      if (maxFrom < 1) continue;
      fromValue = rnd(1, maxFrom);
      result = fromValue * ratio;
    } else {
      fromUnit = smallUnit;
      toUnit = largeUnit;
      const resultVal = rnd(1, maxVal);
      fromValue = resultVal * ratio;
      result = resultVal;
      if (fromValue > 9999) continue;
    }

    const hint = `1 ${largeUnit.label} = ${ratio} ${smallUnit.label}`;
    return {
      fromValue,
      fromUnit: fromUnit.label,
      toUnit: toUnit.label,
      correctAnswer: result,
      category: cat,
      hint,
    };
  }

  // Fallback
  return {
    fromValue: 3,
    fromUnit: 'm',
    toUnit: 'cm',
    correctAnswer: 300,
    category: 'length',
    hint: '1 m = 100 cm',
  };
}

@Component({
  selector: 'app-measurement',
  imports: [HeaderComponent, FeedbackComponent, NumericKeyboardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Misure e Conversioni" />

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

              <!-- Categoria -->
              <div class="space-y-2">
                <span class="section-label">Categoria:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="category"
                      value="length"
                      class="option-input"
                      [checked]="options().category === 'length'"
                      (change)="setCategory('length')"
                    />
                    <span class="option-label">📏 Lunghezza</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="category"
                      value="weight"
                      class="option-input"
                      [checked]="options().category === 'weight'"
                      (change)="setCategory('weight')"
                    />
                    <span class="option-label">⚖️ Peso</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="category"
                      value="capacity"
                      class="option-input"
                      [checked]="options().category === 'capacity'"
                      (change)="setCategory('capacity')"
                    />
                    <span class="option-label">💧 Capacità</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="category"
                      value="time"
                      class="option-input"
                      [checked]="options().category === 'time'"
                      (change)="setCategory('time')"
                    />
                    <span class="option-label">⏱️ Tempo</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="category"
                      value="mixed"
                      class="option-input"
                      [checked]="options().category === 'mixed'"
                      (change)="setCategory('mixed')"
                    />
                    <span class="option-label">🎲 Misto</span>
                  </label>
                </div>
              </div>

              <!-- Direzione -->
              <div class="space-y-2">
                <span class="section-label">Direzione:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="direction"
                      value="big-to-small"
                      class="option-input"
                      [checked]="options().direction === 'big-to-small'"
                      (change)="setDirection('big-to-small')"
                    />
                    <span class="option-label">📉 Grande → Piccola</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="direction"
                      value="small-to-big"
                      class="option-input"
                      [checked]="options().direction === 'small-to-big'"
                      (change)="setDirection('small-to-big')"
                    />
                    <span class="option-label">📈 Piccola → Grande</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="direction"
                      value="mixed"
                      class="option-input"
                      [checked]="options().direction === 'mixed'"
                      (change)="setDirection('mixed')"
                    />
                    <span class="option-label">🔀 Mista</span>
                  </label>
                </div>
              </div>

              <!-- Livello -->
              <div class="space-y-2">
                <span class="section-label">Livello:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="easy"
                      class="option-input"
                      [checked]="options().level === 'easy'"
                      (change)="setLevel('easy')"
                    />
                    <span class="option-label">⭐ Facile</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="medium"
                      class="option-input"
                      [checked]="options().level === 'medium'"
                      (change)="setLevel('medium')"
                    />
                    <span class="option-label">⭐⭐ Medio</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="hard"
                      class="option-input"
                      [checked]="options().level === 'hard'"
                      (change)="setLevel('hard')"
                    />
                    <span class="option-label">⭐⭐⭐ Difficile</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Pulsante cambia -->
              <div class="text-center mb-6">
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Genera un nuovo esercizio"
                >
                  ➜ Cambia esercizio
                </button>
              </div>

              <!-- Etichetta categoria -->
              <div class="category-badge">
                <span class="category-emoji" aria-hidden="true">{{ categoryEmoji() }}</span>
                <span class="category-label-text">{{ categoryLabel() }}</span>
              </div>

              <!-- Esercizio principale -->
              <div
                class="conversion-display"
                role="group"
                [attr.aria-label]="
                  exercise().fromValue +
                  ' ' +
                  exercise().fromUnit +
                  ' quanti ' +
                  exercise().toUnit +
                  ' sono?'
                "
              >
                <span
                  class="conversion-value"
                  [attr.aria-label]="exercise().fromValue + ' ' + exercise().fromUnit"
                >
                  {{ exercise().fromValue
                  }}<span class="conversion-unit">{{ exercise().fromUnit }}</span>
                </span>
                <span class="conversion-equals" aria-hidden="true">=</span>
                <div
                  class="conversion-answer"
                  [attr.aria-label]="'Inserisci la risposta in ' + exercise().toUnit"
                >
                  <span class="answer-digits">{{ answerStr() || '?' }}</span>
                  <span class="conversion-unit">{{ exercise().toUnit }}</span>
                </div>
              </div>

              <!-- Suggerimento -->
              <div
                class="hint-box"
                role="note"
                [attr.aria-label]="'Suggerimento: ' + exercise().hint"
              >
                💡 {{ exercise().hint }}
              </div>

              <!-- Tastiera numerica -->
              <div class="max-w-sm mx-auto mt-6">
                <app-numeric-keyboard
                  (numberPressed)="onNumberPressed($event)"
                  (backspacePressed)="onBackspacePressed()"
                  (clearPressed)="onClearPressed()"
                />
              </div>

              <!-- Pulsante verifica -->
              <div class="mt-6 max-w-sm mx-auto">
                <button
                  (click)="verify()"
                  class="btn btn-primary w-full"
                  [disabled]="answerStr().length === 0"
                  aria-label="Verifica la risposta"
                >
                  Verifica la risposta
                </button>
              </div>

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
      /* ---- Category badge ---- */
      .category-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.75rem;
      }

      .category-emoji {
        font-size: 2rem;
      }

      .category-label-text {
        font-size: 1.25rem;
        font-weight: 700;
        color: var(--color-text-secondary);
      }

      /* ---- Conversion display ---- */
      .conversion-display {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.5rem;
      }

      .conversion-value {
        display: inline-flex;
        align-items: baseline;
        gap: 0.2rem;
        font-size: 3.5rem;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
      }

      .conversion-equals {
        font-size: 3rem;
        font-weight: 700;
        color: var(--color-text-secondary);
        line-height: 1;
      }

      .conversion-unit {
        font-size: 1.6rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        margin-left: 0.15rem;
        line-height: 1;
      }

      .conversion-answer {
        display: inline-flex;
        align-items: baseline;
        gap: 0.2rem;
        min-width: 130px;
        min-height: 80px;
        border: 3px solid #667eea;
        border-radius: 20px;
        background: white;
        padding: 0.5rem 1.25rem;
        justify-content: center;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.2),
          0 2px 8px rgba(0, 0, 0, 0.07);
      }

      .answer-digits {
        font-size: 3.5rem;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
      }

      /* ---- Hint ---- */
      .hint-box {
        text-align: center;
        padding: 0.75rem 1.5rem;
        background: #fffbeb;
        border: 1.5px solid #fde68a;
        border-radius: 16px;
        font-size: 1.1rem;
        font-weight: 600;
        color: #92400e;
        max-width: 320px;
        margin: 0 auto;
      }
    `,
  ],
})
export class MeasurementComponent {
  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(MeasurementOptionsStorageService);

  options = signal<MeasurementOptions>(this.storageService.loadOptions());
  exercise = signal<MeasurementExercise>(generateExercise(this.storageService.loadOptions()));

  answerStr = signal<string>('');
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  categoryEmoji = computed(() => CATEGORY_EMOJIS[this.exercise().category] ?? '📐');

  categoryLabel = computed(() => CATEGORY_LABELS[this.exercise().category] ?? '');

  feedbackMessage = computed(() => {
    const ex = this.exercise();
    if (this.feedbackType() === 'success') {
      return this.feedbackService.getMessage('success');
    }
    if (this.feedbackType() === 'show-answer') {
      return `La risposta corretta è ${ex.correctAnswer} ${ex.toUnit}. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
  }

  onNumberPressed(num: number): void {
    if (this.answerStr().length < 5) {
      this.answerStr.update((s) => s + num);
    }
  }

  onBackspacePressed(): void {
    this.answerStr.update((s) => s.slice(0, -1));
  }

  onClearPressed(): void {
    this.answerStr.set('');
  }

  verify(): void {
    const answer = parseInt(this.answerStr(), 10);
    const correct = this.exercise().correctAnswer;
    this.attemptCount.update((c) => c + 1);
    if (answer === correct) {
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
    this.answerStr.set('');
  }

  nextExercise(): void {
    this.exercise.set(generateExercise(this.options()));
    this.answerStr.set('');
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  setCategory(category: MeasurementCategory): void {
    this.options.update((o) => ({ ...o, category }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setDirection(direction: MeasurementDirection): void {
    this.options.update((o) => ({ ...o, direction }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setLevel(level: MeasurementLevel): void {
    this.options.update((o) => ({ ...o, level }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }
}
