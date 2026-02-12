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
  selector: 'app-division',
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
      <app-header [title]="'Divisioni'" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <app-options-control
              [section]="'division'"
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
                  {{ formatOperation() }}
                </div>
              </div>

              <!-- Rappresentazione visuale -->
              @if (exerciseOptions().showVisuals) {
                <div class="my-8">
                  <app-visual-representation [operation]="currentOperation()" />
                </div>
              }

              <!-- Pseudo-input e verifica -->

              <div class="max-w-md mx-auto space-y-6">
                <div>
                  <label for="answer-display" class="field-label"> Qual è il risultato? </label>
                  <div
                    id="answer-display"
                    class="pseudo-input"
                    [class.active]="inputFocused()"
                    [class.error]="showFeedback() && !isCorrect() && attemptCount() > 0"
                    (click)="focusInput()"
                    role="textbox"
                    [attr.aria-label]="'Risultato inserito: ' + (userAnswerStr() || 'vuoto')"
                    tabindex="0"
                  >
                    <span class="pseudo-input-text">{{ userAnswerStr() || '?' }}</span>
                    @if (inputFocused()) {
                      <span class="cursor-blink"></span>
                    }
                  </div>
                </div>

                <!-- Tastiera numerica -->
                @if (inputFocused()) {
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
        padding: 1.25rem 1.5rem;
        font-size: 2rem;
        font-weight: 700;
        text-align: center;
        border: 3px solid var(--color-primary);
        border-radius: 16px;
        background: white;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 80px;
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
        height: 2rem;
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
export class DivisionComponent {
  private mathService = inject(MathExerciseService);
  private storageService = inject(OptionsStorageService);
  private feedbackService = inject(FeedbackService);

  exerciseOptions = signal<ExerciseOptions>(this.storageService.loadOptionsForSection('division'));

  currentOperation = signal<MathOperation>(this.generateNewOperation());
  userAnswerStr = signal<string>('');
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  inputFocused = signal<boolean>(true);

  answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  isCorrect = computed(() => Number(this.userAnswerStr()) === this.currentOperation().result);
  shouldShowAnswer = computed(() => this.attemptCount() >= 3 && !this.isCorrect());

  feedbackMessage = computed(() => {
    if (this.isCorrect()) {
      return this.feedbackService.getMessage('success');
    } else if (this.shouldShowAnswer()) {
      return this.feedbackService.getMessage('show-answer', this.currentOperation().result);
    } else {
      return this.feedbackService.getMessage('retry');
    }
  });

  constructor() {
    effect(() => {
      this.storageService.saveOptions(this.exerciseOptions());
    });
  }

  focusInput(): void {
    this.inputFocused.set(true);
  }

  onNumberPressed(num: number): void {
    const current = this.userAnswerStr();
    if (current.length < 6) {
      this.userAnswerStr.set(current + num);
    }
  }

  onBackspacePressed(): void {
    const current = this.userAnswerStr();
    if (current.length > 0) {
      this.userAnswerStr.set(current.slice(0, -1));
    }
  }

  onClearPressed(): void {
    this.userAnswerStr.set('');
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
    return this.mathService.generateOperation('division', options.level, 2);
  }

  formatOperation(): string {
    return this.mathService.formatOperation(this.currentOperation());
  }

  verifyAnswer(): void {
    if (!this.userAnswerStr()) {
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
    this.userAnswerStr.set('');
    this.inputFocused.set(true);
  }

  nextExercise(): void {
    this.resetExercise();
    this.inputFocused.set(true);
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.userAnswerStr.set('');
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
    this.inputFocused.set(true);
  }

  getInputClasses(): string {
    if (this.showFeedback() && !this.isCorrect() && this.attemptCount() > 0) {
      return 'field error';
    }
    return 'field';
  }
}
