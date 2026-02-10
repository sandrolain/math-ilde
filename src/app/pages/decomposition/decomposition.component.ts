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
  selector: 'app-decomposition',
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

              <!-- Input e verifica -->
              <div class="max-w-md mx-auto space-y-6">
                <div class="flex items-center justify-center gap-4">
                  <div class="flex-1">
                    <label for="addend1-input" class="field-label text-center block">
                      Primo addendo
                    </label>
                    <input
                      #addend1Input
                      id="addend1-input"
                      type="number"
                      inputmode="numeric"
                      [ngModel]="addend1Str()"
                      (ngModelChange)="addend1Str.set($event)"
                      (keyup.enter)="focusAddend2()"
                      [class]="getInputClasses(1)"
                      placeholder="?"
                      aria-label="Inserisci il primo addendo"
                    />
                  </div>
                  <div class="text-4xl pt-6">+</div>
                  <div class="flex-1">
                    <label for="addend2-input" class="field-label text-center block">
                      Secondo addendo
                    </label>
                    <input
                      #addend2Input
                      id="addend2-input"
                      type="number"
                      inputmode="numeric"
                      [ngModel]="addend2Str()"
                      (ngModelChange)="addend2Str.set($event)"
                      (keyup.enter)="verifyAnswer()"
                      [class]="getInputClasses(2)"
                      placeholder="?"
                      aria-label="Inserisci il secondo addendo"
                    />
                  </div>
                </div>

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

    // Focus auto sulla pagina iniziale
    effect(() => {
      setTimeout(() => {
        this.addend1Input()?.nativeElement.focus();
      }, 0);
    });
  }

  focusAddend2(): void {
    this.addend2Input()?.nativeElement.focus();
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
    setTimeout(() => {
      this.addend1Input()?.nativeElement.focus();
    }, 0);
  }

  nextExercise(): void {
    this.resetExercise();
    setTimeout(() => {
      this.addend1Input()?.nativeElement.focus();
    }, 0);
  }

  private resetExercise(): void {
    this.currentOperation.set(this.generateNewOperation());
    this.addend1Str.set('');
    this.addend2Str.set('');
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  getInputClasses(inputNumber: number): string {
    if (this.showFeedback() && !this.isCorrect() && this.attemptCount() > 0) {
      return 'field error';
    }
    return 'field';
  }
}
