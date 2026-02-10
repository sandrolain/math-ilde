// Math-ilde Type Definitions

export type OperationType =
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'mixed'
  | 'decomposition';
export type OperatorSymbol = '+' | '-' | '×' | '÷';
export type DifficultyLevel = 10 | 50 | 100 | 1000;
export type NumberOfOperands = 2 | 3;
export type SectionType = 'addition-subtraction' | 'multiplication' | 'division' | 'decomposition';
export type FeedbackType = 'success' | 'retry' | 'show-answer';
export type ShapeType = 'circle' | 'square' | 'star';

export interface MathOperation {
  operand1: number;
  operator: OperatorSymbol;
  operand2: number;
  operand3?: number;
  result: number;
}

export interface ExerciseOptions {
  section: SectionType;
  operationType: OperationType;
  level: DifficultyLevel;
  numberOfOperands: NumberOfOperands;
  showVisuals: boolean;
}

export interface StoredOptions extends ExerciseOptions {
  lastVisited: string; // ISO date
}

export interface VisualElement {
  type: ShapeType;
  color: string;
  group: number;
  index: number;
}
