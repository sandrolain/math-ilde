import { Injectable } from '@angular/core';
import type { SequenceOptions } from '../types/exercise.types';

const STORAGE_KEY = 'sequence-options';

const DEFAULT_OPTIONS: SequenceOptions = {
  section: 'sequences',
  stepType: 'ascending',
  level: 'easy',
  numHoles: 1,
};

@Injectable({ providedIn: 'root' })
export class SequenceOptionsStorageService {
  getDefaultOptions(): SequenceOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: SequenceOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): SequenceOptions {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_OPTIONS, ...JSON.parse(stored) };
      }
    } catch {
      // localStorage non disponibile o dati corrotti
    }
    return this.getDefaultOptions();
  }
}
