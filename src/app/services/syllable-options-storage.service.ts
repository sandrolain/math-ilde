import { Injectable } from '@angular/core';
import type { SyllableOptions, WordCategory, WordLength } from '../types/exercise.types';
import type { Style } from '../calligrafo';

const STORAGE_KEY = 'syllables-options';

const DEFAULT_OPTIONS: SyllableOptions = {
  section: 'syllables',
  addS: false,
  twoConsonants: false,
  useDoubles: false,
  showUppercase: false,
  showLowercase: true,
  showCursive: false,
  letterStyle: 'print',
  letterFilter: 'all',
  handwritingStyle: 'stampatello-maiuscolo',
  handwritingMilestone: false,
  handwritingRelaxed: false,
  handwritingTarget: 'letter',
  wordCategory: 'number',
  wordLength: 'any',
  activeMode: 'syllable',
};

@Injectable({ providedIn: 'root' })
export class SyllableOptionsStorageService {
  private readonly handwritingProgressKey = 'syllables-handwriting-progress';
  private readonly wordHandwritingProgressKey = 'syllables-word-handwriting-progress';

  getDefaultOptions(): SyllableOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: SyllableOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch (error) {
      console.error('Errore nel salvataggio delle opzioni sillabe:', error);
    }
  }

  loadOptions(): SyllableOptions {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        const storedOptions =
          parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
        const options = { ...DEFAULT_OPTIONS, ...storedOptions };
        if (storedOptions['activeMode'] === 'word') {
          options.activeMode = 'handwriting';
          options.handwritingTarget = 'word';
        }
        return options as SyllableOptions;
      }
    } catch (error) {
      console.error('Errore nel caricamento delle opzioni sillabe:', error);
    }
    return this.getDefaultOptions();
  }

  loadHandwritingProgress(style: Style): string[] {
    try {
      const stored = localStorage.getItem(this.handwritingProgressKey);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return [];
      const values = (parsed as Record<string, unknown>)[style];
      return Array.isArray(values)
        ? values.filter((value): value is string => typeof value === 'string')
        : [];
    } catch (error) {
      console.error('Errore nel caricamento dei progressi di scrittura:', error);
      return [];
    }
  }

  saveHandwritingProgress(style: Style, letters: readonly string[]): void {
    try {
      const stored = localStorage.getItem(this.handwritingProgressKey);
      const current: Record<string, unknown> =
        stored && typeof JSON.parse(stored) === 'object' ? JSON.parse(stored) : {};
      current[style] = [...new Set(letters.map((letter) => letter.toLowerCase()))].sort();
      localStorage.setItem(this.handwritingProgressKey, JSON.stringify(current));
    } catch (error) {
      console.error('Errore nel salvataggio dei progressi di scrittura:', error);
    }
  }

  clearHandwritingProgress(style: Style): void {
    this.saveHandwritingProgress(style, []);
  }

  loadWordHandwritingProgress(
    style: Style,
    category: WordCategory,
    length: WordLength,
  ): string[] {
    return this.loadScopedProgress(this.wordHandwritingProgressKey, `${style}:${category}:${length}`);
  }

  saveWordHandwritingProgress(
    style: Style,
    category: WordCategory,
    length: WordLength,
    words: readonly string[],
  ): void {
    this.saveScopedProgress(
      this.wordHandwritingProgressKey,
      `${style}:${category}:${length}`,
      words,
    );
  }

  clearWordHandwritingProgress(style: Style, category: WordCategory, length: WordLength): void {
    this.saveWordHandwritingProgress(style, category, length, []);
  }

  private loadScopedProgress(key: string, scope: string): string[] {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return [];
      const parsed: unknown = JSON.parse(stored);
      if (!parsed || typeof parsed !== 'object') return [];
      const values = (parsed as Record<string, unknown>)[scope];
      return Array.isArray(values)
        ? values.filter((value): value is string => typeof value === 'string')
        : [];
    } catch (error) {
      console.error('Errore nel caricamento dei progressi di scrittura:', error);
      return [];
    }
  }

  private saveScopedProgress(key: string, scope: string, values: readonly string[]): void {
    try {
      const stored = localStorage.getItem(key);
      const parsed: unknown = stored ? JSON.parse(stored) : {};
      const current: Record<string, unknown> =
        parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
      current[scope] = [...new Set(values.map((value) => value.toLowerCase()))].sort();
      localStorage.setItem(key, JSON.stringify(current));
    } catch (error) {
      console.error('Errore nel salvataggio dei progressi di scrittura:', error);
    }
  }
}
