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
      <header class="review-hero">
        <a routerLink="/" class="back-link">← Torna alla home</a>
        <div>
          <span class="review-kicker">Un passo alla volta</span>
          <h1>Ripassa con me</h1>
          <p class="review-page__intro">Qui trovi argomenti da riprovare con calma. Ogni errore è un passo per imparare.</p>
        </div>
        @if (reviewItems().length > 0) {
          <span class="review-count">{{ reviewItems().length }} {{ reviewItems().length === 1 ? 'argomento' : 'argomenti' }}</span>
        }
      </header>

      @if (reviewItems().length === 0) {
        <section class="review-empty" aria-live="polite">
          <span class="empty-mark" aria-hidden="true">✓</span>
          <h2>Nessun ripasso urgente</h2>
          <p>Continua a esercitarti: quando servirà, troverai qui un suggerimento.</p>
          <div class="empty-actions">
            <a routerLink="/percorsi" class="btn btn-primary">Scegli un percorso</a>
            <a routerLink="/progressi" class="btn btn-secondary btn-sm">Vedi i traguardi</a>
          </div>
        </section>
      } @else {
        <section class="review-content" aria-labelledby="review-list-title">
          <div class="review-content__heading">
            <div>
              <h2 id="review-list-title">Da riprovare</h2>
              <p>Parti dall'argomento che vuoi rinforzare.</p>
            </div>
            <a routerLink="/percorsi" class="secondary-link">Vedi percorsi →</a>
          </div>
          <ul class="review-list" aria-label="Competenze da ripassare">
          @for (item of reviewItems(); track item.skillId) {
            <li>
              <a [routerLink]="item.route">
                <span class="review-list__marker" aria-hidden="true">↗</span>
                <span>
                  <strong>{{ item.label }}</strong>
                  <small>{{ item.errors }} errori da riprovare</small>
                </span>
                <span class="review-list__action">Ripassa <span aria-hidden="true">→</span></span>
              </a>
            </li>
          }
          </ul>
        </section>
      }
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .review-page {
        width: min(100% - 2rem, 68rem);
        margin: 0 auto;
        padding: 2rem 0 4rem;
      }

      .review-hero {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: end;
        gap: 1.5rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid var(--color-border);
      }

      .back-link, .secondary-link { color: var(--color-primary-strong); font-weight: 800; text-decoration: none; }
      .review-kicker { color: var(--color-primary-strong); font-size: .85rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
      h1 {
        margin: .35rem 0 .5rem;
        color: var(--color-text-primary);
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 800;
      }

      .review-page__intro {
        max-width: 42rem;
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 1.15rem;
      }

      .review-count { padding: .5rem .75rem; border-radius: .6rem; background: var(--color-info-surface); color: var(--color-primary-strong); font-weight: 800; white-space: nowrap; }
      .review-empty {
        display: grid;
        justify-items: center;
        gap: 1rem;
        margin-top: 2rem;
        padding: clamp(2rem, 6vw, 4rem) 1rem;
        border: 1px solid var(--color-border);
        border-radius: 1rem;
        background: var(--color-surface);
        text-align: center;
      }

      .empty-mark { display: grid; place-items: center; width: 4rem; height: 4rem; border-radius: 50%; background: var(--color-success-surface); color: var(--color-success-strong); font-size: 2rem; font-weight: 900; }
      .review-empty h2,
      .review-empty p {
        margin: 0;
        color: var(--color-text-primary);
      }
      .review-empty p { max-width: 32rem; color: var(--color-text-secondary); }
      .empty-actions { display: flex; flex-wrap: wrap; justify-content: center; gap: .75rem; margin-top: .5rem; }

      .review-content { margin-top: 2rem; }
      .review-content__heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1rem; }
      .review-content h2 { margin: 0; color: var(--color-text-primary); font-size: 1.5rem; }
      .review-content__heading p { margin: .35rem 0 0; color: var(--color-text-secondary); }
      .review-list {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: .85rem;
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .review-list a {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 6.5rem;
        padding: 1rem;
        border: 1px solid var(--color-border);
        border-radius: 1rem;
        background: var(--color-surface);
        color: var(--color-text-primary);
        text-decoration: none;
        transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
      }

      .review-list a:hover,
      .review-list a:focus-visible {
        border-color: var(--color-primary-strong);
        box-shadow: 0 8px 22px rgba(36, 86, 106, .1);
        transform: translateY(-2px);
      }

      .review-list__marker { display: grid; place-items: center; width: 2.25rem; height: 2.25rem; flex: 0 0 auto; border-radius: .7rem; background: var(--color-encourage-surface); color: var(--color-encourage-strong); font-size: 1.3rem; font-weight: 900; }
      .review-list a > span:nth-child(2) {
        display: grid;
        gap: 0.25rem;
      }

      .review-list strong {
        font-size: 1.2rem;
      }

      .review-list small {
        color: var(--color-text-secondary);
      }

      .review-list__action {
        margin-left: auto;
        color: var(--color-primary-strong);
        font-weight: 800;
        white-space: nowrap;
      }
      @media (max-width: 48rem) { .review-hero { grid-template-columns: 1fr auto; } .review-hero > div { grid-column: 1 / -1; grid-row: 1; } .review-hero .back-link { grid-row: 2; } .review-hero .review-count { grid-row: 2; } .review-list { grid-template-columns: 1fr; } }
      @media (max-width: 36rem) { .review-content__heading { align-items: start; flex-direction: column; } .review-list__action { font-size: .9rem; } }
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
