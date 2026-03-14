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
export type SectionType =
  | 'addition-subtraction'
  | 'multiplication'
  | 'division'
  | 'decomposition'
  | 'syllables'
  | 'times-table'
  | 'sequences';

// --- Sequenze Numeriche ---

export type SequenceStepType = 'ascending' | 'descending' | 'multiples';
export type SequenceLevel = 'easy' | 'medium' | 'hard';

export interface SequenceOptions {
  section: 'sequences';
  stepType: SequenceStepType;
  level: SequenceLevel;
  numHoles: 1 | 2;
}

export interface SequenceElement {
  value: number;
  isHole: boolean;
  index: number;
}

export interface SequenceExercise {
  elements: SequenceElement[];
  step: number;
  stepType: SequenceStepType;
  holeIndices: number[];
}

export type TimesTableLength = 10 | 12 | 20;

export interface TimesTableOptions {
  section: 'times-table';
  selectedMultiplier: number | null;
  tableLength: TimesTableLength;
}

export interface TimesTableRow {
  multiplier: number;
  factor: number;
  result: number;
}

export interface TimesTableExercise {
  rows: TimesTableRow[];
  shuffledResults: number[];
}

export type SyllableMode =
  | 'syllable'
  | 'color'
  | 'number'
  | 'animal'
  | 'name'
  | 'things'
  | 'sentence';

export interface SyllableOptions {
  section: 'syllables';
  addS: boolean;
  twoConsonants: boolean;
  useDoubles: boolean;
  showUppercase: boolean;
  showLowercase: boolean;
  showCursive: boolean;
  activeMode: SyllableMode;
}
export type FeedbackType = 'success' | 'retry' | 'show-answer';
export type ShapeType = 'circle' | 'square' | 'star';
export type FruitType =
  | 'apple'
  | 'banana'
  | 'blueberry'
  | 'cherry'
  | 'coconut'
  | 'grape'
  | 'kiwi'
  | 'lemon'
  | 'orange'
  | 'pineapple'
  | 'strawberry'
  | 'watermelon';

export interface MathOperation {
  operand1: number;
  operator: OperatorSymbol;
  operand2: number;
  operand3?: number;
  result: number;
}

export type MathSectionType =
  | 'addition-subtraction'
  | 'multiplication'
  | 'division'
  | 'decomposition';

export interface ExerciseOptions {
  section: MathSectionType;
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
  fruit: FruitType;
  color: string;
  group: number;
  index: number;
}
