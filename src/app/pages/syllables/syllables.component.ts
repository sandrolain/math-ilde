import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SyllabificationService } from '../../services/syllabification.service';
import { SyllableOptionsStorageService } from '../../services/syllable-options-storage.service';
import { SpeechService } from '../../services/speech.service';
import { SyllableDisplayComponent } from '../../components/syllable-display/syllable-display.component';
import { SyllableOptionsControlComponent } from '../../components/syllable-options-control/syllable-options-control.component';
import { LetterGridComponent } from '../../components/letter-grid/letter-grid.component';
import { HeaderComponent } from '../../components/header/header.component';
import { HandwritingCanvasComponent } from '../../components/handwriting-canvas/handwriting-canvas.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { FeedbackService } from '../../services/feedback.service';
import type { SyllableOptions } from '../../types/exercise.types';
import type { FeedbackType } from '../../types/exercise.types';
import {
  CONSONANTS,
  DOUBLES,
  VOWELS,
  COLORS,
  NUMBERS,
  ANIMALS,
  NAMES,
  THINGS,
  SENTENCES,
  ALPHABET,
} from '../../data/syllable-data';
import type { WordCategory, WordLength } from '../../types/exercise.types';

function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSyllable(opts: SyllableOptions): string {
  let consonant: string;

  if (opts.useDoubles) {
    const d = randomItem(DOUBLES);
    consonant = d.toLowerCase();
  } else if (opts.twoConsonants) {
    const c1 = randomItem(CONSONANTS);
    const c2 = randomItem(CONSONANTS.filter((c) => c !== c1 && c.length === 1));
    consonant = c1 + c2;
  } else {
    consonant = randomItem(CONSONANTS);
  }

  const vowel = randomItem(VOWELS);
  const base = consonant + vowel;

  return opts.addS ? 's' + base : base;
}

@Component({
  selector: 'app-syllables',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    HeaderComponent,
    SyllableDisplayComponent,
    SyllableOptionsControlComponent,
    LetterGridComponent,
    HandwritingCanvasComponent,
    FeedbackComponent,
  ],
  host: {
    class: 'block',
    '(window:keydown.Space)': 'onSpaceKey($event)',
  },
  template: `
    <app-header title="Sillabe" />

    <div class="flex flex-col lg:flex-row gap-4 p-4 min-h-[calc(100vh-80px)]">
      <app-syllable-options-control
        [options]="options()"
        (optionsChange)="onOptionsChange($event)"
      />

      <main class="flex-1 flex flex-col items-center justify-center gap-8 py-8">
        <div class="w-full max-w-3xl space-y-6">
          @if (options().activeMode === 'letter') {
            <app-letter-grid
              [letters]="displayedLetters()"
              [showUppercase]="options().showUppercase"
              [showLowercase]="options().showLowercase"
              [cursive]="options().letterStyle === 'cursive'"
            />
          }

          @if (options().activeMode === 'handwriting') {
            <app-handwriting-canvas
              [target]="
                options().handwritingTarget === 'word' ? currentWord() : currentLetter()
              "
              [writingStyle]="options().handwritingStyle"
              [sizeTolerance]="options().handwritingRelaxed ? 28 : 16"
              [shapeThreshold]="options().handwritingRelaxed ? 0.35 : 0.5"
              [clearToken]="handwritingClear()"
              [feedbackInPopup]="true"
              (result)="onHandwritingResult($event)"
            >
              <div writing-controls-top class="flex flex-col gap-3">
                <button
                  class="btn btn-primary w-full h-14 min-h-14 whitespace-nowrap text-lg"
                  type="button"
                  (click)="generateNext()"
                  [attr.aria-label]="
                    options().handwritingTarget === 'word'
                      ? 'Mostra una nuova parola da scrivere'
                      : 'Mostra una nuova lettera da scrivere'
                  "
                >
                  <span aria-hidden="true">🔄</span>
                  {{ options().handwritingTarget === 'word' ? 'Nuova parola' : 'Nuova lettera' }}
                </button>
                @if (speechService.isSupported) {
                  <button
                    class="btn btn-secondary w-full h-14 min-h-14 whitespace-nowrap text-lg"
                    type="button"
                    (click)="speakCurrentLetter()"
                    [attr.aria-label]="
                      speechService.isSpeaking()
                        ? 'Lettura in corso'
                        : options().handwritingTarget === 'word'
                          ? 'Ascolta la parola'
                          : 'Ascolta la lettera'
                    "
                  >
                    <span aria-hidden="true">🔊</span>
                    {{ speechService.isSpeaking() ? 'In ascolto...' : 'Ascolta' }}
                  </button>
                }

                @if (options().handwritingMilestone) {
                  <button
                    class="btn btn-secondary w-full h-14 min-h-14 whitespace-nowrap text-lg"
                    type="button"
                    (click)="resetHandwritingProgress()"
                    aria-label="Azzera il progresso del traguardo"
                  >
                    Azzera progresso
                  </button>
                }
              </div>
            </app-handwriting-canvas>
            @if (options().handwritingMilestone) {
              <section class="handwriting-progress" aria-labelledby="handwriting-progress-title">
                <div class="handwriting-progress__heading">
                  <h2 id="handwriting-progress-title">Il tuo traguardo</h2>
                  @if (options().handwritingTarget === 'word') {
                    <span class="handwriting-progress__count">
                      {{ wordHandwritingPassed().length }}/{{ wordCandidates().length }}
                    </span>
                  } @else {
                    <span class="handwriting-progress__count">
                      {{ handwritingPassedCount() }}/{{ alphabet.length }}
                    </span>
                  }
                </div>
                @if (options().handwritingTarget === 'word') {
                  <p class="handwriting-progress__hint">
                    Le parole verdi sono già superate.
                  </p>
                  <div class="handwriting-progress__grid" role="list" aria-label="Progresso parole">
                    @for (word of wordCandidates(); track word) {
                      <span
                        class="handwriting-progress__letter"
                        [class.handwriting-progress__letter--passed]="isHandwritingWordPassed(word)"
                        [attr.aria-label]="
                          word + (isHandwritingWordPassed(word) ? ': superata' : ': da esercitare')
                        "
                        role="listitem"
                      >
                        {{ word }}
                      </span>
                    }
                  </div>
                } @else {
                  <p class="handwriting-progress__hint">
                    Le lettere verdi sono già superate.
                  </p>
                  <div class="handwriting-progress__grid" role="list" aria-label="Progresso alfabeto">
                    @for (letter of alphabet; track letter) {
                      <span
                        class="handwriting-progress__letter"
                        [class.handwriting-progress__letter--passed]="isHandwritingLetterPassed(letter)"
                        [attr.aria-label]="
                          letter.toUpperCase() +
                          (isHandwritingLetterPassed(letter) ? ': superata' : ': da esercitare')
                        "
                        role="listitem"
                      >
                        {{ letter.toUpperCase() }}
                      </span>
                    }
                  </div>
                }
                @if (
                  (options().handwritingTarget === 'word' && wordHandwritingGoalComplete()) ||
                  (options().handwritingTarget === 'letter' && handwritingGoalComplete())
                ) {
                  <p class="handwriting-progress__complete" role="status">
                    Traguardo completato!
                  </p>
                }
              </section>
            }
            @if (handwritingFeedback(); as feedback) {
              <app-feedback
                [show]="true"
                [type]="feedback.type"
                [message]="feedback.message"
                [hint]="
                  options().handwritingTarget === 'word'
                    ? 'Parola: ' + currentWord()
                    : 'Lettera ' + currentLetter().toUpperCase()
                "
                (close)="closeHandwritingFeedback()"
                (next)="nextAfterHandwritingFeedback()"
              />
            }
          }

          @if (
            options().activeMode !== 'letter' &&
            options().activeMode !== 'handwriting'
          ) {
            @if (displayUppercase()) {
              <section aria-label="Testo in maiuscolo">
                <app-syllable-display
                  [content]="syllabifiedContent()"
                  displayCase="upper"
                  [isSentence]="options().activeMode === 'sentence'"
                  [speechActive]="speechService.isSpeaking()"
                  [activeSyllableIndex]="speechService.activeSyllableIndex()"
                />
              </section>
            }

            @if (options().showLowercase) {
              <section aria-label="Testo in minuscolo">
                <app-syllable-display
                  [content]="syllabifiedContent()"
                  displayCase="lower"
                  [isSentence]="options().activeMode === 'sentence'"
                  [speechActive]="speechService.isSpeaking()"
                  [activeSyllableIndex]="speechService.activeSyllableIndex()"
                />
              </section>
            }

            @if (options().showCursive) {
              <section aria-label="Testo in corsivo">
                <app-syllable-display
                  [content]="syllabifiedContent()"
                  displayCase="sentence"
                  [cursive]="true"
                  [isSentence]="options().activeMode === 'sentence'"
                  [speechActive]="speechService.isSpeaking()"
                  [activeSyllableIndex]="speechService.activeSyllableIndex()"
                />
              </section>
            }
          }
        </div>

        @if (
          options().activeMode !== 'letter' &&
          options().activeMode !== 'handwriting' &&
          speechService.isSupported
        ) {
          <div class="flex flex-wrap justify-center gap-3" aria-label="Comandi vocali">
            <button
              class="btn btn-secondary min-h-12 min-w-40 text-lg"
              type="button"
              (click)="speakContent()"
              [attr.aria-label]="
                speechService.isSpeaking() ? 'Lettura in corso' : 'Ascolta parola o frase'
              "
            >
              <span aria-hidden="true">🔊</span>
              {{ speechService.isSpeaking() ? 'In ascolto...' : 'Ascolta' }}
            </button>

            <button
              class="btn btn-secondary min-h-12 min-w-40 text-lg"
              type="button"
              (click)="speakSyllables()"
              aria-label="Ascolta sillaba per sillaba"
            >
              <span aria-hidden="true">🗣️</span>
              Ascolta sillabe
            </button>

            @if (speechService.isSpeaking()) {
              <button
                class="btn btn-outline min-h-12 min-w-32 text-lg"
                type="button"
                (click)="stopSpeaking()"
                aria-label="Ferma la lettura"
              >
                <span aria-hidden="true">⏹️</span>
                Ferma
              </button>
            }
          </div>
        } @else if (
          options().activeMode !== 'letter' &&
          options().activeMode !== 'handwriting'
        ) {
          <p class="text-center text-sm text-slate-600" role="status">
            La lettura vocale non è disponibile su questo dispositivo.
          </p>
        }

        @if (
          options().activeMode !== 'letter' &&
          options().activeMode !== 'handwriting'
        ) {
          <button
            class="btn btn-primary btn-large mt-4 min-w-45 min-h-14 text-xl"
            (click)="generateNext()"
            aria-label="Mostra prossima sillaba o parola"
          >
            <span aria-hidden="true">🔄</span>
            Prossimo
          </button>
        }
      </main>
    </div>
  `,
  styles: [
    `
      .handwriting-progress {
        width: 100%;
        padding: 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }
      .handwriting-progress__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .handwriting-progress h2 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: 1.25rem;
      }
      .handwriting-progress__count {
        color: var(--color-primary-strong);
        font-weight: 800;
      }
      .handwriting-progress__hint {
        margin: 0.35rem 0 0.75rem;
        color: var(--color-text-secondary);
        font-size: 0.95rem;
      }
      .handwriting-progress__grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr));
        gap: 0.45rem;
      }
      .handwriting-progress__letter {
        display: grid;
        place-items: center;
        min-height: 2.75rem;
        border: 2px solid var(--color-border);
        border-radius: 0.65rem;
        background: var(--color-background);
        color: var(--color-text-secondary);
        font-size: 1.2rem;
        font-weight: 800;
      }
      .handwriting-progress__letter--passed {
        border-color: var(--color-success-strong);
        background: var(--color-success-surface);
        color: var(--color-success-strong);
      }
      .handwriting-progress__complete {
        margin: 0.85rem 0 0;
        color: var(--color-success-strong);
        font-weight: 800;
        text-align: center;
      }
    `,
  ],
})
export class SyllablesComponent implements OnInit {
  private readonly syllabificationService = inject(SyllabificationService);
  private readonly storageService = inject(SyllableOptionsStorageService);
  private readonly feedbackService = inject(FeedbackService);
  readonly speechService = inject(SpeechService);
  readonly alphabet = ALPHABET;

  options = signal<SyllableOptions>(this.storageService.loadOptions());
  handwritingPassed = signal<string[]>(
    this.storageService.loadHandwritingProgress(this.options().handwritingStyle),
  );
  wordHandwritingPassed = signal<string[]>(
    this.storageService.loadWordHandwritingProgress(
      this.options().handwritingStyle,
      this.options().wordCategory,
      this.options().wordLength,
    ),
  );
  handwritingFeedback = signal<{ type: FeedbackType; message: string } | null>(null);
  currentRawContent = signal<string | string[]>('ba');
  /** Incrementato a ogni "Nuova lettera" per azzerare l'area di scrittura. */
  handwritingClear = signal(0);
  currentLetter = computed<string>(() => {
    const content = this.currentRawContent();
    return typeof content === 'string' ? content : 'a';
  });
  currentWord = computed(() => {
    const content = this.currentRawContent();
    return typeof content === 'string' ? content : 'uno';
  });
  displayedLetters = computed(() => {
    const filter = this.options().letterFilter;
    if (filter === 'vowels') return this.alphabet.filter((letter) => 'aeiou'.includes(letter));
    if (filter === 'consonants') return this.alphabet.filter((letter) => !'aeiou'.includes(letter));
    return this.alphabet;
  });
  handwritingPassedCount = computed(() => this.handwritingPassed().length);
  handwritingGoalComplete = computed(() => this.handwritingPassedCount() === this.alphabet.length);
  wordCandidates = computed(() => {
    const words: Record<WordCategory, readonly string[]> = {
      number: NUMBERS,
      animal: ANIMALS,
      name: NAMES,
      things: THINGS,
    };
    const length = this.options().wordLength;
    return words[this.options().wordCategory].filter(
      (word) =>
        word.replaceAll(' ', '').length <= 8 &&
        (length === 'any' || word.replaceAll(' ', '').length === length),
    );
  });
  wordHandwritingGoalComplete = computed(
    () =>
      this.wordCandidates().length > 0 &&
      this.wordCandidates().every((word) => this.wordHandwritingPassed().includes(word)),
  );

  syllabifiedContent = computed<string[][]>(() => {
    const raw = this.currentRawContent();
    const mode = this.options().activeMode;

    if (mode === 'sentence') {
      return this.syllabificationService.splitSentence(raw as string);
    }

    if (mode === 'syllable') {
      // Una sillaba: restituiamo come array di 1 parola con 1 sillaba
      return [[raw as string]];
    }

    // Parola singola
    return [this.syllabificationService.splitWord(raw as string)];
  });

  displayUppercase = computed(() => {
    return this.options().showUppercase && this.options().activeMode !== 'sentence';
  });

  ngOnInit(): void {
    this.generateNext();
  }

  speakContent(): void {
    const raw = this.currentRawContent();
    const text = Array.isArray(raw) ? raw.join(' ') : raw;
    this.speechService.speak(text);
  }

  speakCurrentLetter(): void {
    if (this.speechService.isSpeaking()) {
      this.speechService.stop();
      return;
    }
    this.speechService.speak(this.currentLetter(), { rate: 0.65 });
  }

  speakSyllables(): void {
    this.speechService.speakSyllables(this.syllabifiedContent());
  }

  stopSpeaking(): void {
    this.speechService.stop();
  }

  onSpaceKey(event: Event): void {
    const target = (event as KeyboardEvent).target as HTMLElement;
    if (target.tagName !== 'BUTTON' && target.tagName !== 'INPUT') {
      event.preventDefault();
      this.generateNext();
    }
  }

  generateNext(): void {
    this.speechService.stop();
    const opts = this.options();
    switch (opts.activeMode) {
      case 'syllable':
        this.currentRawContent.set(generateSyllable(opts));
        break;
      case 'letter':
        this.currentRawContent.set('');
        break;
      case 'handwriting': {
        if (opts.handwritingTarget === 'word') {
          const words: Record<WordCategory, readonly string[]> = {
            number: NUMBERS,
            animal: ANIMALS,
            name: NAMES,
            things: THINGS,
          };
          const availableWords = words[opts.wordCategory].filter(
            (word) =>
              word.replaceAll(' ', '').length <= 8 &&
              (opts.wordLength === 'any' ||
                word.replaceAll(' ', '').length === opts.wordLength),
          );
          const passed = opts.handwritingMilestone ? new Set(this.wordHandwritingPassed()) : null;
          const nextWords = passed
            ? availableWords.filter((word) => !passed.has(word))
            : availableWords;
          if (nextWords.length === 0) return;
          this.currentRawContent.set(randomItem(nextWords));
        } else {
          let letters =
            opts.letterFilter === 'vowels'
              ? this.alphabet.filter((letter) => 'aeiou'.includes(letter))
              : opts.letterFilter === 'consonants'
                ? this.alphabet.filter((letter) => !'aeiou'.includes(letter))
                : this.alphabet;
          if (opts.handwritingMilestone) {
            const passed = new Set(this.handwritingPassed());
            letters = letters.filter((letter) => !passed.has(letter));
            if (letters.length === 0) return;
          }
          this.currentRawContent.set(randomItem(letters));
        }
        // Azzera sempre l'area di scrittura (lettera scritta e modello mostrato),
        // anche quando esce la stessa lettera.
        this.handwritingClear.update((value) => value + 1);
        break;
      }
      case 'color':
        this.currentRawContent.set(randomItem(COLORS));
        break;
      case 'number':
        this.currentRawContent.set(randomItem(NUMBERS));
        break;
      case 'animal':
        this.currentRawContent.set(randomItem(ANIMALS));
        break;
      case 'name':
        this.currentRawContent.set(randomItem(NAMES));
        break;
      case 'things':
        this.currentRawContent.set(randomItem(THINGS));
        break;
      case 'sentence':
        this.currentRawContent.set(randomItem(SENTENCES));
        break;
    }
  }

  isHandwritingLetterPassed(letter: string): boolean {
    return this.handwritingPassed().includes(letter);
  }

  isHandwritingWordPassed(word: string): boolean {
    return this.wordHandwritingPassed().includes(word);
  }

  onHandwritingResult(result: boolean | null): void {
    if (result === null) return;
    const type: FeedbackType = result ? 'success' : 'retry';
    this.handwritingFeedback.set({
      type,
      message: this.feedbackService.getMessage(type),
    });
    if (!result) return;
    if (this.options().handwritingTarget === 'word') {
      const word = this.currentWord().toLowerCase();
      this.wordHandwritingPassed.update((passed) => {
        if (passed.includes(word)) return passed;
        const next = [...passed, word].sort();
        const opts = this.options();
        this.storageService.saveWordHandwritingProgress(
          opts.handwritingStyle,
          opts.wordCategory,
          opts.wordLength,
          next,
        );
        return next;
      });
      return;
    }
    const letter = this.currentLetter().toLowerCase();
    if (!this.alphabet.includes(letter)) return;
    this.handwritingPassed.update((passed) => {
      if (passed.includes(letter)) return passed;
      const next = [...passed, letter].sort();
      this.storageService.saveHandwritingProgress(this.options().handwritingStyle, next);
      return next;
    });
  }

  closeHandwritingFeedback(): void {
    this.handwritingFeedback.set(null);
  }

  nextAfterHandwritingFeedback(): void {
    this.handwritingFeedback.set(null);
    this.generateNext();
  }

  resetHandwritingProgress(): void {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Vuoi azzerare il progresso del traguardo per questo stile?')
    ) {
      return;
    }
    const opts = this.options();
    if (opts.handwritingTarget === 'word') {
      this.storageService.clearWordHandwritingProgress(
        opts.handwritingStyle,
        opts.wordCategory,
        opts.wordLength,
      );
      this.wordHandwritingPassed.set([]);
    } else {
      this.storageService.clearHandwritingProgress(opts.handwritingStyle);
      this.handwritingPassed.set([]);
    }
    this.handwritingFeedback.set(null);
    this.generateNext();
  }

  onOptionsChange(newOptions: SyllableOptions): void {
    const prevMode = this.options().activeMode;
    const previousStyle = this.options().handwritingStyle;
    const previousCategory = this.options().wordCategory;
    const previousLength = this.options().wordLength;
    this.options.set(newOptions);
    this.storageService.saveOptions(newOptions);
    if (newOptions.handwritingStyle !== previousStyle) {
      this.handwritingPassed.set(
        this.storageService.loadHandwritingProgress(newOptions.handwritingStyle),
      );
    }
    if (
      newOptions.handwritingStyle !== previousStyle ||
      newOptions.wordCategory !== previousCategory ||
      newOptions.wordLength !== previousLength
    ) {
      this.wordHandwritingPassed.set(
        this.storageService.loadWordHandwritingProgress(
          newOptions.handwritingStyle,
          newOptions.wordCategory,
          newOptions.wordLength,
        ),
      );
    }
    // In modalità scrittura ogni modifica alle impostazioni laterali azzera
    // l'esercizio: nuova lettera e area di scrittura pulita.
    if (
      newOptions.activeMode !== prevMode ||
      newOptions.activeMode === 'handwriting'
    ) {
      this.generateNext();
    }
  }
}
