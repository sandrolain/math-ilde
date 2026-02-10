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
import { MathExerciseService } from '../../services/math-exercise.service';
import { OptionsStorageService } from '../../services/options-storage.service';
import { FeedbackService } from '../../services/feedback.service';
import type { MathOperation, FeedbackType, ExerciseOptions } from '../../types/exercise.types';

@Component({
  selector: 'app-multiplication',
  imports: [
    FormsModule,
    HeaderComponent,
    OptionsControlComponent,
    VisualRepresentationComponent,
    FeedbackComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-app">
      <app-header [title]="'Moltiplicazioni'" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <app-options-control
              [section]="'multiplication'"
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

              <!-- Input e verifica -->
              @if (!showFeedback()) {
                <div class="max-w-md mx-auto space-y-6">
                  <div>
                    <label for="answer-input" class="field-label"> Qual è il risultato? </label>
                    <input
                      #answerInput
                      id="answer-input"
                      type="number"
                      inputmode="numeric"
                      [(ngModel)]="userAnswerStr"
                      (keyup.enter)="verifyAnswer()"
                      [class]="getInputClasses()"
                      placeholder="?"
                      aria-label="Inserisci il risultato dell'operazione"
                    />
                  </div>

                  <button
                    (click)="verifyAnswer()"
                    class="btn btn-primary w-full"
                    aria-label="Verifica la tua risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

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
    `,
  ],
})
export class MultiplicationComponent {
  private mathService = inject(MathExerciseService);
  private storageService = inject(OptionsStorageService);
  private feedbackService = inject(FeedbackService);

  exerciseOptions = signal<ExerciseOptions>(
    this.storageService.loadOptionsForSection('multiplication'),
  );

  currentOperation = signal<MathOperation>(this.generateNewOperation());
  userAnswerStr = '';
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');

  answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  isCorrect = computed(() => Number(this.userAnswerStr) === this.currentOperation().result);
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

    // Focus auto sulla pagina iniziale
    effect(() => {
      setTimeout(() => {
        this.answerInput()?.nativeElement.focus();
      }, 0);
    });
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
    return this.mathService.generateOperation('multiplication', options.level, 2);
  }

  formatOperation(): string {
    return this.mathService.formatOperation(this.currentOperation());
  }

  verifyAnswer(): void {
    if (!this.userAnswerStr) {
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
    this.userAnswerStr = '';
    setTimeout(() => {
      this.answerInput()?.nativeElement.focus();
    }, 0);
  }

  nextExercise(): void {
    this.resetExercise();
    setTimeout(() => {
      this.answerInput()?.nativeElement.focus();
    }, 0);
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.userAnswerStr = '';
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  getInputClasses(): string {
    if (this.showFeedback() && !this.isCorrect() && this.attemptCount() > 0) {
      return 'field error';
    }
    return 'field';
  }
}
