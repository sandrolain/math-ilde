import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
  viewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';
import { OptionsControlComponent } from '../../components/options-control/options-control.component';
import { VisualRepresentationComponent } from '../../components/visual-representation/visual-representation.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { NumericKeyboardComponent } from '../../components/numeric-keyboard/numeric-keyboard.component';
import { MathExerciseService } from '../../services/math-exercise.service';
import { OptionsStorageService } from '../../services/options-storage.service';
import { FeedbackService } from '../../services/feedback.service';
import type { MathOperation, FeedbackType, ExerciseOptions } from '../../types/exercise.types';

@Component({
  selector: 'app-decomposition',
  imports: [
    FormsModule,
    HeaderComponent,
    OptionsControlComponent,
    VisualRepresentationComponent,
    FeedbackComponent,
    NumericKeyboardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-app">
      <app-header [title]="'Scomposizione della Somma'" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <app-options-control
              [section]="'decomposition'"
              [operationType]="exerciseOptions().operationType"
              [level]="exerciseOptions().level"
              [numberOfOperands]="exerciseOptions().numberOfOperands"
              [visualsEnabled]="exerciseOptions().showVisuals"
              (optionsChanged)="onOptionsChanged($event)"
            />
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Operazione matematica -->
              <div class="text-center">
                <div class="mb-8">
                  <button
                    (click)="nextExercise()"
                    class="btn btn-secondary btn-sm"
                    aria-label="Cambia esercizio"
                  >
                    ➜ Cambia esercizio
                  </button>
                </div>
                <div class="operation-display">
                  <div class="flex items-center justify-center gap-4">
                    <span class="text-6xl">?</span>
                    <span class="text-6xl">+</span>
                    <span class="text-6xl">?</span>
                    <span class="text-6xl">=</span>
                    <span class="text-6xl font-bold">{{ currentOperation().result }}</span>
                  </div>
                </div>
              </div>

              <!-- Rappresentazione visuale -->
              @if (exerciseOptions().showVisuals) {
                <div class="my-8">
                  <app-visual-representation
                    [operation]="currentOperation()"
                    [displayMode]="'total'"
                  />
                </div>
              }

              <!-- Pseudo-input e verifica -->
              <div class="max-w-md mx-auto space-y-6">
                <div class="flex items-center justify-center gap-4">
                  <div class="flex-1">
                    <label for="addend1-display" class="field-label text-center block">
                      Primo addendo
                    </label>
                    <div
                      id="addend1-display"
                      class="pseudo-input"
                      [class.active]="activeInput() === 1"
                      [class.error]="showFeedback() && !isCorrect() && attemptCount() > 0"
                      (click)="focusAddend1()"
                      role="textbox"
                      [attr.aria-label]="'Primo addendo: ' + (addend1Str() || 'vuoto')"
                      tabindex="0"
                    >
                      <span class="pseudo-input-text">{{ addend1Str() || '?' }}</span>
                      @if (activeInput() === 1) {
                        <span class="cursor-blink"></span>
                      }
                    </div>
                  </div>
                  <div class="text-4xl pt-6">+</div>
                  <div class="flex-1">
                    <label for="addend2-display" class="field-label text-center block">
                      Secondo addendo
                    </label>
                    <div
                      id="addend2-display"
                      class="pseudo-input"
                      [class.active]="activeInput() === 2"
                      [class.error]="showFeedback() && !isCorrect() && attemptCount() > 0"
                      (click)="focusAddend2()"
                      role="textbox"
                      [attr.aria-label]="'Secondo addendo: ' + (addend2Str() || 'vuoto')"
                      tabindex="0"
                    >
                      <span class="pseudo-input-text">{{ addend2Str() || '?' }}</span>
                      @if (activeInput() === 2) {
                        <span class="cursor-blink"></span>
                      }
                    </div>
                  </div>
                </div>

                <!-- Tastiera numerica -->
                @if (activeInput() > 0) {
                  <app-numeric-keyboard
                    (numberPressed)="onNumberPressed($event)"
                    (backspacePressed)="onBackspacePressed()"
                    (clearPressed)="onClearPressed()"
                  />
                }

                <button
                  (click)="verifyAnswer()"
                  class="btn btn-primary w-full"
                  aria-label="Verifica la tua risposta"
                >
                  Verifica la risposta
                </button>
              </div>

              <!-- Feedback -->
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
      :host {
        display: block;
      }

      .pseudo-input {
        width: 100%;
        padding: 1rem 1.25rem;
        font-size: 1.75rem;
        font-weight: 700;
        text-align: center;
        border: 3px solid var(--color-primary);
        border-radius: 16px;
        background: white;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
      }

      .pseudo-input:hover {
        border-color: #8ec5d6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(168, 216, 234, 0.3);
      }

      .pseudo-input.active {
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
      }

      .pseudo-input.error {
        border-color: #ef4444;
        background: #fee;
      }

      .pseudo-input-text {
        color: var(--color-text-primary);
      }

      .cursor-blink {
        display: inline-block;
        width: 3px;
        height: 1.75rem;
        background: var(--color-text-primary);
        margin-left: 0.25rem;
        animation: blink 1s infinite;
      }

      @keyframes blink {
        0%,
        49% {
          opacity: 1;
        }
        50%,
        100% {
          opacity: 0;
        }
      }

      @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
        :host ::ng-deep app-visual-representation .shape-element img {
          width: 60px !important;
          height: 60px !important;
        }
      }
    `,
  ],
})
export class DecompositionComponent {
  private mathService = inject(MathExerciseService);
  private storageService = inject(OptionsStorageService);
  private feedbackService = inject(FeedbackService);

  exerciseOptions = signal<ExerciseOptions>(
    this.storageService.loadOptionsForSection('decomposition'),
  );

  currentOperation = signal<MathOperation>(this.generateNewOperation());
  addend1Str = signal('');
  addend2Str = signal('');
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  activeInput = signal<number>(1); // 1 o 2 per tracciare quale input è attivo, 0 per nessuno

  addend1Input = viewChild<ElementRef<HTMLInputElement>>('addend1Input');
  addend2Input = viewChild<ElementRef<HTMLInputElement>>('addend2Input');

  isCorrect = computed(() => {
    const a1 = Number(this.addend1Str());
    const a2 = Number(this.addend2Str());

    console.log('Verifying answer:', { a1, a2, expected: this.currentOperation().result });

    // Verifica che i numeri siano validi
    if (isNaN(a1) || isNaN(a2)) return false;

    // Verifica che siano non negativi
    if (a1 < 0 || a2 < 0) return false;

    // Verifica che la somma corrisponda al risultato
    const sum = a1 + a2;
    return sum === this.currentOperation().result;
  });

  shouldShowAnswer = computed(() => this.attemptCount() >= 3 && !this.isCorrect());

  feedbackMessage = computed(() => {
    if (this.isCorrect()) {
      return this.feedbackService.getMessage('success');
    } else if (this.shouldShowAnswer()) {
      const op = this.currentOperation();
      return `La risposta è ${op.operand1} + ${op.operand2} = ${op.result}. Proviamo con un altro esercizio!`;
    } else {
      return this.feedbackService.getMessage('retry');
    }
  });

  constructor() {
    effect(() => {
      this.storageService.saveOptions(this.exerciseOptions());
    });
  }

  focusAddend1(): void {
    this.activeInput.set(1);
  }

  focusAddend2(): void {
    this.activeInput.set(2);
  }

  onNumberPressed(num: number): void {
    const active = this.activeInput();
    if (active === 1) {
      const current = this.addend1Str();
      if (current.length < 6) {
        this.addend1Str.set(current + num);
      }
    } else if (active === 2) {
      const current = this.addend2Str();
      if (current.length < 6) {
        this.addend2Str.set(current + num);
      }
    }
  }

  onBackspacePressed(): void {
    const active = this.activeInput();
    if (active === 1) {
      const current = this.addend1Str();
      if (current.length > 0) {
        this.addend1Str.set(current.slice(0, -1));
      }
    } else if (active === 2) {
      const current = this.addend2Str();
      if (current.length > 0) {
        this.addend2Str.set(current.slice(0, -1));
      }
    }
  }

  onClearPressed(): void {
    const active = this.activeInput();
    if (active === 1) {
      this.addend1Str.set('');
    } else if (active === 2) {
      this.addend2Str.set('');
    }
  }

  onOptionsChanged(newOptions: Partial<ExerciseOptions>): void {
    this.exerciseOptions.update((current) => ({
      ...current,
      ...newOptions,
    }));
    this.resetExercise();
  }

  generateNewOperation(): MathOperation {
    const options = this.exerciseOptions();
    return this.mathService.generateOperation('decomposition', options.level, 2);
  }

  verifyAnswer(): void {
    // Verifica che entrambi gli input abbiano un valore (incluso 0)
    if (this.addend1Str() === '' || this.addend2Str() === '') {
      return;
    }

    this.attemptCount.update((count) => count + 1);

    if (this.isCorrect()) {
      this.feedbackType.set('success');
      this.showFeedback.set(true);
    } else if (this.shouldShowAnswer()) {
      this.feedbackType.set('show-answer');
      this.showFeedback.set(true);
    } else {
      this.feedbackType.set('retry');
      this.showFeedback.set(true);
    }
  }

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.addend1Str.set('');
    this.addend2Str.set('');
    this.activeInput.set(1);
  }

  nextExercise(): void {
    this.resetExercise();
    this.activeInput.set(1);
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.addend1Str.set('');
    this.addend2Str.set('');
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
    this.activeInput.set(1);
  }

  getInputClasses(inputNumber: number): string {
    if (this.showFeedback() && !this.isCorrect() && this.attemptCount() > 0) {
      return 'field error';
    }
    return 'field';
  }
}
