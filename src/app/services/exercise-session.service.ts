import { Injectable, signal } from '@angular/core';
import type {
  ExerciseAttempt,
  ExerciseSession,
  LearningSkillId,
} from '../types/learning.types';

@Injectable({
  providedIn: 'root',
})
export class ExerciseSessionService {
  readonly currentSession = signal<ExerciseSession | null>(null);

  private sessionSequence = 0;

  startSession(skillId: LearningSkillId, targetExercises = 5): ExerciseSession {
    if (!Number.isInteger(targetExercises) || targetExercises < 1) {
      throw new RangeError('targetExercises deve essere un intero positivo');
    }

    const session: ExerciseSession = {
      id: `session-${++this.sessionSequence}`,
      skillId,
      targetExercises,
      attempts: [],
      completedExercises: 0,
      correctAnswers: 0,
      startedAt: Date.now(),
      completedAt: null,
      status: 'active',
    };

    this.currentSession.set(session);
    return session;
  }

  recordAttempt(attempt: ExerciseAttempt): ExerciseSession {
    const session = this.requireActiveSession();

    if (attempt.skillId !== session.skillId) {
      throw new Error('La competenza del tentativo non corrisponde alla sessione');
    }

    if (session.attempts.some(({ id }) => id === attempt.id)) {
      throw new Error(`Tentativo duplicato: ${attempt.id}`);
    }

    const attempts = [...session.attempts, attempt];
    const completedExerciseIds = new Set(
      attempts.filter(({ correct }) => correct).map(({ exerciseId }) => exerciseId),
    );
    const updatedSession: ExerciseSession = {
      ...session,
      attempts,
      completedExercises: completedExerciseIds.size,
      correctAnswers: attempts.filter(({ correct }) => correct).length,
    };

    this.currentSession.set(updatedSession);
    return updatedSession;
  }

  completeSession(): ExerciseSession {
    const session = this.requireActiveSession();
    const completedSession: ExerciseSession = {
      ...session,
      completedAt: Date.now(),
      status: 'completed',
    };

    this.currentSession.set(completedSession);
    return completedSession;
  }

  resetSession(): void {
    this.currentSession.set(null);
  }

  private requireActiveSession(): ExerciseSession {
    const session = this.currentSession();
    if (!session || session.status !== 'active') {
      throw new Error('Nessuna sessione attiva');
    }

    return session;
  }
}
