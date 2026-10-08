import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningProgressStorageService } from '../../services/learning-progress-storage.service';

@Component({
  selector: 'app-progress',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="progress-page">
      <a routerLink="/" class="back-link">← Torna alla home</a>
      <h1>Il mio diario dei traguardi</h1>
      <p class="intro">Guarda i passi che hai fatto. Ogni esercizio conta!</p>

      <section class="summary-grid" aria-label="Riepilogo progressi">
        <div><strong>{{ totalExercises() }}</strong><span>esercizi risolti</span></div>
        <div><strong>{{ totalCorrect() }}</strong><span>risposte corrette</span></div>
        <div><strong>{{ skillsReached() }}</strong><span>abilità allenate</span></div>
      </section>

      <section class="milestones" aria-labelledby="milestones-title">
        <h2 id="milestones-title">I miei traguardi</h2>
        @for (milestone of milestones(); track milestone.label) {
          <article class="milestone" [class.milestone--done]="milestone.done">
            <span class="milestone__icon" aria-hidden="true">{{ milestone.done ? '🏆' : '🌱' }}</span>
            <span><strong>{{ milestone.label }}</strong><small>{{ milestone.detail }}</small></span>
          </article>
        }
      </section>

      <section class="adult-tools" aria-labelledby="adult-title">
        <h2 id="adult-title">Strumenti adulto</h2>
        <p>Salva i progressi per trasferirli su un altro dispositivo o fai pulizia quando vuoi.</p>
        <div class="tools">
          <button type="button" class="btn btn-primary" (click)="exportProgress()">Esporta progressi</button>
          <label class="btn btn-secondary">
            Importa progressi
            <input type="file" accept="application/json,.json" (change)="importFile($event)" />
          </label>
          <button type="button" class="btn btn-danger" (click)="resetProgress()">Azzera tutto</button>
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
      .progress-page { width: min(100% - 2rem, 58rem); margin: 0 auto; padding: 2rem 0 4rem; }
      .back-link { color: var(--color-primary-strong); font-weight: 700; }
      h1 { margin: 1rem 0 .5rem; color: var(--color-text-primary); font-size: clamp(2rem, 6vw, 3.5rem); text-align: center; }
      .intro { margin: 0 auto 2rem; color: var(--color-text-secondary); font-size: 1.15rem; text-align: center; }
      h2 { margin: 0 0 1rem; color: var(--color-text-primary); }
      .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 2rem; }
      .summary-grid div { display: grid; gap: .25rem; padding: 1rem; border-radius: 1rem; background: var(--color-surface); text-align: center; }
      .summary-grid strong { color: var(--color-primary-strong); font-size: 2rem; }
      .summary-grid span, small { color: var(--color-text-secondary); }
      .milestones, .adult-tools { margin-top: 1.5rem; padding: 1.25rem; border: 2px solid var(--color-primary); border-radius: 1rem; background: var(--color-surface); }
      .milestone { display: flex; align-items: center; gap: 1rem; padding: .9rem; border-radius: .75rem; background: var(--color-background); }
      .milestone + .milestone { margin-top: .65rem; }
      .milestone span:last-child { display: grid; gap: .2rem; }
      .milestone__icon { font-size: 1.7rem; }
      .milestone--done { outline: 2px solid var(--color-success); }
      .adult-tools p { color: var(--color-text-secondary); }
      .tools { display: flex; flex-wrap: wrap; gap: .75rem; }
      .tools label { cursor: pointer; }
      .tools input { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
      .btn-danger { border: 2px solid #b42318; background: #fff1f0; color: #8a1c13; }
      .notice { font-weight: 700; }
      @media (max-width: 36rem) { .summary-grid { grid-template-columns: 1fr; } .tools > * { width: 100%; } }
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
