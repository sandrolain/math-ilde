import { TestBed } from '@angular/core/testing';
import { MathExerciseService } from './math-exercise.service';
import type { MathOperation, DifficultyLevel, OperationType } from '../types/exercise.types';

describe('MathExerciseService', () => {
  let service: MathExerciseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MathExerciseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Addition Operations', () => {
    const levels: DifficultyLevel[] = [10, 50, 100, 1000];

    levels.forEach((level) => {
      it(`should generate correct additions with 2 operands at level ${level}`, () => {
        for (let i = 0; i < 100; i++) {
          const operation = service.generateOperation('addition', level, 2);

          expect(operation.operator).toBe('+');
          expect(operation.operand1).toBeGreaterThanOrEqual(0);
          expect(operation.operand2).toBeGreaterThanOrEqual(0);
          expect(operation.operand3).toBeUndefined();

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 + operation.operand2;
          expect(operation.result).toBe(expectedResult);

          // Verifica che il risultato rispetti i limiti del livello (tranne livello 50)
          if (level !== 50) {
            expect(operation.result).toBeLessThanOrEqual(level);
          }
        }
      });

      it(`should generate correct additions with 3 operands at level ${level}`, () => {
        for (let i = 0; i < 100; i++) {
          const operation = service.generateOperation('addition', level, 3);

          expect(operation.operator).toBe('+');
          expect(operation.operand1).toBeGreaterThanOrEqual(0);
          expect(operation.operand2).toBeGreaterThanOrEqual(0);
          expect(operation.operand3).toBeDefined();
          expect(operation.operand3!).toBeGreaterThanOrEqual(0);

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 + operation.operand2 + operation.operand3!;
          expect(operation.result).toBe(expectedResult);

          // Verifica che il risultato rispetti i limiti del livello (tranne livello 50)
          if (level !== 50) {
            expect(operation.result).toBeLessThanOrEqual(level);
          }
        }
      });
    });
  });

  describe('Subtraction Operations', () => {
    const levels: DifficultyLevel[] = [10, 50, 100, 1000];

    levels.forEach((level) => {
      it(`should generate correct subtractions with 2 operands at level ${level}`, () => {
        for (let i = 0; i < 100; i++) {
          const operation = service.generateOperation('subtraction', level, 2);

          expect(operation.operator).toBe('-');
          expect(operation.operand1).toBeGreaterThanOrEqual(0);
          expect(operation.operand2).toBeGreaterThanOrEqual(0);
          expect(operation.operand3).toBeUndefined();

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 - operation.operand2;
          expect(operation.result).toBe(expectedResult);

          // CRITICAMENTE IMPORTANTE: il risultato NON deve mai essere negativo
          expect(operation.result).toBeGreaterThanOrEqual(0);

          // Verifica che operand1 >= operand2
          expect(operation.operand1).toBeGreaterThanOrEqual(operation.operand2);
        }
      });

      it(`should generate correct subtractions with 3 operands at level ${level}`, () => {
        for (let i = 0; i < 100; i++) {
          const operation = service.generateOperation('subtraction', level, 3);

          expect(operation.operator).toBe('-');
          expect(operation.operand1).toBeGreaterThanOrEqual(0);
          expect(operation.operand2).toBeGreaterThanOrEqual(0);
          expect(operation.operand3).toBeDefined();
          expect(operation.operand3!).toBeGreaterThanOrEqual(0);

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 - operation.operand2 - operation.operand3!;
          expect(operation.result).toBe(expectedResult);

          // CRITICAMENTE IMPORTANTE: il risultato NON deve mai essere negativo
          expect(operation.result).toBeGreaterThanOrEqual(0);

          // Verifica che operand1 >= (operand2 + operand3)
          expect(operation.operand1).toBeGreaterThanOrEqual(
            operation.operand2 + operation.operand3!,
          );
        }
      });
    });
  });

  describe('Multiplication Operations', () => {
    const levels: DifficultyLevel[] = [10, 50, 100, 1000];

    levels.forEach((level) => {
      it(`should generate correct multiplications at level ${level}`, () => {
        for (let i = 0; i < 50; i++) {
          const operation = service.generateOperation('multiplication', level, 2);

          expect(operation.operator).toBe('×');
          expect(operation.operand1).toBeGreaterThanOrEqual(1);
          expect(operation.operand2).toBeGreaterThanOrEqual(1);

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 * operation.operand2;
          expect(operation.result).toBe(expectedResult);
        }
      });
    });
  });

  describe('Division Operations', () => {
    const levels: DifficultyLevel[] = [10, 50, 100, 1000];

    levels.forEach((level) => {
      it(`should generate correct divisions at level ${level} with integer results`, () => {
        for (let i = 0; i < 50; i++) {
          const operation = service.generateOperation('division', level, 2);

          expect(operation.operator).toBe('÷');
          expect(operation.operand1).toBeGreaterThanOrEqual(1);
          expect(operation.operand2).toBeGreaterThanOrEqual(1);

          // Verifica che il risultato sia calcolato correttamente
          const expectedResult = operation.operand1 / operation.operand2;
          expect(operation.result).toBe(expectedResult);

          // Verifica che il risultato sia un intero
          expect(Number.isInteger(operation.result)).toBe(true);

          // Verifica la proprietà inversa: dividendo = divisore × quoziente
          expect(operation.operand1).toBe(operation.operand2 * operation.result);
        }
      });
    });
  });

  describe('Mixed Operations', () => {
    it('should generate either addition or subtraction', () => {
      const operators = new Set<string>();

      for (let i = 0; i < 50; i++) {
        const operation = service.generateOperation('mixed', 10, 2);
        operators.add(operation.operator);
      }

      // Con 50 iterazioni, dovremmo avere entrambi gli operatori
      expect(operators.has('+')).toBe(true);
      expect(operators.has('-')).toBe(true);
    });
  });

  describe('formatOperation', () => {
    it('should format operations with 2 operands correctly', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };

      const formatted = service.formatOperation(operation);
      expect(formatted).toBe('5 + 3');
    });

    it('should format operations with 3 operands correctly', () => {
      const operation: MathOperation = {
        operand1: 10,
        operator: '-',
        operand2: 3,
        operand3: 2,
        result: 5,
      };

      const formatted = service.formatOperation(operation);
      expect(formatted).toBe('10 - 3 - 2');
    });
  });

  describe('Result Calculation Validation', () => {
    it('should have result equal to operand1 + operand2 for additions', () => {
      for (let i = 0; i < 100; i++) {
        const operation = service.generateOperation('addition', 100, 2);
        expect(operation.result).toBe(operation.operand1 + operation.operand2);
      }
    });

    it('should have result equal to operand1 + operand2 + operand3 for 3-operand additions', () => {
      for (let i = 0; i < 100; i++) {
        const operation = service.generateOperation('addition', 100, 3);
        expect(operation.result).toBe(
          operation.operand1 + operation.operand2 + (operation.operand3 || 0),
        );
      }
    });

    it('should have result equal to operand1 - operand2 for subtractions', () => {
      for (let i = 0; i < 100; i++) {
        const operation = service.generateOperation('subtraction', 100, 2);
        const calculatedResult = operation.operand1 - operation.operand2;
        expect(operation.result).toBe(calculatedResult);

        // Log per debug se fallisce
        if (operation.result !== calculatedResult) {
          console.error('Subtraction mismatch:', {
            operation,
            calculatedResult,
            storedResult: operation.result,
          });
        }
      }
    });

    it('should have result equal to operand1 - operand2 - operand3 for 3-operand subtractions', () => {
      for (let i = 0; i < 100; i++) {
        const operation = service.generateOperation('subtraction', 100, 3);
        const calculatedResult =
          operation.operand1 - operation.operand2 - (operation.operand3 || 0);
        expect(operation.result).toBe(calculatedResult);

        // Log per debug se fallisce
        if (operation.result !== calculatedResult) {
          console.error('3-operand subtraction mismatch:', {
            operation,
            calculatedResult,
            storedResult: operation.result,
          });
        }
      }
    });
  });
});
