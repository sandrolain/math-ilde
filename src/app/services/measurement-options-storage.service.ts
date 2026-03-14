import { Injectable } from '@angular/core';
import type { MeasurementOptions } from '../types/exercise.types';

const STORAGE_KEY = 'measurement-options';

const DEFAULT_OPTIONS: MeasurementOptions = {
  section: 'measurements',
  category: 'length',
  direction: 'big-to-small',
  level: 'easy',
};

@Injectable({ providedIn: 'root' })
export class MeasurementOptionsStorageService {
  getDefaultOptions(): MeasurementOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: MeasurementOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): MeasurementOptions {
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
