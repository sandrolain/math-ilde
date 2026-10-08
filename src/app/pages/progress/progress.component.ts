import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningProgressStorageService } from '../../services/learning-progress-storage.service';

@Component({
  selector: 'app-progress',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="progress-page">
      <header class="page-hero">
        <a routerLink="/" class="back-link">← Torna alla home</a>
        <div class="hero-copy">
          <span class="hero-mark" aria-hidden="true">✦</span>
          <div>
            <h1>Il mio diario dei traguardi</h1>
            <p class="intro">Guarda i passi che hai fatto. Ogni esercizio conta!</p>
          </div>
        </div>
        <a routerLink="/ripasso" class="hero-action">Ripassa con me <span aria-hidden="true">→</span></a>
      </header>

      <section class="summary-panel" aria-label="Riepilogo progressi">
        <div class="summary-intro"><strong>Il tuo percorso</strong><span>Piccoli passi, grandi scoperte.</span></div>
        <div class="summary-grid">
          <div><strong>{{ totalExercises() }}</strong><span>esercizi risolti</span></div>
          <div><strong>{{ totalCorrect() }}</strong><span>risposte corrette</span></div>
          <div><strong>{{ skillsReached() }}</strong><span>abilità allenate</span></div>
        </div>
      </section>

      <div class="dashboard-grid">
        <section class="milestones" aria-labelledby="milestones-title">
          <div class="section-heading">
            <div>
              <h2 id="milestones-title">I miei traguardi</h2>
              <p>Ogni obiettivo si sblocca con la pratica.</p>
            </div>
            <span class="section-count">{{ completedMilestones() }}/{{ milestones().length }}</span>
          </div>
          <div class="milestone-list">
            @for (milestone of milestones(); track milestone.label) {
              <article class="milestone" [class.milestone--done]="milestone.done">
                <span class="milestone__icon" aria-hidden="true">{{ milestone.done ? '✓' : '·' }}</span>
                <span><strong>{{ milestone.label }}</strong><small>{{ milestone.detail }}</small></span>
              </article>
            }
          </div>
        </section>

        <section class="next-step" aria-labelledby="next-title">
          <span class="next-step__label">Prossimo passo</span>
          <h2 id="next-title">Continua a crescere</h2>
          <p>{{ recommendation() }}</p>
          <a routerLink="/ripasso" class="btn btn-primary btn-sm">Vai al ripasso <span aria-hidden="true">→</span></a>
        </section>
      </div>

      <section class="adult-tools" aria-labelledby="adult-title">
        <div class="section-heading">
          <div>
            <h2 id="adult-title">Spazio adulto</h2>
            <p>Gestisci i dati di apprendimento con calma.</p>
          </div>
          <a routerLink="/impostazioni-apprendimento" class="settings-link">Impostazioni →</a>
        </div>
        <div class="tools">
          <button type="button" class="btn btn-secondary btn-sm" (click)="exportProgress()">Esporta progressi</button>
          <label class="btn btn-secondary btn-sm">
            Importa progressi
            <input type="file" accept="application/json,.json" (change)="importFile($event)" />
          </label>
          <button type="button" class="btn btn-danger btn-sm" (click)="resetProgress()">Azzera tutto</button>
        </div>
        @if (notice()) {
          <p class="notice" role="status">{{ notice() }}</p>
        }
      </section>
    </main>
  `,
  styles: [
    `
      :host { display: block; }
      .progress-page { width: min(100% - 2rem, 68rem); margin: 0 auto; padding: 2rem 0 4rem; }
      .page-hero { display: grid; grid-template-columns: auto 1fr auto; align-items: end; gap: 1.5rem; padding-bottom: 2rem; border-bottom: 1px solid var(--color-border); }
      .back-link, .settings-link { color: var(--color-primary-strong); font-weight: 800; text-decoration: none; }
      .hero-copy { display: flex; align-items: center; gap: 1rem; }
      .hero-mark { display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-radius: 1rem; background: var(--color-tertiary); color: var(--color-primary-strong); font-size: 2rem; }
      h1 { margin: 0; color: var(--color-text-primary); font-size: clamp(2rem, 5vw, 3.5rem); line-height: 1; }
      .intro { margin: .65rem 0 0; color: var(--color-text-secondary); font-size: 1.1rem; }
      .hero-action { padding: .85rem 1rem; border-radius: .8rem; background: var(--color-action); color: white; font-weight: 800; text-decoration: none; }
      .summary-panel, .milestones, .adult-tools { margin-top: 1.5rem; padding: clamp(1rem, 3vw, 1.5rem); border: 1px solid var(--color-border); border-radius: 1rem; background: var(--color-surface); }
      .summary-panel { display: flex; align-items: center; justify-content: space-between; gap: 2rem; }
      .summary-intro { display: grid; gap: .3rem; min-width: 10rem; }
      .summary-intro strong, h2 { color: var(--color-text-primary); }
      .summary-intro span, .section-heading p, .adult-tools p, .next-step p, small { color: var(--color-text-secondary); }
      .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(7rem, 1fr)); gap: 1.5rem; flex: 1; }
      .summary-grid div { display: grid; gap: .25rem; }
      .summary-grid strong { color: var(--color-primary-strong); font-size: 2.2rem; line-height: 1; }
      .summary-grid span { color: var(--color-text-secondary); font-size: .9rem; }
      .dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(16rem, .65fr); gap: 1.5rem; }
      .section-heading { display: flex; align-items: start; justify-content: space-between; gap: 1rem; }
      h2 { margin: 0; font-size: 1.35rem; }
      .section-heading p { margin: .35rem 0 0; }
      .section-count { padding: .35rem .6rem; border-radius: .5rem; background: var(--color-info-surface); color: var(--color-primary-strong); font-weight: 800; }
      .milestone-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; margin-top: 1.25rem; }
      .milestone { display: flex; align-items: start; gap: .7rem; min-height: 5.5rem; padding: .9rem; border-radius: .75rem; background: var(--color-bg-secondary); }
      .milestone span:last-child { display: grid; gap: .25rem; }
      .milestone__icon { display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border: 2px solid var(--color-border); border-radius: 50%; color: var(--color-text-secondary); font-weight: 900; }
      .milestone--done { background: var(--color-success-surface); }
      .milestone--done .milestone__icon { border-color: var(--color-success-strong); color: var(--color-success-strong); }
      .next-step { display: flex; flex-direction: column; align-items: start; justify-content: center; gap: .8rem; margin-top: 1.5rem; padding: 1.5rem; border-radius: 1rem; background: var(--color-primary-strong); color: white; }
      .next-step h2, .next-step p { color: white; }
      .next-step h2, .next-step p { margin: 0; }
      .next-step__label { color: var(--color-primary); font-size: .85rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
      .next-step .btn { background: white; color: var(--color-primary-strong); }
      .adult-tools { display: grid; gap: 1rem; }
      .adult-tools p { margin: .35rem 0 0; }
      .tools { display: flex; flex-wrap: wrap; gap: .75rem; }
      .tools label { cursor: pointer; }
      .tools input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .btn-danger { border: 2px solid #b42318; background: #fff1f0; color: #8a1c13; }
      .notice { margin: 0; color: var(--color-success-strong); font-weight: 700; }
      @media (max-width: 52rem) { .page-hero { grid-template-columns: 1fr auto; } .hero-copy { grid-column: 1 / -1; grid-row: 1; } .back-link { grid-row: 2; } .hero-action { grid-row: 2; } .summary-panel { align-items: start; flex-direction: column; } .summary-grid { width: 100%; } }
      @media (max-width: 42rem) { .dashboard-grid, .milestone-list { grid-template-columns: 1fr; } .summary-grid { gap: .75rem; } .summary-grid strong { font-size: 1.8rem; } .tools > * { width: 100%; } }
    `,
  ],
})
export class ProgressComponent {
  private readonly storage = inject(LearningProgressStorageService);
  private readonly state = signal(this.storage.load());
  readonly notice = signal('');

  readonly totalExercises = computed(() =>
    this.state().sessions.reduce((total, session) => total + session.completedExercises, 0),
  );
  readonly totalCorrect = computed(() =>
    this.state().sessions.reduce((total, session) => total + session.correctAnswers, 0),
  );
  readonly skillsReached = computed(() => new Set(this.state().sessions.map((session) => session.skillId)).size);
  readonly milestones = computed(() => {
    const exercises = this.totalExercises();
    const correct = this.totalCorrect();
    return [
      { label: 'Primo passo', detail: 'Risolvi il primo esercizio', done: exercises >= 1 },
      { label: 'Dieci in gamba', detail: 'Risolvi 10 esercizi', done: exercises >= 10 },
      { label: 'Occhio di falco', detail: 'Dai 10 risposte corrette', done: correct >= 10 },
    ];
  });
  readonly completedMilestones = computed(() => this.milestones().filter((milestone) => milestone.done).length);
  readonly recommendation = computed(() =>
    this.totalExercises() === 0
      ? 'Inizia con Addizioni e sottrazioni per costruire le basi.'
      : 'Continua ad allenarti: ogni risposta ti aiuta a diventare più sicuro.',
  );

  exportProgress(): void {
    const blob = new Blob([this.storage.exportJson()], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'math-ilde-progressi.json';
    link.click();
    URL.revokeObjectURL(link.href);
    this.notice.set('Progressi esportati.');
  }

  async importFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const imported = this.storage.importJson(await file.text());
    this.notice.set(imported ? 'Progressi importati.' : 'File non valido: progressi non modificati.');
    if (imported) this.state.set(this.storage.load());
    input.value = '';
  }

  resetProgress(): void {
    if (!confirm('Vuoi davvero cancellare tutti i progressi?')) return;
    this.storage.clear();
    this.state.set(this.storage.load());
    this.notice.set('Progressi azzerati.');
  }
}
