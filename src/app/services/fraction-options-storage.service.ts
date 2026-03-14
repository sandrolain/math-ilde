import { Injectable } from '@angular/core';
import type { FractionOptions } from '../types/exercise.types';

const STORAGE_KEY = 'fraction-options';

const DEFAULT_OPTIONS: FractionOptions = {
  section: 'fractions',
  denominatorGroup: 'halves',
  figureType: 'pie',
  mode: 'figure-to-fraction',
};

@Injectable({ providedIn: 'root' })
export class FractionOptionsStorageService {
  getDefaultOptions(): FractionOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: FractionOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): FractionOptions {
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
