import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface LearningPath {
  title: string;
  description: string;
  steps: string;
  route: string;
}

@Component({
  selector: 'app-learning-paths',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="paths-page">
      <header class="paths-page__header">
        <a routerLink="/" class="back-link">← Torna alla home</a>
        <h1>Impara passo passo</h1>
        <p>Scegli un piccolo obiettivo e allenati con calma.</p>
      </header>

      <nav aria-label="Percorsi di apprendimento" class="paths-list">
        @for (path of paths; track path.title) {
          <a [routerLink]="path.route" class="path-row">
            <span class="path-row__content">
              <strong>{{ path.title }}</strong>
              <span>{{ path.description }}</span>
              <small>{{ path.steps }}</small>
            </span>
            <span class="path-row__action" aria-hidden="true">Inizia →</span>
          </a>
        }
      </nav>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .paths-page {
        width: min(100% - 2rem, 60rem);
        margin: 0 auto;
        padding: 2rem 0 4rem;
      }

      .paths-page__header {
        margin-bottom: 2rem;
        text-align: center;
      }

      h1 {
        margin: 1rem 0 0.5rem;
        color: var(--color-text-primary);
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 800;
      }

      .paths-page__header p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 1.15rem;
      }

      .back-link {
        color: var(--color-primary-strong);
        font-weight: 700;
      }

      .paths-list {
        display: grid;
        gap: 1rem;
      }

      .path-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        min-height: 6rem;
        padding: 1.25rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
        color: inherit;
        text-decoration: none;
        transition: transform 150ms ease, border-color 150ms ease;
      }

      .path-row:hover,
      .path-row:focus-visible {
        border-color: var(--color-primary-strong);
        transform: translateY(-2px);
      }

      .path-row__content {
        display: grid;
        gap: 0.25rem;
      }

      .path-row strong {
        color: var(--color-text-primary);
        font-size: 1.25rem;
      }

      .path-row span,
      .path-row small {
        color: var(--color-text-secondary);
      }

      .path-row__action {
        flex: 0 0 auto;
        color: var(--color-primary-strong) !important;
        font-weight: 800;
      }

      @media (prefers-reduced-motion: reduce) {
        .path-row {
          transition: none;
        }
      }

      @media (max-width: 480px) {
        .path-row {
          align-items: flex-start;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class LearningPathsComponent {
  readonly paths: LearningPath[] = [
    {
      title: 'Numeri entro 10',
      description: 'Componi quantità e completa una decina.',
      steps: '3 passi · facile',
      route: '/addizioni-sottrazioni',
    },
    {
      title: 'Addizione e sottrazione',
      description: 'Conta, aggiungi e togli usando i disegni.',
      steps: '5 passi · base',
      route: '/addizioni-sottrazioni',
    },
    {
      title: 'Gruppi e moltiplicazioni',
      description: 'Scopri la moltiplicazione con gruppi uguali.',
      steps: '4 passi · base',
      route: '/moltiplicazioni',
    },
    {
      title: 'Divisione equa',
      description: 'Distribuisci elementi in gruppi uguali.',
      steps: '4 passi · base',
      route: '/divisioni',
    },
  ];
}
