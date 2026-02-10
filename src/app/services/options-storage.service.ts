import { Injectable } from '@angular/core';
import type { StoredOptions, ExerciseOptions, SectionType } from '../types/exercise.types';

const STORAGE_KEY = 'math-ilde-options';

@Injectable({
  providedIn: 'root',
})
export class OptionsStorageService {
  /**
   * Salva le opzioni in localStorage
   */
  saveOptions(options: ExerciseOptions): void {
    const storedOptions: StoredOptions = {
      ...options,
      lastVisited: new Date().toISOString(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedOptions));
    } catch (error) {
      console.error('Errore nel salvataggio delle opzioni:', error);
    }
  }

  /**
   * Carica le opzioni da localStorage
   */
  loadOptions(): StoredOptions | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as StoredOptions;
      }
    } catch (error) {
      console.error('Errore nel caricamento delle opzioni:', error);
    }
    return null;
  }

  /**
   * Ottiene le opzioni di default per una sezione
   */
  getDefaultOptions(section: SectionType): ExerciseOptions {
    switch (section) {
      case 'addition-subtraction':
        return {
          section,
          operationType: 'mixed',
          level: 10,
          numberOfOperands: 2,
          showVisuals: true,
        };
      case 'multiplication':
        return {
          section,
          operationType: 'multiplication',
          level: 10,
          numberOfOperands: 2,
          showVisuals: true,
        };
      case 'division':
        return {
          section,
          operationType: 'division',
          level: 10,
          numberOfOperands: 2,
          showVisuals: true,
        };
      case 'decomposition':
        return {
          section,
          operationType: 'decomposition',
          level: 10,
          numberOfOperands: 2,
          showVisuals: true,
        };
    }
  }

  /**
   * Carica le opzioni per una sezione specifica, con fallback ai default
   */
  loadOptionsForSection(section: SectionType): ExerciseOptions {
    const stored = this.loadOptions();

    if (stored && stored.section === section) {
      // Rimuovi lastVisited per restituire solo ExerciseOptions
      const { lastVisited, ...options } = stored;
      return options;
    }

    return this.getDefaultOptions(section);
  }

  /**
   * Cancella le opzioni salvate
   */
  clearOptions(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Errore nella cancellazione delle opzioni:', error);
    }
  }
}
