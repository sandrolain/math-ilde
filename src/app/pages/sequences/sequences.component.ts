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
import { SidebarOptionsComponent } from '../../components/sidebar-options/sidebar-options.component';
import { FeedbackService } from '../../services/feedback.service';
import { SequenceOptionsStorageService } from '../../services/sequence-options-storage.service';
import type {
  FeedbackType,
  SequenceOptions,
  SequenceStepType,
  SequenceLevel,
  SequenceExercise,
  SequenceElement,
} from '../../types/exercise.types';

const BUBBLE_COLORS = ['#a8d8ea', '#ffb6c1', '#b4e7ce', '#f0e68c', '#c8b4e7'];
const SEQUENCE_LENGTH = 5;

@Component({
  selector: 'app-sequences',
  imports: [HeaderComponent, FeedbackComponent, NumericKeyboardComponent, SidebarOptionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Sequenze Numeriche" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <app-sidebar-options [(open)]="mobileMenuOpen">
            <!-- Tipo di sequenza -->
            <div class="space-y-2">
              <span class="section-label">Tipo di sequenza:</span>
              <div class="space-y-2">
                <label class="option-item">
                  <input
                    type="radio"
                    name="stepType"
                    value="ascending"
                    class="option-input"
                    [checked]="options().stepType === 'ascending'"
                    (change)="setStepType('ascending')"
                  />
                  <span class="option-label">📈 Crescente</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="stepType"
                    value="descending"
                    class="option-input"
                    [checked]="options().stepType === 'descending'"
                    (change)="setStepType('descending')"
                  />
                  <span class="option-label">📉 Decrescente</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="stepType"
                    value="multiples"
                    class="option-input"
                    [checked]="options().stepType === 'multiples'"
                    (change)="setStepType('multiples')"
                  />
                  <span class="option-label">✖️ Multipli / Tabelline</span>
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
                  <span class="option-label">🟢 Facile (passo 1–2)</span>
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
                  <span class="option-label">🟡 Medio (passo 2–10)</span>
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
                  <span class="option-label">🔴 Difficile (passo 10–50)</span>
                </label>
              </div>
            </div>

            <!-- Numeri mancanti -->
            <div class="space-y-2">
              <span class="section-label">Numeri mancanti:</span>
              <div class="space-y-2">
                <label class="option-item">
                  <input
                    type="radio"
                    name="numHoles"
                    value="1"
                    class="option-input"
                    [checked]="options().numHoles === 1"
                    (change)="setNumHoles(1)"
                  />
                  <span class="option-label">1 numero mancante</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="numHoles"
                    value="2"
                    class="option-input"
                    [checked]="options().numHoles === 2"
                    (change)="setNumHoles(2)"
                  />
                  <span class="option-label">2 numeri mancanti</span>
                </label>
              </div>
            </div>
          </app-sidebar-options>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Cambio esercizio -->
              <div class="text-center mb-8">
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Genera un nuovo esercizio"
                >
                  ➜ Cambia esercizio
                </button>
              </div>

              <!-- Istruzioni -->
              <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                Trova i numeri mancanti nella sequenza:
              </p>

              <!-- Sequenza numerica -->
              <div
                class="sequence-container"
                role="group"
                aria-label="Sequenza numerica con numeri mancanti"
              >
                @for (el of exercise().elements; track el.index; let last = $last) {
                  @if (!el.isHole) {
                    <div
                      class="seq-bubble"
                      [style.background]="getBubbleColor(el.index)"
                      [attr.aria-label]="'Numero ' + el.value"
                    >
                      {{ el.value }}
                    </div>
                  } @else {
                    <button
                      class="seq-bubble seq-hole"
                      [class.seq-hole--active]="activeHole() === el.index"
                      [class.seq-hole--filled]="holeValue(el.index).length > 0"
                      (click)="activateHole(el.index)"
                      [attr.aria-label]="
                        'Numero mancante. ' +
                        (holeValue(el.index).length > 0
                          ? 'Risposta inserita: ' + holeValue(el.index)
                          : 'Clicca per inserire il numero')
                      "
                    >
                      {{ holeValue(el.index) || '?' }}
                    </button>
                  }
                  @if (!last) {
                    <span class="seq-arrow" aria-hidden="true">→</span>
                  }
                }
              </div>

              <!-- Tastiera numerica (visibile quando un buco è attivo) -->
              @if (activeHole() !== null) {
                <div class="max-w-md mx-auto mt-8 space-y-4">
                  <p class="field-label">Inserisci il numero mancante:</p>
                  <div
                    class="pseudo-input active"
                    role="textbox"
                    [attr.aria-label]="'Numero inserito: ' + (currentInput() || 'vuoto')"
                    aria-live="polite"
                  >
                    <span class="pseudo-input-text">{{ currentInput() || '?' }}</span>
                    <span class="cursor-blink" aria-hidden="true"></span>
                  </div>
                  <app-numeric-keyboard
                    (numberPressed)="onNumberPressed($event)"
                    (backspacePressed)="onBackspacePressed()"
                    (clearPressed)="onClearPressed()"
                  />
                </div>
              }

              <!-- Pulsante verifica -->
              <div class="mt-6 max-w-md mx-auto">
                <button
                  (click)="verifyAnswers()"
                  class="btn btn-primary w-full"
                  [disabled]="!allHolesFilled()"
                  aria-label="Verifica le tue risposte"
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
      .sequence-container {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-wrap: wrap;
        gap: 0.5rem;
        padding: 1.5rem 0;
      }

      .seq-arrow {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--color-text-secondary);
        flex-shrink: 0;
        line-height: 1;
      }

      .seq-bubble {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--color-text-primary);
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
        flex-shrink: 0;
        transition:
          transform 0.15s ease,
          box-shadow 0.15s ease;
      }

      .seq-hole {
        background: white !important;
        border: 3px dashed var(--color-primary);
        cursor: pointer;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      @media (hover: hover) {
        .seq-hole:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.16);
        }
      }

      .seq-hole--active {
        border-color: #667eea;
        border-style: solid;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.3),
          0 4px 10px rgba(0, 0, 0, 0.12);
        transform: scale(1.12);
      }

      .seq-hole--filled {
        border-style: solid;
        border-color: var(--color-primary);
        color: var(--color-text-primary);
      }

      @media (max-width: 480px) {
        .seq-bubble {
          width: 56px;
          height: 56px;
          font-size: 1.1rem;
        }

        .seq-arrow {
          font-size: 1.1rem;
        }
      }
    `,
  ],
})
export class SequencesComponent {
  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(SequenceOptionsStorageService);

  options = signal<SequenceOptions>(this.storageService.loadOptions());
  exercise = signal<SequenceExercise>(this.buildExercise());

  activeHole = signal<number | null>(null);
  holeAnswers = signal<Record<number, string>>({});
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  allHolesFilled = computed(() => {
    const answers = this.holeAnswers();
    return this.exercise().holeIndices.every((i) => (answers[i] ?? '').length > 0);
  });

  isAllCorrect = computed(() =>
    this.exercise()
      .elements.filter((e) => e.isHole)
      .every((e) => parseInt(this.holeAnswers()[e.index] ?? '', 10) === e.value),
  );

  currentInput = computed(() => {
    const active = this.activeHole();
    return active !== null ? (this.holeAnswers()[active] ?? '') : '';
  });

  feedbackMessage = computed(() => {
    if (this.isAllCorrect()) {
      return this.feedbackService.getMessage('success');
    }
    if (this.attemptCount() >= 3) {
      const answers = this.exercise()
        .elements.filter((e) => e.isHole)
        .map((e) => e.value)
        .join(', ');
      return `Le risposte corrette sono: ${answers}. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
  }

  holeValue(index: number): string {
    return this.holeAnswers()[index] ?? '';
  }

  getBubbleColor(index: number): string {
    return BUBBLE_COLORS[index % BUBBLE_COLORS.length];
  }

  activateHole(index: number): void {
    this.activeHole.set(index);
  }

  onNumberPressed(num: number): void {
    const active = this.activeHole();
    if (active === null) return;
    const current = this.holeAnswers()[active] ?? '';
    if (current.length < 5) {
      this.holeAnswers.update((a) => ({ ...a, [active]: current + num }));
    }
  }

  onBackspacePressed(): void {
    const active = this.activeHole();
    if (active === null) return;
    const current = this.holeAnswers()[active] ?? '';
    this.holeAnswers.update((a) => ({ ...a, [active]: current.slice(0, -1) }));
  }

  onClearPressed(): void {
    const active = this.activeHole();
    if (active === null) return;
    this.holeAnswers.update((a) => ({ ...a, [active]: '' }));
  }

  verifyAnswers(): void {
    if (!this.allHolesFilled()) return;
    this.attemptCount.update((c) => c + 1);
    const correct = this.isAllCorrect();
    const showAnswer = !correct && this.attemptCount() >= 3;
    this.feedbackType.set(correct ? 'success' : showAnswer ? 'show-answer' : 'retry');
    this.showFeedback.set(true);
  }

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.holeAnswers.set({});
    this.activeHole.set(null);
  }

  nextExercise(): void {
    this.exercise.set(this.buildExercise());
    this.holeAnswers.set({});
    this.activeHole.set(null);
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  setStepType(type: SequenceStepType): void {
    this.options.update((o) => ({ ...o, stepType: type }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setLevel(level: SequenceLevel): void {
    this.options.update((o) => ({ ...o, level }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setNumHoles(n: 1 | 2): void {
    this.options.update((o) => ({ ...o, numHoles: n }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  private buildExercise(): SequenceExercise {
    return this.generateSequence(this.options());
  }

  private generateSequence(options: SequenceOptions): SequenceExercise {
    let step: number;
    let values: number[];

    if (options.stepType === 'multiples') {
      const ranges: Record<SequenceLevel, [number, number]> = {
        easy: [2, 3],
        medium: [4, 9],
        hard: [11, 20],
      };
      const [min, max] = ranges[options.level];
      step = this.rnd(min, max);
      const startFactor = this.rnd(1, 5);
      values = Array.from({ length: SEQUENCE_LENGTH }, (_, i) => step * (startFactor + i));
    } else if (options.stepType === 'ascending') {
      const stepRanges: Record<SequenceLevel, [number, number]> = {
        easy: [1, 2],
        medium: [2, 10],
        hard: [10, 50],
      };
      const startRanges: Record<SequenceLevel, [number, number]> = {
        easy: [0, 10],
        medium: [0, 50],
        hard: [0, 200],
      };
      const [sMin, sMax] = stepRanges[options.level];
      step = this.rnd(sMin, sMax);
      const start = this.rnd(startRanges[options.level][0], startRanges[options.level][1]);
      values = Array.from({ length: SEQUENCE_LENGTH }, (_, i) => start + step * i);
    } else {
      // descending: ensure all values ≥ 0
      const stepRanges: Record<SequenceLevel, [number, number]> = {
        easy: [1, 2],
        medium: [2, 10],
        hard: [10, 50],
      };
      const extraRanges: Record<SequenceLevel, number> = {
        easy: 10,
        medium: 50,
        hard: 200,
      };
      const [sMin, sMax] = stepRanges[options.level];
      step = this.rnd(sMin, sMax);
      const start = step * (SEQUENCE_LENGTH - 1) + this.rnd(0, extraRanges[options.level]);
      values = Array.from({ length: SEQUENCE_LENGTH }, (_, i) => start - step * i);
    }

    const holeIndices = this.pickHoles(SEQUENCE_LENGTH, options.numHoles);
    return {
      elements: values.map((value, index) => ({
        value,
        isHole: holeIndices.includes(index),
        index,
      })),
      step,
      stepType: options.stepType,
      holeIndices,
    };
  }

  private pickHoles(length: number, numHoles: number): number[] {
    if (numHoles === 1) {
      // Sceglie sempre una posizione centrale (non prima né ultima)
      const mids = Array.from({ length: length - 2 }, (_, i) => i + 1);
      return [mids[this.rnd(0, mids.length - 1)]];
    }
    // 2 buchi: preferibilmente non adiacenti
    const shuffled = Array.from({ length }, (_, i) => i).sort(() => Math.random() - 0.5);
    const chosen: number[] = [];
    for (const pos of shuffled) {
      if (chosen.every((c) => Math.abs(c - pos) >= 2)) {
        chosen.push(pos);
      }
      if (chosen.length === numHoles) break;
    }
    // Fallback se non si trovano posizioni non adiacenti
    if (chosen.length < numHoles) {
      for (const pos of shuffled) {
        if (!chosen.includes(pos)) {
          chosen.push(pos);
          if (chosen.length === numHoles) break;
        }
      }
    }
    return chosen.sort((a, b) => a - b);
  }

  private rnd(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
