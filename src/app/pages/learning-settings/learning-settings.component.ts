import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LearningPreferencesService } from '../../services/learning-preferences.service';
import { LearningProgressStorageService } from '../../services/learning-progress-storage.service';
import type { LearningSkillId } from '../../types/learning.types';

const SKILL_LABELS: Partial<Record<LearningSkillId, string>> = {
  'addition-subtraction': 'Addizioni e sottrazioni',
  multiplication: 'Moltiplicazioni',
  division: 'Divisioni',
  fractions: 'Frazioni',
  clock: 'Orologio',
  measurements: 'Misure',
  geometry: 'Geometria',
};

@Component({
  selector: 'app-learning-settings',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="settings-page">
      <a routerLink="/progressi" class="back-link">← Torna al diario</a>
      <h1>Impostazioni adulto</h1>
      <p class="intro">Gestisci preferenze e dati locali di Math-ilde.</p>

      <section class="settings-card" aria-labelledby="preferences-title">
        <h2 id="preferences-title">Preferenze</h2>
        <label class="setting-row">
          <span><strong>Animazioni ridotte</strong><small>Riduce movimenti e transizioni.</small></span>
          <input type="checkbox" [checked]="preferences().reducedMotion" (change)="setReducedMotion($event)" />
        </label>
        <label class="setting-row">
          <span><strong>Audio</strong><small>Attiva suoni e feedback audio quando presenti.</small></span>
          <input type="checkbox" [checked]="preferences().soundEnabled" (change)="setSound($event)" />
        </label>
      </section>

      <section class="settings-card" aria-labelledby="skills-title">
        <h2 id="skills-title">Reset selettivo</h2>
        <p class="muted">Cancella solo i progressi di una competenza.</p>
        @if (skills().length === 0) {
          <p class="muted">Nessuna competenza con progressi salvati.</p>
        } @else {
          <ul class="skill-list">
            @for (skill of skills(); track skill.id) {
              <li>
                <span>{{ skill.label }}</span>
                <button type="button" class="btn btn-secondary btn-sm" (click)="resetSkill(skill.id)">
                  Azzera
                </button>
              </li>
            }
          </ul>
        }
      </section>
      @if (notice()) { <p class="notice" role="status">{{ notice() }}</p> }
    </main>
  `,
  styles: [
    `
      :host { display: block; }
      .settings-page { width: min(100% - 2rem, 52rem); margin: 0 auto; padding: 2rem 0 4rem; }
      .back-link { color: var(--color-primary-strong); font-weight: 700; }
      h1 { margin: 1rem 0 .5rem; color: var(--color-text-primary); font-size: clamp(2rem, 6vw, 3.5rem); text-align: center; }
      .intro, .muted { color: var(--color-text-secondary); }
      .intro { margin: 0 auto 2rem; font-size: 1.15rem; text-align: center; }
      .settings-card { margin-top: 1.5rem; padding: 1.25rem; border: 2px solid var(--color-primary); border-radius: 1rem; background: var(--color-surface); }
      h2 { margin: 0 0 1rem; color: var(--color-text-primary); }
      .setting-row, .skill-list li { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .9rem 0; }
      .setting-row + .setting-row, .skill-list li + li { border-top: 1px solid var(--color-border); }
      .setting-row span { display: grid; gap: .25rem; }
      input[type='checkbox'] { width: 1.5rem; height: 1.5rem; accent-color: var(--color-action); }
      .skill-list { margin: 0; padding: 0; list-style: none; }
      .skill-list li span { color: var(--color-text-primary); font-weight: 700; }
      .notice { color: var(--color-success-strong); font-weight: 700; }
    `,
  ],
})
export class LearningSettingsComponent {
  private readonly preferencesService = inject(LearningPreferencesService);
  private readonly storage = inject(LearningProgressStorageService);
  readonly preferences = this.preferencesService.preferences;
  readonly notice = signal('');
  readonly skills = computed(() => {
    const ids = new Set(this.storage.load().sessions.map((session) => session.skillId));
    return [...ids].map((id) => ({ id, label: SKILL_LABELS[id] ?? id }));
  });

  setReducedMotion(event: Event): void {
    this.preferencesService.update({ reducedMotion: (event.target as HTMLInputElement).checked });
  }

  setSound(event: Event): void {
    this.preferencesService.update({ soundEnabled: (event.target as HTMLInputElement).checked });
  }

  resetSkill(skillId: LearningSkillId): void {
    if (!confirm('Vuoi cancellare i progressi di questa competenza?')) return;
    this.storage.clearSkill(skillId);
    this.notice.set('Progressi della competenza azzerati.');
  }
}
