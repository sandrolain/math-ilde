import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningProgressStorageService } from '../../services/learning-progress-storage.service';
import type { LearningSkillId } from '../../types/learning.types';

interface ReviewItem {
  skillId: LearningSkillId;
  label: string;
  errors: number;
  route: string;
}

const SKILL_DETAILS: Record<LearningSkillId, { label: string; route: string }> = {
  'addition-subtraction': { label: 'Addizioni e sottrazioni', route: '/addizioni-sottrazioni' },
  multiplication: { label: 'Moltiplicazioni', route: '/moltiplicazioni' },
  division: { label: 'Divisioni', route: '/divisioni' },
  decomposition: { label: 'Scomposizione', route: '/scomposizione' },
  syllables: { label: 'Sillabe', route: '/sillabe' },
  'times-table': { label: 'Tabelline', route: '/tabelline' },
  sequences: { label: 'Sequenze', route: '/sequenze' },
  fractions: { label: 'Frazioni', route: '/frazioni' },
  clock: { label: 'Orologio', route: '/orologio' },
  measurements: { label: 'Misure', route: '/misure' },
  comparison: { label: 'Confronto', route: '/confronto' },
  geometry: { label: 'Geometria', route: '/geometria' },
  'game-memory': { label: 'Memory', route: '/giochi/memory' },
};

@Component({
  selector: 'app-review',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="review-page">
      <a routerLink="/" class="back-link">← Torna alla home</a>
      <h1>Ripassa con me</h1>
      <p class="review-page__intro">
        Qui trovi argomenti da riprovare con calma. Ogni errore è un passo per imparare.
      </p>

      @if (reviewItems().length === 0) {
        <section class="review-empty" aria-live="polite">
          <h2>Nessun ripasso urgente</h2>
          <p>Continua a esercitarti: quando servirà, troverai qui un suggerimento.</p>
          <a routerLink="/percorsi" class="btn btn-primary">Scegli un percorso</a>
        </section>
      } @else {
        <ul class="review-list" aria-label="Competenze da ripassare">
          @for (item of reviewItems(); track item.skillId) {
            <li>
              <a [routerLink]="item.route">
                <span>
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.errors }} errori da riprovare</small>
                </span>
                <span aria-hidden="true">Ripassa →</span>
              </a>
            </li>
          }
        </ul>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .review-page {
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

      .review-page__intro {
        max-width: 42rem;
        margin: 0 auto 2rem;
        color: var(--color-text-secondary);
        font-size: 1.15rem;
        text-align: center;
      }

      .review-empty {
        display: grid;
        justify-items: center;
        gap: 1rem;
        padding: 2rem 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
        text-align: center;
      }

      .review-empty h2,
      .review-empty p {
        margin: 0;
        color: var(--color-text-primary);
      }

      .review-list {
        display: grid;
        gap: 1rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .review-list a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 5rem;
        padding: 1rem 1.25rem;
        border: 2px solid var(--color-encouraging);
        border-radius: 1rem;
        background: var(--color-surface);
        color: var(--color-text-primary);
        text-decoration: none;
      }

      .review-list a:hover,
      .review-list a:focus-visible {
        border-color: var(--color-primary-strong);
      }

      .review-list a > span:first-child {
        display: grid;
        gap: 0.25rem;
      }

      .review-list strong {
        font-size: 1.2rem;
      }

      .review-list small {
        color: var(--color-text-secondary);
      }

      .review-list a > span:last-child {
        color: var(--color-primary-strong);
        font-weight: 800;
        white-space: nowrap;
      }
    `,
  ],
})
export class ReviewComponent {
  private readonly storage = inject(LearningProgressStorageService);
  private readonly state = this.storage.load();

  reviewItems = computed<ReviewItem[]>(() => {
    const errorsBySkill = new Map<LearningSkillId, number>();
    for (const session of this.state.sessions) {
      const errors = session.attempts.filter((attempt) => !attempt.correct).length;
      if (errors > 0) {
        errorsBySkill.set(session.skillId, (errorsBySkill.get(session.skillId) ?? 0) + errors);
      }
    }

    return Array.from(errorsBySkill, ([skillId, errors]) => ({
      skillId,
      label: SKILL_DETAILS[skillId].label,
      errors,
      route: SKILL_DETAILS[skillId].route,
    }));
  });
}
