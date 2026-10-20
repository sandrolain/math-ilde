import { Injectable } from '@angular/core';
import type { SyllableOptions } from '../types/exercise.types';
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
  activeMode: 'syllable',
};

@Injectable({ providedIn: 'root' })
export class SyllableOptionsStorageService {
  private readonly handwritingProgressKey = 'syllables-handwriting-progress';

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
        return { ...DEFAULT_OPTIONS, ...JSON.parse(stored) } as SyllableOptions;
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
}
