import { Injectable, signal } from '@angular/core';

export interface LearningPreferences {
  reducedMotion: boolean;
  soundEnabled: boolean;
}

const STORAGE_KEY = 'math-ilde-learning-preferences';
const DEFAULT_PREFERENCES: LearningPreferences = {
  reducedMotion: false,
  soundEnabled: true,
};

@Injectable({ providedIn: 'root' })
export class LearningPreferencesService {
  readonly preferences = signal<LearningPreferences>(this.load());

  constructor() {
    this.applyMotionPreference(this.preferences().reducedMotion);
  }

  update(changes: Partial<LearningPreferences>): void {
    const preferences = { ...this.preferences(), ...changes };
    this.preferences.set(preferences);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    this.applyMotionPreference(preferences.reducedMotion);
  }

  private load(): LearningPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_PREFERENCES;
      const parsed: unknown = JSON.parse(stored);
      if (
        parsed &&
        typeof parsed === 'object' &&
        typeof (parsed as Partial<LearningPreferences>).reducedMotion === 'boolean' &&
        typeof (parsed as Partial<LearningPreferences>).soundEnabled === 'boolean'
      ) {
        return parsed as LearningPreferences;
      }
    } catch (error) {
      console.error('Errore nel caricamento delle preferenze Math-ilde:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  private applyMotionPreference(reducedMotion: boolean): void {
    document.documentElement.classList.toggle('reduced-motion', reducedMotion);
  }
}
