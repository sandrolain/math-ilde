import { Injectable } from '@angular/core';
import type { ClockOptions } from '../types/exercise.types';

const STORAGE_KEY = 'clock-options';

const DEFAULT_OPTIONS: ClockOptions = {
  section: 'clock',
  precision: 'hours',
  mode: 'analog-to-digital',
};

@Injectable({ providedIn: 'root' })
export class ClockOptionsStorageService {
  getDefaultOptions(): ClockOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: ClockOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): ClockOptions {
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
