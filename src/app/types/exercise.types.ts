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
  | 'sequences'
  | 'fractions'
  | 'clock';

// --- Lettura dell'Orologio ---

export type ClockPrecision = 'hours' | 'half-quarters' | 'five-minutes';
export type ClockMode = 'analog-to-digital' | 'digital-to-analog';

export interface ClockOptions {
  section: 'clock';
  precision: ClockPrecision;
  mode: ClockMode;
}

export interface ClockExercise {
  hours: number; // 1–12
  minutes: number; // 0, 30  |  0, 15, 30, 45  |  0, 5, 10, …, 55
  /** Per digital-to-analog: 4 scelte, ciascuna come { hours, minutes } */
  choices: Array<{ hours: number; minutes: number }>;
  correctChoiceIndex: number;
}

// --- Frazioni Visive ---

export type FractionDenominatorGroup = 'halves' | 'thirds' | 'mixed';
export type FractionFigureType = 'pie' | 'bar' | 'objects';
export type FractionMode = 'figure-to-fraction' | 'fraction-to-figure';

export interface FractionOptions {
  section: 'fractions';
  denominatorGroup: FractionDenominatorGroup;
  figureType: FractionFigureType;
  mode: FractionMode;
}

export interface FractionExercise {
  numerator: number;
  denominator: number;
  figureType: FractionFigureType;
  mode: FractionMode;
  /** Opzioni multiple choice per modalità fraction-to-figure (indice corretto incluso) */
  choices: Array<{ numerator: number; denominator: number }>;
  correctChoiceIndex: number;
}

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
