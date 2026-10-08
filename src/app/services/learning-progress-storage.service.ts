import { Injectable } from '@angular/core';
import type { ExerciseSession, LearningProgressState } from '../types/learning.types';

const STORAGE_KEY = 'math-ilde-learning-progress';
const CURRENT_VERSION = 1 as const;

function emptyState(): LearningProgressState {
  return {
    version: CURRENT_VERSION,
    sessions: [],
    activeSessionId: null,
    updatedAt: Date.now(),
  };
}

function isExerciseSession(value: unknown): value is ExerciseSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as Partial<ExerciseSession>;
  return (
    typeof session.id === 'string' &&
    typeof session.skillId === 'string' &&
    Number.isInteger(session.targetExercises) &&
    Array.isArray(session.attempts) &&
    Number.isInteger(session.completedExercises) &&
    Number.isInteger(session.correctAnswers) &&
    typeof session.startedAt === 'number' &&
    (session.completedAt === null || typeof session.completedAt === 'number') &&
    (session.status === 'active' || session.status === 'completed')
  );
}

function isLearningProgressState(value: unknown): value is LearningProgressState {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const state = value as Partial<LearningProgressState>;
  return (
    state.version === CURRENT_VERSION &&
    Array.isArray(state.sessions) &&
    state.sessions.every(isExerciseSession) &&
    (state.activeSessionId === null || typeof state.activeSessionId === 'string') &&
    typeof state.updatedAt === 'number'
  );
}

@Injectable({
  providedIn: 'root',
})
export class LearningProgressStorageService {
  load(): LearningProgressState {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return emptyState();
      }

      const parsed: unknown = JSON.parse(stored);
      if (isLearningProgressState(parsed)) {
        return parsed;
      }

      console.error('Formato progressi Math-ilde non valido: dati ignorati');
    } catch (error) {
      console.error('Errore nel caricamento dei progressi Math-ilde:', error);
    }

    return emptyState();
  }

  save(state: LearningProgressState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Errore nel salvataggio dei progressi Math-ilde:', error);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Errore nella cancellazione dei progressi Math-ilde:', error);
    }
  }
}
