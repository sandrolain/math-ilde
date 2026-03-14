import { Injectable } from '@angular/core';
import type { ComparisonOptions } from '../types/exercise.types';

const STORAGE_KEY = 'comparison-options';

const DEFAULT_OPTIONS: ComparisonOptions = {
  section: 'comparison',
  mode: 'symbol',
  level: 10,
  showBars: true,
};

@Injectable({ providedIn: 'root' })
export class ComparisonOptionsStorageService {
  getDefaultOptions(): ComparisonOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: ComparisonOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): ComparisonOptions {
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
