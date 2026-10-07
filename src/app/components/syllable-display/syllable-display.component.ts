import { Component, input, computed } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-syllable-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="syllable-display"
      [class.font-cursive]="cursive()"
      [class.is-sentence]="isSentence()"
      [attr.aria-live]="'polite'"
    >
      @if (isSentence()) {
        <div class="sentence-wrapper">
          @for (word of content(); track $index; let wordIndex = $index) {
            <span class="word-group">
              @for (syllable of word; track $index; let syllableIndex = $index) {
                <span
                  class="syllable-box"
                  [class.syllable-box--upper]="displayCase() === 'upper'"
                  [class.syllable-box--active]="isSyllableActive(wordIndex, syllableIndex)"
                >{{ formatSyllable(syllable, wordIndex, syllableIndex) }}</span>
              }
            </span>
          }
        </div>
      } @else {
        <div class="word-wrapper">
          @for (word of content(); track $index; let wordIndex = $index) {
            @for (syllable of word; track $index; let syllableIndex = $index) {
              <span
                class="syllable-box"
                [class.syllable-box--upper]="displayCase() === 'upper'"
                [class.syllable-box--active]="isSyllableActive(wordIndex, syllableIndex)"
              >{{ formatSyllable(syllable, wordIndex, syllableIndex) }}</span>
            }
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }

    .syllable-display {
      width: 100%;
      text-align: center;
    }

    /* Layout parola: sillabe unite, nessun gap */
    .word-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      justify-content: center;
      align-items: center;
    }

    /* Layout frase: le parole hanno ampio spazio tra loro */
    .sentence-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      justify-content: center;
      align-items: center;
    }

    /* Gruppo-parola nella frase: sillabe senza gap */
    .word-group {
      display: inline-flex;
      flex-wrap: nowrap;
      gap: 0;
      align-items: center;
    }

    .syllable-box {
      display: inline-block;
      border: 2.5px solid var(--color-primary, #a8d8ea);
      /* Rimuove il border-radius per non interrompere la continuità visiva */
      border-radius: 0;
      /* Bordi laterali adiacenti sovrapposti per sembrare un'unica cornice */
      margin-right: -1px;
      padding: 0.2rem 0.35rem;
      font-size: clamp(2rem, 6vw, 4rem);
      line-height: 1.2;
      color: var(--color-text-primary, #2d6a8a);
      background: white;
      font-weight: 600;
      position: relative;
    }

    /* Prima sillaba della parola: angoli arrotondati a sinistra */
    .word-wrapper .syllable-box:first-child,
    .word-group .syllable-box:first-child {
      border-radius: 0.6rem 0 0 0.6rem;
    }

    /* Ultima sillaba della parola: angoli arrotondati a destra, nessun margin */
    .word-wrapper .syllable-box:last-child,
    .word-group .syllable-box:last-child {
      border-radius: 0 0.6rem 0.6rem 0;
      margin-right: 0;
    }

    /* Parola di una sola sillaba: completamente arrotondata */
    .word-wrapper .syllable-box:only-child,
    .word-group .syllable-box:only-child {
      border-radius: 0.6rem;
    }

    .syllable-box--upper {
      font-size: clamp(2.5rem, 8vw, 5rem);
    }

    .syllable-box--active {
      background: var(--color-success, #d9f99d);
      border-color: var(--color-success-dark, #65a30d);
      box-shadow: 0 0 0 0.35rem rgb(132 204 22 / 25%), 0 0.35rem 0.75rem rgb(101 163 13 / 25%);
      transform: translateY(-0.2rem) scale(1.04);
      z-index: 1;
      transition: background 150ms ease, box-shadow 150ms ease, transform 150ms ease;
    }

    .font-cursive .syllable-box {
      font-family: 'Playwrite IT Trad', cursive;
      font-weight: 400;
    }
  `],
})
export class SyllableDisplayComponent {
  content = input.required<string[][]>();
  displayCase = input<'upper' | 'lower' | 'sentence'>('lower');
  cursive = input<boolean>(false);
  isSentence = input<boolean>(false);
  speechActive = input<boolean>(false);
  activeSyllableIndex = input<number | null>(null);

  formatSyllable(syllable: string, wordIndex: number, syllableIndex: number): string {
    if (this.displayCase() === 'upper') {
      return syllable.toUpperCase();
    }

    const lowercaseSyllable = syllable.toLowerCase();
    if (this.displayCase() === 'sentence' && wordIndex === 0 && syllableIndex === 0) {
      return lowercaseSyllable.charAt(0).toUpperCase() + lowercaseSyllable.slice(1);
    }

    return lowercaseSyllable;
  }

  isSyllableActive(wordIndex: number, syllableIndex: number): boolean {
    if (!this.speechActive()) {
      return false;
    }

    const activeIndex = this.activeSyllableIndex();
    if (activeIndex === null) {
      return true;
    }

    let flatIndex = syllableIndex;
    for (let index = 0; index < wordIndex; index++) {
      flatIndex += this.content()[index].length;
    }

    return flatIndex === activeIndex;
  }
}
