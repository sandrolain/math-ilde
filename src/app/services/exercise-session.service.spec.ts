import { ExerciseSessionService } from './exercise-session.service';
import type { ExerciseAttempt } from '../types/learning.types';

function createAttempt(overrides: Partial<ExerciseAttempt> = {}): ExerciseAttempt {
  return {
    id: 'attempt-1',
    skillId: 'addition-subtraction',
    exerciseId: 'exercise-1',
    answer: '5',
    correct: true,
    hintsUsed: 0,
    startedAt: 1,
    completedAt: 2,
    ...overrides,
  };
}

describe('ExerciseSessionService', () => {
  it('starts session with default target', () => {
    const service = new ExerciseSessionService();

    const session = service.startSession('addition-subtraction');

    expect(session.targetExercises).toBe(5);
    expect(session.status).toBe('active');
    expect(session.attempts).toEqual([]);
    expect(service.currentSession()).toEqual(session);
  });

  it('rejects invalid target size', () => {
    const service = new ExerciseSessionService();

    expect(() => service.startSession('addition-subtraction', 0)).toThrow(
      'targetExercises deve essere un intero positivo',
    );
  });

  it('records attempts and counts each solved exercise once', () => {
    const service = new ExerciseSessionService();
    service.startSession('addition-subtraction');

    service.recordAttempt(createAttempt({ correct: false }));
    const session = service.recordAttempt(
      createAttempt({
        id: 'attempt-2',
        correct: true,
      }),
    );

    expect(session.attempts).toHaveLength(2);
    expect(session.completedExercises).toBe(1);
    expect(session.correctAnswers).toBe(1);
  });

  it('rejects attempts from another skill or duplicate ids', () => {
    const service = new ExerciseSessionService();
    service.startSession('addition-subtraction');

    expect(() =>
      service.recordAttempt(createAttempt({ skillId: 'fractions' })),
    ).toThrow('La competenza del tentativo non corrisponde alla sessione');

    service.recordAttempt(createAttempt());
    expect(() => service.recordAttempt(createAttempt())).toThrow('Tentativo duplicato');
  });

  it('completes and resets session', () => {
    const service = new ExerciseSessionService();
    service.startSession('addition-subtraction');

    const completed = service.completeSession();
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).not.toBeNull();
    expect(() => service.recordAttempt(createAttempt())).toThrow('Nessuna sessione attiva');

    service.resetSession();
    expect(service.currentSession()).toBeNull();
  });
});
