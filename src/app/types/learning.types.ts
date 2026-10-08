import type { DifficultyLevel, SectionType } from './exercise.types';

export type LearningSkillId = SectionType;

export type ExerciseSessionStatus = 'active' | 'completed';

export interface ExerciseDescriptor {
  id: string;
  skillId: LearningSkillId;
  prompt: string;
  difficulty?: DifficultyLevel;
}

export interface ExerciseAttempt {
  id: string;
  skillId: LearningSkillId;
  exerciseId: string;
  answer: string;
  correct: boolean;
  hintsUsed: number;
  startedAt: number;
  completedAt: number;
}

export interface ExerciseSession {
  id: string;
  skillId: LearningSkillId;
  targetExercises: number;
  attempts: ExerciseAttempt[];
  completedExercises: number;
  correctAnswers: number;
  startedAt: number;
  completedAt: number | null;
  status: ExerciseSessionStatus;
}
