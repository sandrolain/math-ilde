import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { VisualRepresentationComponent } from '../../components/visual-representation/visual-representation.component';
import type { MathOperation } from '../../types/exercise.types';

interface IllustratedProblem {
  story: string;
  question: string;
  operation: MathOperation;
}

@Component({
  selector: 'app-problems',
  imports: [VisualRepresentationComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="problems-page">
      <a href="/" class="back-link">← Torna alla home</a>
      <h1>Risolvi il problema</h1>
      <p class="problems-page__intro">Leggi, osserva e scegli il calcolo che ti aiuta.</p>

      <section class="problem-panel" aria-labelledby="problem-title">
        <h2 id="problem-title">{{ problem().story }}</h2>
        <app-visual-representation [operation]="problem().operation" />
        <p class="problem-panel__question">{{ problem().question }}</p>

        <label for="problem-answer">La tua risposta</label>
        <input
          id="problem-answer"
          type="number"
          inputmode="numeric"
          [value]="answer()"
          (input)="onAnswerInput($event)"
          [attr.aria-describedby]="feedback() ? 'problem-feedback' : null"
        />
        <button type="button" class="btn btn-primary" (click)="checkAnswer()">
          Verifica
        </button>

        @if (feedback()) {
          <p id="problem-feedback" class="problem-panel__feedback" role="status">
            {{ feedback() }}
          </p>
        }

        <button type="button" class="btn btn-secondary" (click)="nextProblem()">
          Prossimo problema
        </button>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .problems-page {
        width: min(100% - 2rem, 60rem);
        margin: 0 auto;
        padding: 2rem 0 4rem;
      }

      .back-link {
        color: var(--color-primary-strong);
        font-weight: 700;
      }

      h1 {
        margin: 1rem 0 0.5rem;
        color: var(--color-text-primary);
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 800;
        text-align: center;
      }

      .problems-page__intro {
        margin: 0 0 2rem;
        color: var(--color-text-secondary);
        font-size: 1.15rem;
        text-align: center;
      }

      .problem-panel {
        display: grid;
        justify-items: center;
        gap: 1rem;
        padding: 1.5rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }

      h2 {
        max-width: 42rem;
        margin: 0;
        color: var(--color-text-primary);
        font-size: clamp(1.25rem, 4vw, 1.75rem);
        line-height: 1.4;
        text-align: center;
      }

      .problem-panel__question {
        margin: 0;
        color: var(--color-text-primary);
        font-size: 1.2rem;
        font-weight: 700;
      }

      label {
        color: var(--color-text-primary);
        font-weight: 700;
      }

      input {
        width: min(100%, 12rem);
        min-height: 3rem;
        border: 2px solid var(--color-primary-strong);
        border-radius: 0.75rem;
        padding: 0.5rem 0.75rem;
        color: var(--color-text-primary);
        font-size: 1.5rem;
        text-align: center;
      }

      .problem-panel__feedback {
        margin: 0;
        color: var(--color-text-primary);
        font-size: 1.1rem;
        font-weight: 700;
        text-align: center;
      }
    `,
  ],
})
export class ProblemsComponent {
  private readonly problems: IllustratedProblem[] = [
    {
      story: 'Luca ha 4 mele. La mamma gliene regala altre 3.',
      question: 'Quante mele ha Luca adesso?',
      operation: { operand1: 4, operator: '+', operand2: 3, result: 7 },
    },
    {
      story: 'Nel cestino ci sono 8 frutti. Ne mangiamo 2.',
      question: 'Quanti frutti restano nel cestino?',
      operation: { operand1: 8, operator: '-', operand2: 2, result: 6 },
    },
  ];

  private problemIndex = signal(0);
  problem = computed(() => this.problems[this.problemIndex()]);
  answer = signal('');
  feedback = signal('');

  onAnswerInput(event: Event): void {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      this.answer.set(input.value);
    }
  }

  checkAnswer(): void {
    if (!this.answer()) {
      this.feedback.set('Inserisci una risposta per iniziare.');
      return;
    }

    this.feedback.set(
      Number(this.answer()) === this.problem().operation.result
        ? 'Bravo! Hai scelto il calcolo giusto.'
        : 'Osserva i gruppi e prova a contare ancora.',
    );
  }

  nextProblem(): void {
    this.problemIndex.update((index) => (index + 1) % this.problems.length);
    this.answer.set('');
    this.feedback.set('');
  }
}
