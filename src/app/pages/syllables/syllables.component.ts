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
import { HeaderComponent } from '../../components/header/header.component';
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
  imports: [HeaderComponent, SyllableDisplayComponent, SyllableOptionsControlComponent],
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
          @if (displayUppercase()) {
            <section aria-label="Testo in maiuscolo">
              <app-syllable-display
                [content]="syllabifiedContent()"
                displayCase="upper"
                [cursive]="options().showCursive"
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
                [cursive]="options().showCursive"
                [isSentence]="options().activeMode === 'sentence'"
                [speechActive]="speechService.isSpeaking()"
                [activeSyllableIndex]="speechService.activeSyllableIndex()"
              />
            </section>
          }
        </div>

        @if (speechService.isSupported) {
          <div class="flex flex-wrap justify-center gap-3" aria-label="Comandi vocali">
            <button
              class="btn btn-secondary min-h-12 min-w-40 text-lg"
              type="button"
              (click)="speakContent()"
              [attr.aria-label]="speechService.isSpeaking() ? 'Lettura in corso' : 'Ascolta parola o frase'"
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
        } @else {
          <p class="text-center text-sm text-slate-600" role="status">
            La lettura vocale non è disponibile su questo dispositivo.
          </p>
        }

        <button
          class="btn btn-primary btn-large mt-4 min-w-45 min-h-14 text-xl"
          (click)="generateNext()"
          aria-label="Mostra prossima sillaba o parola"
        >
          <span aria-hidden="true">🔄</span>
          Prossimo
        </button>
      </main>
    </div>
  `,
})
export class SyllablesComponent implements OnInit {
  private readonly syllabificationService = inject(SyllabificationService);
  private readonly storageService = inject(SyllableOptionsStorageService);
  readonly speechService = inject(SpeechService);

  options = signal<SyllableOptions>(this.storageService.loadOptions());
  currentRawContent = signal<string | string[]>('ba');

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
    // Genera nuovo contenuto se cambia la modalità
    if (newOptions.activeMode !== prevMode) {
      this.generateNext();
    }
  }
}
