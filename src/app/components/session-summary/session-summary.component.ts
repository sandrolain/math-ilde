import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { ExerciseSession } from '../../types/learning.types';

@Component({
  selector: 'app-session-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="session-summary" aria-labelledby="session-summary-title">
      <div class="text-6xl" aria-hidden="true">🌟</div>
      <h2 id="session-summary-title">Sessione completata!</h2>
      <p class="session-summary__intro">Hai lavorato su addizioni e sottrazioni.</p>

      <dl class="session-summary__stats">
        <div>
          <dt>Esercizi risolti</dt>
          <dd>{{ session().completedExercises }} di {{ session().targetExercises }}</dd>
        </div>
        <div>
          <dt>Risposte corrette</dt>
          <dd>{{ session().correctAnswers }}</dd>
        </div>
      </dl>

      <p class="session-summary__message">
        Ogni esercizio ti aiuta a diventare più bravo. Continua così!
      </p>

      <button type="button" class="btn btn-primary min-h-12 min-w-52" (click)="restart.emit()">
        Nuova sessione
      </button>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .session-summary {
        display: grid;
        justify-items: center;
        gap: 1rem;
        padding: 2rem 1rem;
        text-align: center;
      }

      h2 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: clamp(1.75rem, 5vw, 2.5rem);
        font-weight: 800;
      }

      .session-summary__intro,
      .session-summary__message {
        max-width: 34rem;
        margin: 0;
        color: var(--color-text-primary);
        font-size: 1.1rem;
        line-height: 1.5;
      }

      .session-summary__stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 1rem;
        width: min(100%, 30rem);
        margin: 0.5rem 0;
      }

      .session-summary__stats div {
        padding: 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }

      dt {
        color: var(--color-text-secondary);
        font-size: 0.95rem;
      }

      dd {
        margin: 0.25rem 0 0;
        color: var(--color-text-primary);
        font-size: 1.5rem;
        font-weight: 800;
      }

      @media (max-width: 480px) {
        .session-summary__stats {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class SessionSummaryComponent {
  session = input.required<ExerciseSession>();
  restart = output<void>();
}
