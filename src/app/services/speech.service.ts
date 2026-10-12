import { Injectable, computed, signal } from '@angular/core';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface SpeechSettings {
  voiceName: string;
  rate: number;
  pitch: number;
}

const SPEECH_SETTINGS_KEY = 'math-ilde-speech-settings';
const SYLLABLE_PAUSE_MS = 750;
const DEFAULT_SPEECH_SETTINGS: SpeechSettings = {
  voiceName: '',
  rate: 0.85,
  pitch: 1,
};

@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly isSpeaking = signal(false);
  readonly activeText = signal<string | null>(null);
  readonly activeSyllableIndex = signal<number | null>(null);
  readonly isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  readonly settings = signal<SpeechSettings>(this.loadSettings());
  readonly voices = signal<SpeechSynthesisVoice[]>([]);
  readonly italianVoices = computed(() =>
    this.voices().filter((voice) => voice.lang.toLowerCase().startsWith('it')),
  );

  private readonly synthesis =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
  private syllableQueue: string[] = [];
  private syllableIndex = 0;
  private syllablePauseTimer: ReturnType<typeof setTimeout> | null = null;
  private speechRun = 0;

  constructor() {
    this.refreshVoices();
    if (typeof window !== 'undefined' && this.synthesis) {
      window.speechSynthesis.addEventListener('voiceschanged', () => this.refreshVoices());
    }
  }

  setSettings(changes: Partial<SpeechSettings>): void {
    const settings = { ...this.settings(), ...changes };
    this.settings.set(settings);
    localStorage.setItem(SPEECH_SETTINGS_KEY, JSON.stringify(settings));
  }

  testVoice(): void {
    this.speak('Ciao! Questa è la mia voce.', { rate: this.settings().rate });
  }

  speak(text: string, options: SpeechOptions = {}): void {
    const normalizedText = text.trim();
    if (!this.synthesis || !normalizedText) {
      return;
    }

    this.stop();
    const run = this.speechRun;

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'it-IT';
    utterance.voice =
      this.voices().find(
        (voice) =>
          voice.voiceURI === this.settings().voiceName ||
          voice.name === this.settings().voiceName,
      ) ?? null;
    utterance.rate = options.rate ?? this.settings().rate;
    utterance.pitch = options.pitch ?? this.settings().pitch;
    utterance.volume = options.volume ?? 1;
    utterance.onstart = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(true);
        this.activeText.set(normalizedText);
      }
    };
    utterance.onend = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(false);
        this.activeText.set(null);
        this.activeSyllableIndex.set(null);
      }
    };
    utterance.onerror = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(false);
        this.activeText.set(null);
        this.activeSyllableIndex.set(null);
      }
    };

    this.synthesis.speak(utterance);
  }

  speakSyllables(syllables: string[][]): void {
    if (!this.synthesis) {
      return;
    }

    this.stop();
    this.syllableQueue = syllables.flat().map((syllable) => syllable.trim()).filter(Boolean);
    this.syllableIndex = 0;

    if (this.syllableQueue.length > 0) {
      this.isSpeaking.set(true);
      this.speakNextSyllable(this.speechRun);
    }
  }

  stop(): void {
    this.speechRun++;
    this.synthesis?.cancel();
    if (this.syllablePauseTimer !== null) {
      clearTimeout(this.syllablePauseTimer);
      this.syllablePauseTimer = null;
    }
    this.syllableQueue = [];
    this.syllableIndex = 0;
    this.activeSyllableIndex.set(null);
    this.activeText.set(null);
    this.isSpeaking.set(false);
  }

  private speakNextSyllable(run: number): void {
    if (!this.synthesis || run !== this.speechRun) {
      return;
    }

    const syllable = this.syllableQueue[this.syllableIndex];
    if (!syllable) {
      this.isSpeaking.set(false);
      this.activeSyllableIndex.set(null);
      return;
    }

    this.activeSyllableIndex.set(this.syllableIndex);
    const utterance = new SpeechSynthesisUtterance(syllable);
    utterance.lang = 'it-IT';
    utterance.voice =
      this.voices().find(
        (voice) =>
          voice.voiceURI === this.settings().voiceName ||
          voice.name === this.settings().voiceName,
      ) ?? null;
    utterance.rate = this.settings().rate;
    utterance.pitch = this.settings().pitch;
    utterance.onend = () => {
      if (run !== this.speechRun) {
        return;
      }

      this.syllableIndex++;
      if (this.syllableIndex >= this.syllableQueue.length) {
        this.isSpeaking.set(false);
        this.activeSyllableIndex.set(null);
        return;
      }

      this.syllablePauseTimer = setTimeout(() => {
        this.syllablePauseTimer = null;
        this.speakNextSyllable(run);
      }, SYLLABLE_PAUSE_MS);
    };
    utterance.onerror = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(false);
        this.activeSyllableIndex.set(null);
      }
    };

    this.synthesis.speak(utterance);
  }

  private refreshVoices(): void {
    const voices = this.synthesis?.getVoices() ?? [];
    this.voices.set(voices);

    const selectedVoice = voices.find(
      (voice) =>
        voice.voiceURI === this.settings().voiceName ||
        voice.name === this.settings().voiceName,
    );
    if (selectedVoice && selectedVoice.voiceURI !== this.settings().voiceName) {
      this.setSettings({ voiceName: selectedVoice.voiceURI });
    }
  }

  private loadSettings(): SpeechSettings {
    try {
      const stored = localStorage.getItem(SPEECH_SETTINGS_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          const candidate = parsed as Partial<SpeechSettings>;
          if (
            typeof candidate.voiceName === 'string' &&
            typeof candidate.rate === 'number' &&
            typeof candidate.pitch === 'number'
          ) {
            return { ...DEFAULT_SPEECH_SETTINGS, ...candidate };
          }
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento delle impostazioni vocali:', error);
    }
    return DEFAULT_SPEECH_SETTINGS;
  }
}
