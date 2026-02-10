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
  selector: 'app-division',
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
              (optionsChanged)="onOptionsChanged($event)"
            />
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Operazione matematica -->
              <div class="text-center">
                <div class="operation-display">
                  {{ formatOperation() }}
                </div>
              </div>

              <!-- Rappresentazione visuale -->
              <div class="my-8">
                <app-visual-representation [operation]="currentOperation()" />
              </div>

              <!-- Input e verifica -->
              @if (!showFeedback()) {
                <div class="max-w-md mx-auto space-y-6">
                  <div>
                    <label for="answer-input" class="field-label"> Qual è il risultato? </label>
                    <input
                      #answerInput
                      id="answer-input"
                      type="number"
                      [(ngModel)]="userAnswer"
                      (keyup.enter)="verifyAnswer()"
                      [class]="getInputClasses()"
                      placeholder="?"
                      aria-label="Inserisci il risultato dell'operazione"
                      autofocus
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
                (continue)="nextExercise()"
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
export class DivisionComponent {
  private mathService = inject(MathExerciseService);
  private storageService = inject(OptionsStorageService);
  private feedbackService = inject(FeedbackService);

  exerciseOptions = signal<ExerciseOptions>(this.storageService.loadOptionsForSection('division'));

  currentOperation = signal<MathOperation>(this.generateNewOperation());
  userAnswer = signal<number | null>(null);
  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');

  answerInput = viewChild<ElementRef<HTMLInputElement>>('answerInput');

  isCorrect = computed(() => this.userAnswer() === this.currentOperation().result);
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
    if (this.userAnswer() === null || this.userAnswer() === undefined) {
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

      setTimeout(() => {
        this.showFeedback.set(false);
        this.userAnswer.set(null);
        setTimeout(() => {
          this.answerInput()?.nativeElement.focus();
        }, 100);
      }, 2000);
    }
  }

  nextExercise(): void {
    this.resetExercise();
    setTimeout(() => {
      this.answerInput()?.nativeElement.focus();
    }, 100);
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.userAnswer.set(null);
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
