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
import { SessionSummaryComponent } from '../../components/session-summary/session-summary.component';
import { MathExerciseService } from '../../services/math-exercise.service';
import { OptionsStorageService } from '../../services/options-storage.service';
import { FeedbackService } from '../../services/feedback.service';
import { HintService } from '../../services/hint.service';
import { ExerciseSessionService } from '../../services/exercise-session.service';
import type {
  MathOperation,
  OperationType,
  DifficultyLevel,
  NumberOfOperands,
  FeedbackType,
  ExerciseOptions,
} from '../../types/exercise.types';
import type { ExerciseSession } from '../../types/learning.types';

@Component({
  selector: 'app-addition-subtraction',
  imports: [
    FormsModule,
    HeaderComponent,
    OptionsControlComponent,
    VisualRepresentationComponent,
    FeedbackComponent,
    NumericKeyboardComponent,
    SessionSummaryComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-app">
      <app-header [title]="'Addizioni e Sottrazioni'" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <app-options-control
              [section]="'addition-subtraction'"
              [operationType]="exerciseOptions().operationType"
              [level]="exerciseOptions().level"
              [numberOfOperands]="exerciseOptions().numberOfOperands"
              [visualsEnabled]="exerciseOptions().showVisuals"
              (optionsChanged)="onOptionsChanged($event)"
            />
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area" aria-label="Esercizio di matematica">
            @if (sessionSummary(); as summary) {
              <div class="card">
                <app-session-summary [session]="summary" (restart)="startNewSession()" />
              </div>
            }

            <div class="card" [class.hidden]="sessionSummary() !== null">
              <div class="mb-8 flex items-center gap-4">
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex items-center justify-between gap-3">
                    <span class="text-sm font-bold text-[var(--color-text-secondary)]">
                      Esercizio {{ exerciseNumber() }} di {{ totalExercises }}
                    </span>
                    <span class="text-sm font-bold text-[var(--color-primary-strong)]">
                      {{ progressPercent() }}%
                    </span>
                  </div>
                  <div
                    class="h-3 w-full overflow-hidden rounded-full bg-slate-200"
                    role="progressbar"
                    aria-label="Progresso esercizi"
                    aria-valuemin="1"
                    [attr.aria-valuemax]="totalExercises"
                    [attr.aria-valuenow]="exerciseNumber()"
                  >
                    <div
                      class="h-full rounded-full bg-[var(--color-primary-strong)] transition-[width] duration-300"
                      [style.width.%]="progressPercent()"
                    ></div>
                  </div>
                </div>
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm shrink-0"
                  aria-label="Cambia esercizio"
                >
                  Cambia
                </button>
              </div>

              <!-- Operazione matematica -->
              <div class="text-center">
                <div class="operation-display">
                  {{ formatOperation() }}
                </div>
              </div>

              <!-- Rappresentazione visuale -->
              @if (exerciseOptions().showVisuals) {
                <div class="my-8">
                  <app-visual-representation
                    [operation]="currentOperation()"
                    [revealAnswer]="false"
                  />
                </div>
              }

              <!-- Risposta e verifica -->

              <div class="max-w-md mx-auto space-y-6">
                <div>
                  <label for="answer-input" class="field-label">Qual è il risultato?</label>
                  <input
                    #answerInput
                    id="answer-input"
                    type="number"
                    inputmode="numeric"
                    autocomplete="off"
                    class="field"
                    [class.active]="inputFocused()"
                    [class.error]="showFeedback() && !isCorrect() && attemptCount() > 0"
                    [value]="userAnswerStr()"
                    (input)="onAnswerInput($event)"
                    aria-describedby="answer-help"
                    aria-label="Risultato dell'operazione"
                  />
                  <span id="answer-help" class="sr-only">
                    Inserisci il risultato usando la tastiera numerica o i tasti del dispositivo.
                  </span>
                </div>

                <!-- Tastiera numerica -->
                <app-numeric-keyboard
                  (numberPressed)="onNumberPressed($event)"
                  (backspacePressed)="onBackspacePressed()"
                  (clearPressed)="onClearPressed()"
                />

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
                [hint]="feedbackType() !== 'success' ? learningHint() : ''"
                [achievement]="feedbackType() === 'success' ? achievementMessage() : ''"
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

      /* Tablet portrait - riduci immagini */
      @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
        :host ::ng-deep app-visual-representation .shape-element img {
          width: 60px !important;
          height: 60px !important;
        }
      }
    `,
  ],
})
export class AdditionSubtractionComponent {
  private mathService = inject(MathExerciseService);
  private storageService = inject(OptionsStorageService);
  private feedbackService = inject(FeedbackService);
  private hintService = inject(HintService);
  private sessionService = inject(ExerciseSessionService);

  // Stato
  exerciseOptions = signal<ExerciseOptions>(
    this.storageService.loadOptionsForSection('addition-subtraction'),
  );

  currentOperation = signal<MathOperation>(this.generateNewOperation());
  userAnswerStr = signal<string>('');
  attemptCount = signal<number>(0);
  exerciseNumber = signal(1);
  correctAnswers = signal(0);
  readonly totalExercises = 10;
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  inputFocused = signal<boolean>(true);
  sessionSummary = signal<ExerciseSession | null>(null);

  answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');
  private exerciseId = signal(this.createExerciseId());

  // Computed
  progressPercent = computed(() => (this.exerciseNumber() / this.totalExercises) * 100);

  isCorrect = computed(() => {
    const userAnswer = Number(this.userAnswerStr());
    const correctAnswer = this.currentOperation().result;
    return userAnswer === correctAnswer;
  });

  shouldShowAnswer = computed(() => this.attemptCount() >= 3 && !this.isCorrect());

  feedbackMessage = computed(() => {
    if (!this.userAnswerStr()) {
      return 'Inserisci una risposta per verificare.';
    } else if (this.isCorrect()) {
      return this.feedbackService.getMessage('success');
    } else if (this.shouldShowAnswer()) {
      return 'Facciamo il primo passo insieme.';
    } else {
      return this.feedbackService.getMessage('retry');
    }
  });

  learningHint = computed(() => {
    return this.hintService.getHint(this.currentOperation(), this.attemptCount());
  });

  achievementMessage = computed(() =>
    this.correctAnswers() > 0 ? `Risposte corrette: ${this.correctAnswers()}` : '',
  );

  constructor() {
    const activeSession = this.sessionService.currentSession();
    if (!activeSession || activeSession.skillId !== 'addition-subtraction') {
      this.sessionService.startSession('addition-subtraction', this.totalExercises);
    }

    // Effetto per salvare le opzioni quando cambiano
    effect(() => {
      this.storageService.saveOptions(this.exerciseOptions());
    });
  }

  focusInput(): void {
    this.inputFocused.set(true);
    this.answerInput()?.nativeElement.focus();
  }

  onAnswerInput(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.userAnswerStr.set(input.value);
    }
  }

  onNumberPressed(num: number): void {
    const current = this.userAnswerStr();
    // Limita a 6 cifre
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

    // Genera nuova operazione con le nuove opzioni
    this.exerciseNumber.set(1);
    this.correctAnswers.set(0);
    this.resetExercise();
  }

  generateNewOperation(): MathOperation {
    const options = this.exerciseOptions();
    return this.mathService.generateOperation(
      options.operationType,
      options.level,
      options.numberOfOperands,
    );
  }

  formatOperation(): string {
    return this.mathService.formatOperation(this.currentOperation());
  }

  verifyAnswer(): void {
    if (!this.userAnswerStr()) {
      this.feedbackType.set('retry');
      this.showFeedback.set(true);
      return;
    }

    this.attemptCount.update((count) => count + 1);
    this.recordAttempt();

    if (this.isCorrect()) {
      this.correctAnswers.update((count) => count + 1);
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
    this.focusInput();
  }

  nextExercise(): void {
    if (this.exerciseNumber() === this.totalExercises) {
      this.sessionSummary.set(this.sessionService.completeSession());
      this.showFeedback.set(false);
      return;
    }

    this.exerciseNumber.update((number) => (number === this.totalExercises ? 1 : number + 1));
    this.resetExercise();
    this.focusInput();
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.exerciseId.set(this.createExerciseId());
    this.userAnswerStr.set('');
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
    this.inputFocused.set(true);
  }

  startNewSession(): void {
    this.sessionSummary.set(null);
    this.exerciseNumber.set(1);
    this.correctAnswers.set(0);
    this.sessionService.startSession('addition-subtraction', this.totalExercises);
    this.resetExercise();
    this.focusInput();
  }

  private recordAttempt(): void {
    const session = this.sessionService.currentSession();
    if (!session) {
      return;
    }

    this.sessionService.recordAttempt({
      id: `${this.exerciseId()}-attempt-${this.attemptCount()}`,
      skillId: 'addition-subtraction',
      exerciseId: this.exerciseId(),
      answer: this.userAnswerStr(),
      correct: this.isCorrect(),
      hintsUsed: this.hintService.getLevel(this.attemptCount()),
      startedAt: Date.now(),
      completedAt: Date.now(),
    });
  }

  private createExerciseId(): string {
    return `addition-subtraction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  getInputClasses(): string {
    if (this.showFeedback() && !this.isCorrect() && this.attemptCount() > 0) {
      return 'field error';
    }
    return 'field';
  }
}
