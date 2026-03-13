import { Injectable } from '@angular/core';
import type { TimesTableOptions } from '../types/exercise.types';

const STORAGE_KEY = 'times-table-options';

const DEFAULT_OPTIONS: TimesTableOptions = {
  section: 'times-table',
  selectedMultiplier: null,
  tableLength: 10,
};

@Injectable({ providedIn: 'root' })
export class TimesTableOptionsStorageService {
  getDefaultOptions(): TimesTableOptions {
    return { ...DEFAULT_OPTIONS };
  }

  saveOptions(options: TimesTableOptions): void {
    // Non persistiamo selectedMultiplier: si riparte sempre dalla schermata di scelta
    const toStore: TimesTableOptions = { ...options, selectedMultiplier: null };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch (error) {
      console.error('Errore nel salvataggio delle opzioni tabelline:', error);
    }
  }

  loadOptions(): TimesTableOptions {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_OPTIONS, ...JSON.parse(stored), selectedMultiplier: null };
      }
    } catch (error) {
      console.error('Errore nel caricamento delle opzioni tabelline:', error);
    }
    return this.getDefaultOptions();
  }
}
