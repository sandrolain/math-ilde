import { TestBed } from '@angular/core/testing';
import { ExerciseSessionService } from './exercise-session.service';
import { LearningProgressStorageService } from './learning-progress-storage.service';
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
  let storage: LearningProgressStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LearningProgressStorageService],
    });
    storage = TestBed.inject(LearningProgressStorageService);
    storage.clear();
  });

  function createService(): ExerciseSessionService {
    return TestBed.runInInjectionContext(() => new ExerciseSessionService());
  }

  it('starts session with default target', () => {
    const service = createService();

    const session = service.startSession('addition-subtraction');

    expect(session.targetExercises).toBe(5);
    expect(session.status).toBe('active');
    expect(session.attempts).toEqual([]);
    expect(service.currentSession()).toEqual(session);
  });

  it('rejects invalid target size', () => {
    const service = createService();

    expect(() => service.startSession('addition-subtraction', 0)).toThrow(
      'targetExercises deve essere un intero positivo',
    );
  });

  it('records attempts and counts each solved exercise once', () => {
    const service = createService();
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
    const service = createService();
    service.startSession('addition-subtraction');

    expect(() =>
      service.recordAttempt(createAttempt({ skillId: 'fractions' })),
    ).toThrow('La competenza del tentativo non corrisponde alla sessione');

    service.recordAttempt(createAttempt());
    expect(() => service.recordAttempt(createAttempt())).toThrow('Tentativo duplicato');
  });

  it('completes and resets session', () => {
    const service = createService();
    service.startSession('addition-subtraction');

    const completed = service.completeSession();
    expect(completed.status).toBe('completed');
    expect(completed.completedAt).not.toBeNull();
    expect(() => service.recordAttempt(createAttempt())).toThrow('Nessuna sessione attiva');

    service.resetSession();
    expect(service.currentSession()).toBeNull();
  });

  it('restores active session from local storage', () => {
    const firstService = createService();
    const started = firstService.startSession('addition-subtraction');
    firstService.recordAttempt(createAttempt());

    const restoredService = createService();

    expect(restoredService.currentSession()).toEqual({
      ...started,
      attempts: [createAttempt()],
      completedExercises: 1,
      correctAnswers: 1,
    });
  });

  it('resets one skill without deleting other progress', () => {
    const service = createService();
    service.startSession('addition-subtraction');
    service.recordAttempt(createAttempt());
    service.startSession('fractions');
    service.recordAttempt(createAttempt({ id: 'attempt-2', skillId: 'fractions' }));

    service.resetSkill('fractions');

    const stored = storage.load();
    expect(stored.sessions).toHaveLength(1);
    expect(stored.sessions[0].skillId).toBe('addition-subtraction');
  });

  it('resets all progress and clears storage', () => {
    const service = createService();
    service.startSession('addition-subtraction');
    service.recordAttempt(createAttempt());

    service.resetAllProgress();

    expect(service.currentSession()).toBeNull();
    expect(storage.load().sessions).toEqual([]);
  });
});
