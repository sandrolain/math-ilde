import { AdaptiveDifficultyService } from './adaptive-difficulty.service';
import type { ExerciseAttempt } from '../types/learning.types';

function attempt(correct: boolean, id: string): ExerciseAttempt {
  return {
    id,
    skillId: 'addition-subtraction',
    exerciseId: id,
    answer: correct ? '5' : '4',
    correct,
    hintsUsed: 0,
    startedAt: 1,
    completedAt: 2,
  };
}

describe('AdaptiveDifficultyService', () => {
  it('increases level after three consecutive correct answers', () => {
    const service = new AdaptiveDifficultyService();

    const recommendation = service.recommend(10, [
      attempt(true, '1'),
      attempt(true, '2'),
      attempt(true, '3'),
    ]);

    expect(recommendation.level).toBe(50);
    expect(recommendation.direction).toBe('increase');
  });

  it('decreases level after two recent errors', () => {
    const service = new AdaptiveDifficultyService();

    const recommendation = service.recommend(100, [
      attempt(true, '1'),
      attempt(false, '2'),
      attempt(false, '3'),
    ]);

    expect(recommendation.level).toBe(50);
    expect(recommendation.direction).toBe('decrease');
  });

  it('keeps level when no adjustment is needed', () => {
    const service = new AdaptiveDifficultyService();

    expect(service.recommend(10, []).direction).toBe('steady');
  });
});
