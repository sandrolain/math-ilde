import { Injectable, signal } from '@angular/core';

export interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
}

const SYLLABLE_PAUSE_MS = 750;

@Injectable({ providedIn: 'root' })
export class SpeechService {
  readonly isSpeaking = signal(false);
  readonly activeSyllableIndex = signal<number | null>(null);
  readonly isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  private readonly synthesis =
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null;
  private syllableQueue: string[] = [];
  private syllableIndex = 0;
  private syllablePauseTimer: ReturnType<typeof setTimeout> | null = null;
  private speechRun = 0;

  speak(text: string, options: SpeechOptions = {}): void {
    const normalizedText = text.trim();
    if (!this.synthesis || !normalizedText) {
      return;
    }

    this.stop();
    const run = this.speechRun;

    const utterance = new SpeechSynthesisUtterance(normalizedText);
    utterance.lang = 'it-IT';
    utterance.rate = options.rate ?? 0.85;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;
    utterance.onstart = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(true);
      }
    };
    utterance.onend = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(false);
        this.activeSyllableIndex.set(null);
      }
    };
    utterance.onerror = () => {
      if (run === this.speechRun) {
        this.isSpeaking.set(false);
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
    utterance.rate = 0.65;
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
}
