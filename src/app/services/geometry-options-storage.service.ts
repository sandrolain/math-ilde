import { Injectable } from '@angular/core';
import type { GeometryOptions } from '../types/exercise.types';

const STORAGE_KEY = 'geometry-options';

const DEFAULT_OPTIONS: GeometryOptions = {
  section: 'geometry',
  mode: 'recognize',
  shapeGroup: 'basic',
};

@Injectable({ providedIn: 'root' })
export class GeometryOptionsStorageService {
  getDefaultOptions(): GeometryOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: GeometryOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
    } catch {
      // localStorage non disponibile
    }
  }

  loadOptions(): GeometryOptions {
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
