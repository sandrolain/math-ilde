import { Injectable, inject, signal } from '@angular/core';
import type {
  ExerciseAttempt,
  ExerciseSession,
  LearningProgressState,
  LearningSkillId,
} from '../types/learning.types';
import { LearningProgressStorageService } from './learning-progress-storage.service';

@Injectable({
  providedIn: 'root',
})
export class ExerciseSessionService {
  private readonly storage = inject(LearningProgressStorageService);
  private progressState: LearningProgressState = this.storage.load();
  readonly currentSession = signal<ExerciseSession | null>(this.getActiveSession());

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

    this.saveSession(session);
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

    this.saveSession(updatedSession);
    return updatedSession;
  }

  completeSession(): ExerciseSession {
    const session = this.requireActiveSession();
    const completedSession: ExerciseSession = {
      ...session,
      completedAt: Date.now(),
      status: 'completed',
    };

    this.saveSession(completedSession, null);
    return completedSession;
  }

  resetSession(): void {
    this.currentSession.set(null);
    this.progressState = {
      ...this.progressState,
      activeSessionId: null,
      updatedAt: Date.now(),
    };
    this.storage.save(this.progressState);
  }

  resetSkill(skillId: LearningSkillId): void {
    this.progressState = {
      ...this.progressState,
      sessions: this.progressState.sessions.filter((session) => session.skillId !== skillId),
      activeSessionId:
        this.currentSession()?.skillId === skillId ? null : this.progressState.activeSessionId,
      updatedAt: Date.now(),
    };
    if (this.currentSession()?.skillId === skillId) {
      this.currentSession.set(null);
    }
    this.storage.save(this.progressState);
  }

  resetAllProgress(): void {
    this.progressState = {
      version: 1,
      sessions: [],
      activeSessionId: null,
      updatedAt: Date.now(),
    };
    this.currentSession.set(null);
    this.storage.clear();
  }

  private requireActiveSession(): ExerciseSession {
    const session = this.currentSession();
    if (!session || session.status !== 'active') {
      throw new Error('Nessuna sessione attiva');
    }

    return session;
  }

  private getActiveSession(): ExerciseSession | null {
    const activeSession = this.progressState.sessions.find(
      (session) => session.id === this.progressState.activeSessionId,
    );
    return activeSession?.status === 'active' ? activeSession : null;
  }

  private saveSession(session: ExerciseSession, activeSessionId: string | null = session.id): void {
    const sessions = this.progressState.sessions.filter(
      (storedSession) => storedSession.id !== session.id,
    );
    this.progressState = {
      ...this.progressState,
      sessions: [...sessions, session],
      activeSessionId,
      updatedAt: Date.now(),
    };
    this.currentSession.set(session.status === 'active' ? session : null);
    this.storage.save(this.progressState);
  }
}
