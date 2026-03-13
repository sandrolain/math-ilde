import { Injectable } from '@angular/core';
import type { SyllableOptions } from '../types/exercise.types';

const STORAGE_KEY = 'syllables-options';

const DEFAULT_OPTIONS: SyllableOptions = {
  section: 'syllables',
  addS: false,
  twoConsonants: false,
  useDoubles: false,
  showUppercase: false,
  showLowercase: true,
  showCursive: false,
  activeMode: 'syllable',
};

@Injectable({ providedIn: 'root' })
export class SyllableOptionsStorageService {
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
}
