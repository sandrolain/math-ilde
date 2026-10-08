import { Injectable } from '@angular/core';
import type { DifficultyLevel } from '../types/exercise.types';
import type { ExerciseAttempt } from '../types/learning.types';

export type DifficultyDirection = 'increase' | 'decrease' | 'steady';

export interface DifficultyRecommendation {
  level: DifficultyLevel;
  direction: DifficultyDirection;
  reason: string;
}

const LEVELS: DifficultyLevel[] = [10, 50, 100, 1000];

@Injectable({
  providedIn: 'root',
})
export class AdaptiveDifficultyService {
  recommend(level: DifficultyLevel, attempts: ExerciseAttempt[]): DifficultyRecommendation {
    const recentAttempts = attempts.slice(-3);
    const recentErrors = recentAttempts.filter((attempt) => !attempt.correct).length;
    const currentIndex = LEVELS.indexOf(level);

    if (recentAttempts.length >= 3 && recentErrors === 0 && currentIndex < LEVELS.length - 1) {
      return {
        level: LEVELS[currentIndex + 1],
        direction: 'increase',
        reason: 'Tre risposte corrette consecutive: prova un livello un po’ più sfidante.',
      };
    }

    if (recentErrors >= 2 && currentIndex > 0) {
      return {
        level: LEVELS[currentIndex - 1],
        direction: 'decrease',
        reason: 'Due errori recenti: ripartiamo da un livello più concreto.',
      };
    }

    return {
      level,
      direction: 'steady',
      reason: 'Continua ad allenarti a questo livello.',
    };
  }
}
