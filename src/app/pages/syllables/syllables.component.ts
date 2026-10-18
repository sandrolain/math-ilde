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
import type { SyllableOptions } from '../../types/exercise.types';
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
              [target]="currentLetter()"
              [writingStyle]="options().handwritingStyle"
              [clearToken]="handwritingClear()"
            >
              <div writing-controls-top class="flex flex-col gap-3">
                <button
                  class="btn btn-primary w-full h-14 min-h-14 whitespace-nowrap text-lg"
                  type="button"
                  (click)="generateNext()"
                  aria-label="Mostra una nuova lettera da scrivere"
                >
                  <span aria-hidden="true">🔄</span>
                  Nuova lettera
                </button>
                @if (speechService.isSupported) {
                  <button
                    class="btn btn-secondary w-full h-14 min-h-14 whitespace-nowrap text-lg"
                    type="button"
                    (click)="speakCurrentLetter()"
                    [attr.aria-label]="
                      speechService.isSpeaking() ? 'Lettura in corso' : 'Ascolta la lettera'
                    "
                  >
                    <span aria-hidden="true">🔊</span>
                    {{ speechService.isSpeaking() ? 'In ascolto...' : 'Ascolta' }}
                  </button>
                }
              </div>
            </app-handwriting-canvas>
          }

          @if (options().activeMode !== 'letter' && options().activeMode !== 'handwriting') {
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
        } @else if (options().activeMode !== 'letter' && options().activeMode !== 'handwriting') {
          <p class="text-center text-sm text-slate-600" role="status">
            La lettura vocale non è disponibile su questo dispositivo.
          </p>
        }

        @if (options().activeMode !== 'letter' && options().activeMode !== 'handwriting') {
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
})
export class SyllablesComponent implements OnInit {
  private readonly syllabificationService = inject(SyllabificationService);
  private readonly storageService = inject(SyllableOptionsStorageService);
  readonly speechService = inject(SpeechService);
  readonly alphabet = ALPHABET;

  options = signal<SyllableOptions>(this.storageService.loadOptions());
  currentRawContent = signal<string | string[]>('ba');
  /** Incrementato a ogni "Nuova lettera" per azzerare l'area di scrittura. */
  handwritingClear = signal(0);
  currentLetter = computed<string>(() => {
    const content = this.currentRawContent();
    return typeof content === 'string' ? content : 'a';
  });
  displayedLetters = computed(() => {
    const filter = this.options().letterFilter;
    if (filter === 'vowels') return this.alphabet.filter((letter) => 'aeiou'.includes(letter));
    if (filter === 'consonants') return this.alphabet.filter((letter) => !'aeiou'.includes(letter));
    return this.alphabet;
  });

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
        const letters =
          opts.letterFilter === 'vowels'
            ? this.alphabet.filter((letter) => 'aeiou'.includes(letter))
            : opts.letterFilter === 'consonants'
              ? this.alphabet.filter((letter) => !'aeiou'.includes(letter))
              : this.alphabet;
        const letter = randomItem(letters);
        this.currentRawContent.set(letter);
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

  onOptionsChange(newOptions: SyllableOptions): void {
    const prevMode = this.options().activeMode;
    this.options.set(newOptions);
    this.storageService.saveOptions(newOptions);
    // In modalità scrittura ogni modifica alle impostazioni laterali azzera
    // l'esercizio: nuova lettera e area di scrittura pulita.
    if (newOptions.activeMode !== prevMode || newOptions.activeMode === 'handwriting') {
      this.generateNext();
    }
  }
}
