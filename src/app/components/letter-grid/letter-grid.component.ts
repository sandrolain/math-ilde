import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-letter-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="letter-panel" aria-labelledby="letter-grid-title">
      <h2 id="letter-grid-title">Le lettere</h2>
      <p class="letter-panel__hint">Premi una lettera per ascoltarla.</p>
      <div class="letter-grid" role="group" aria-label="Alfabeto italiano">
        @for (letter of letters(); track letter) {
          <button
            type="button"
            class="letter-button"
            (click)="pronounce(letter)"
            [attr.aria-label]="'Pronuncia la lettera ' + letter.toUpperCase()"
          >
            @if (showUppercase()) {
              <span>{{ letter.toUpperCase() }}</span>
            }
            @if (showLowercase()) {
              <small>{{ letter }}</small>
            }
          </button>
        }
      </div>
    </section>
  `,
  styles: [
    `
      :host { display: block; width: 100%; }
      .letter-panel { padding: clamp(1rem, 3vw, 1.5rem); border: 2px solid var(--color-primary); border-radius: 1rem; background: var(--color-surface); }
      h2 { margin: 0; color: var(--color-text-primary); font-size: clamp(1.5rem, 4vw, 2rem); text-align: center; }
      .letter-panel__hint { margin: .35rem 0 1.25rem; color: var(--color-text-secondary); text-align: center; }
      .letter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(4.25rem, 1fr)); gap: .7rem; max-width: 48rem; margin: 0 auto; }
      .letter-button { display: grid; place-items: center; min-height: 5rem; padding: .6rem; border: 2px solid var(--color-primary); border-radius: .85rem; background: var(--color-background); color: var(--color-text-primary); cursor: pointer; }
      .letter-button:hover { background: var(--color-info-surface); }
      .letter-button:focus-visible { outline: 3px solid var(--color-action); outline-offset: 3px; }
      .letter-button span { font-size: clamp(1.8rem, 5vw, 2.5rem); font-weight: 800; line-height: 1; }
      .letter-button small { color: var(--color-text-secondary); font-size: 1rem; }
    `,
  ],
})
export class LetterGridComponent {
  letters = input.required<readonly string[]>();
  showUppercase = input(true);
  showLowercase = input(true);
  private readonly speechService = inject(SpeechService);

  pronounce(letter: string): void {
    this.speechService.speak(letter, { rate: 0.65 });
  }
}
