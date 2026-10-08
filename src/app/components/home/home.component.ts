import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface Activity {
  route: string;
  icon: string;
  title: string;
  description: string;
  ariaLabel: string;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home-shell">
      <main class="home-container">
        <header class="home-hero">
          <div>
            <p class="eyebrow">Il tuo spazio per imparare</p>
            <h1 class="home-title">Ciao, sono Math-ilde!</h1>
            <p class="home-subtitle">Scegli un allenamento e facciamo matematica insieme.</p>
          </div>
          <div class="home-mascot" aria-hidden="true">✦</div>
        </header>

        <section class="continue-card" aria-labelledby="continue-title">
          <div class="continue-icon" aria-hidden="true">➕</div>
          <div class="continue-copy">
            <p class="eyebrow">Inizia da qui</p>
            <h2 id="continue-title">Addizioni e sottrazioni</h2>
            <p>Parti dai numeri più semplici e allenati un passo alla volta.</p>
          </div>
          <a
            routerLink="/addizioni-sottrazioni"
            class="btn btn-primary continue-action"
            aria-label="Inizia l'allenamento di addizioni e sottrazioni"
          >
            Inizia
            <span aria-hidden="true">→</span>
          </a>
          <a routerLink="/progressi" class="progress-link">Vedi i miei traguardi →</a>
        </section>

        <section class="activity-section" aria-labelledby="core-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Allenamenti base</p>
              <h2 id="core-title">Costruiamo le fondamenta</h2>
            </div>
            <p class="m-0 text-[var(--color-text-secondary)]">Scegli un’attività per cominciare.</p>
          </div>

          <div class="core-grid">
            @for (activity of coreActivities; track activity.route) {
              <a
                [routerLink]="activity.route"
                class="activity-card activity-card-featured"
                [attr.aria-label]="activity.ariaLabel"
              >
                <span class="activity-icon" aria-hidden="true">{{ activity.icon }}</span>
                <span class="activity-content">
                  <span class="activity-title">{{ activity.title }}</span>
                  <span class="activity-description">{{ activity.description }}</span>
                </span>
                <span class="activity-arrow" aria-hidden="true">→</span>
              </a>
            }
          </div>
        </section>

        <section class="activity-section" aria-labelledby="more-title">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Altri percorsi</p>
              <h2 id="more-title">Esplora quando vuoi</h2>
            </div>
          </div>

          <div class="category-grid">
            <div class="category-card">
              <h3>Numeri e logica</h3>
              <div class="activity-list">
                @for (activity of numberActivities; track activity.route) {
                  <a
                    [routerLink]="activity.route"
                    class="activity-card activity-card-compact"
                    [attr.aria-label]="activity.ariaLabel"
                  >
                    <span class="activity-icon" aria-hidden="true">{{ activity.icon }}</span>
                    <span class="activity-content">
                      <span class="activity-title">{{ activity.title }}</span>
                      <span class="activity-description">{{ activity.description }}</span>
                    </span>
                    <span class="activity-arrow" aria-hidden="true">→</span>
                  </a>
                }
              </div>
            </div>

            <div class="category-card">
              <h3>Spazio e misure</h3>
              <div class="activity-list">
                @for (activity of measureActivities; track activity.route) {
                  <a
                    [routerLink]="activity.route"
                    class="activity-card activity-card-compact"
                    [attr.aria-label]="activity.ariaLabel"
                  >
                    <span class="activity-icon" aria-hidden="true">{{ activity.icon }}</span>
                    <span class="activity-content">
                      <span class="activity-title">{{ activity.title }}</span>
                      <span class="activity-description">{{ activity.description }}</span>
                    </span>
                    <span class="activity-arrow" aria-hidden="true">→</span>
                  </a>
                }
              </div>
            </div>

            <div class="category-card">
              <h3>Lettura e giochi</h3>
              <div class="activity-list">
                @for (activity of readingActivities; track activity.route) {
                  <a
                    [routerLink]="activity.route"
                    class="activity-card activity-card-compact"
                    [attr.aria-label]="activity.ariaLabel"
                  >
                    <span class="activity-icon" aria-hidden="true">{{ activity.icon }}</span>
                    <span class="activity-content">
                      <span class="activity-title">{{ activity.title }}</span>
                      <span class="activity-description">{{ activity.description }}</span>
                    </span>
                    <span class="activity-arrow" aria-hidden="true">→</span>
                  </a>
                }
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home-shell {
        min-height: 100vh;
        background:
          radial-gradient(circle at 8% 8%, rgba(168, 216, 234, 0.34), transparent 25rem),
          radial-gradient(circle at 92% 14%, rgba(255, 182, 193, 0.28), transparent 22rem),
          var(--color-bg-primary);
      }

      .home-container {
        width: min(100% - 2rem, 72rem);
        margin: 0 auto;
        padding: 3rem 0 5rem;
      }

      .home-hero {
        display: grid;
        grid-template-columns: auto 1fr;
        align-items: center;
        gap: 2rem;
        margin-bottom: 2rem;
        text-align: center;
      }

      .eyebrow {
        margin: 0 0 0.5rem;
        color: var(--color-primary-strong);
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      .home-title {
        margin: 0;
        color: var(--color-text-primary);
        font-size: clamp(2.25rem, 6vw, 4.5rem);
        font-weight: 800;
        letter-spacing: -0.04em;
      }

      .home-subtitle {
        max-width: 38rem;
        margin: 1rem 0 0;
        color: var(--color-text-secondary);
        font-size: clamp(1.05rem, 2vw, 1.3rem);
        line-height: 1.5;
      }

      .home-mascot {
        display: grid;
        flex: 0 0 auto;
        width: 6rem;
        height: 6rem;
        place-items: center;
        border: 3px solid rgba(36, 86, 106, 0.18);
        border-radius: 2rem;
        background: var(--color-tertiary);
        color: var(--color-primary-strong);
        font-size: 3rem;
        transform: rotate(8deg);
      }

      .continue-card {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 1.25rem;
        padding: clamp(1.25rem, 4vw, 2rem);
        border: 2px solid rgba(36, 86, 106, 0.14);
        border-radius: 1.5rem;
        background: #ffffff;
        box-shadow: 0 1rem 2.5rem rgba(74, 85, 104, 0.12);
      }

      .continue-icon {
        display: grid;
        width: 4rem;
        height: 4rem;
        place-items: center;
        border-radius: 1.25rem;
        background: var(--color-primary);
        color: var(--color-primary-strong);
        font-size: 2rem;
        font-weight: 800;
      }

      .continue-copy h2,
      .section-heading h2 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: clamp(1.45rem, 3vw, 2rem);
        line-height: 1.15;
      }

      .continue-copy p:last-child {
        margin: 0.45rem 0 0;
        color: var(--color-text-secondary);
        line-height: 1.45;
      }

      .continue-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        white-space: nowrap;
        text-decoration: none;
      }

      .activity-section {
        margin-top: 4rem;
      }

      .section-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .core-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .activity-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        min-width: 0;
        color: inherit;
        text-decoration: none;
        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          border-color 180ms ease;
      }

      .activity-card:hover {
        border-color: rgba(36, 86, 106, 0.38);
        transform: translateY(-0.2rem);
      }

      .activity-card-featured {
        position: relative;
        align-items: flex-start;
        padding: 1.35rem;
        border: 2px solid rgba(36, 86, 106, 0.12);
        border-radius: 1.25rem;
        background: #ffffff;
        box-shadow: 0 0.5rem 1.25rem rgba(74, 85, 104, 0.08);
      }

      .activity-card-compact {
        padding: 0.8rem;
        border: 1px solid rgba(36, 86, 106, 0.12);
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.82);
      }

      .activity-icon {
        display: grid;
        flex: 0 0 auto;
        width: 3.25rem;
        height: 3.25rem;
        place-items: center;
        border-radius: 1rem;
        background: var(--color-bg-secondary);
        font-size: 2rem;
      }

      .activity-content {
        display: grid;
        gap: 0.3rem;
        min-width: 0;
      }

      .activity-title {
        color: var(--color-text-primary);
        font-size: 1.1rem;
        font-weight: 800;
        line-height: 1.2;
      }

      .activity-description {
        color: var(--color-text-secondary);
        font-size: 0.95rem;
        line-height: 1.35;
      }

      .activity-arrow {
        align-self: center;
        margin-left: auto;
        color: var(--color-primary-strong);
        font-size: 1.4rem;
        font-weight: 800;
      }

      .category-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 1rem;
      }

      .category-card {
        padding: 1.25rem;
        border: 1px solid rgba(36, 86, 106, 0.12);
        border-radius: 1.25rem;
        background: rgba(255, 255, 255, 0.62);
      }

      .category-card h3 {
        margin: 0 0 1rem;
        color: var(--color-text-primary);
        font-size: 1.1rem;
      }

      .activity-list {
        display: grid;
        gap: 0.65rem;
      }

      @media (max-width: 800px) {
        .core-grid,
        .category-grid {
          grid-template-columns: 1fr;
        }

        .section-heading {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (max-width: 560px) {
        .home-container {
          width: min(100% - 1.25rem, 72rem);
          padding-top: 2rem;
        }

        .home-hero {
          grid-template-columns: 1fr;
          justify-items: center;
        }

        .home-mascot {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 1.1rem;
          font-size: 1.8rem;
        }

        .continue-card {
          grid-template-columns: auto 1fr;
        }

        .continue-action {
          grid-column: 1 / -1;
          width: 100%;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .activity-card {
          transition: none;
        }
      }
    `,
  ],
})
export class HomeComponent {
  readonly coreActivities: Activity[] = [
    {
      route: '/addizioni-sottrazioni',
      icon: '➕➖',
      title: 'Addizioni e sottrazioni',
      description: 'Impara a sommare e sottrarre',
      ariaLabel: 'Vai alla sezione Addizioni e Sottrazioni',
    },
    {
      route: '/moltiplicazioni',
      icon: '✖️',
      title: 'Moltiplicazioni',
      description: 'Scopri le tabelline',
      ariaLabel: 'Vai alla sezione Moltiplicazioni',
    },
    {
      route: '/divisioni',
      icon: '➗',
      title: 'Divisioni',
      description: 'Dividi e conquista',
      ariaLabel: 'Vai alla sezione Divisioni',
    },
  ];

  readonly numberActivities: Activity[] = [
    {
      route: '/scomposizione',
      icon: '🧩',
      title: 'Scomposizione',
      description: 'Scomponi le somme',
      ariaLabel: 'Vai alla sezione Scomposizione della Somma',
    },
    {
      route: '/tabelline',
      icon: '📊',
      title: 'Tabelline',
      description: 'Ordina i risultati',
      ariaLabel: 'Vai alla sezione Tabelline',
    },
    {
      route: '/sequenze',
      icon: '🔢',
      title: 'Sequenze',
      description: 'Trova i numeri mancanti',
      ariaLabel: 'Vai alla sezione Sequenze Numeriche',
    },
    {
      route: '/frazioni',
      icon: '🥧',
      title: 'Frazioni',
      description: 'Scopri le parti di un intero',
      ariaLabel: 'Vai alla sezione Frazioni Visive',
    },
  ];

  readonly measureActivities: Activity[] = [
    {
      route: '/orologio',
      icon: '⏰',
      title: 'Orologio',
      description: 'Impara a leggere l’ora',
      ariaLabel: "Vai alla sezione Lettura dell'Orologio",
    },
    {
      route: '/misure',
      icon: '📏',
      title: 'Misure',
      description: 'Converti le unità',
      ariaLabel: 'Vai alla sezione Misure e Conversioni',
    },
    {
      route: '/confronto',
      icon: '⚖️',
      title: 'Confronto',
      description: 'Confronta e ordina',
      ariaLabel: 'Vai alla sezione Confronto e Ordinamento',
    },
    {
      route: '/geometria',
      icon: '🔺',
      title: 'Geometria',
      description: 'Scopri le figure',
      ariaLabel: 'Vai alla sezione Geometria di Base',
    },
    {
      route: '/laboratorio',
      icon: '🧪',
      title: 'Laboratorio',
      description: 'Esplora e osserva',
      ariaLabel: 'Vai al Laboratorio delle figure',
    },
  ];

  readonly readingActivities: Activity[] = [
    {
      route: '/sillabe',
      icon: '🔤',
      title: 'Sillabe',
      description: 'Leggi le parole a sillabe',
      ariaLabel: 'Vai alla sezione Lettura a Sillabe',
    },
    {
      route: '/moltiplicazioni-griglia',
      icon: '🟩',
      title: 'Griglia ×',
      description: 'Colora l’area',
      ariaLabel: 'Vai alla sezione Moltiplicazioni a Griglia',
    },
    {
      route: '/tabelline-quiz',
      icon: '✏️',
      title: 'Quiz tabelline',
      description: 'Scrivi i risultati',
      ariaLabel: 'Vai alla sezione Quiz Tabelline',
    },
    {
      route: '/tabelline-griglia',
      icon: '🧱',
      title: 'Tabelline a blocchi',
      description: 'Visualizza le tabelline',
      ariaLabel: 'Vai alla sezione Tabelline a Blocchi',
    },
    {
      route: '/giochi/memory',
      icon: '🃏',
      title: 'Memory',
      description: 'Abbina operazioni e risultati',
      ariaLabel: 'Vai al gioco Memory Matematico',
    },
  ];
}
