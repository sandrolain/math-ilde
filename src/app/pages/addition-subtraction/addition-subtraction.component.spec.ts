import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdditionSubtractionComponent } from './addition-subtraction.component';
import { MathExerciseService } from '../../services/math-exercise.service';
import { OptionsStorageService } from '../../services/options-storage.service';
import { FeedbackService } from '../../services/feedback.service';
import type { MathOperation } from '../../types/exercise.types';

describe('AdditionSubtractionComponent', () => {
  let component: AdditionSubtractionComponent;
  let fixture: ComponentFixture<AdditionSubtractionComponent>;
  let mathService: MathExerciseService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionSubtractionComponent],
      providers: [provideRouter([]), MathExerciseService, OptionsStorageService, FeedbackService],
    }).compileComponents();

    fixture = TestBed.createComponent(AdditionSubtractionComponent);
    component = fixture.componentInstance;
    mathService = TestBed.inject(MathExerciseService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Answer Verification for Additions', () => {
    it('should correctly verify a right answer for simple addition', () => {
      // Imposta un'operazione specifica
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);

      // Simula input utente
      component.userAnswerStr.set('8');

      // Verifica che isCorrect sia true
      expect(component.isCorrect()).toBe(true);

      // Verifica la risposta
      component.verifyAnswer();

      expect(component.showFeedback()).toBe(true);
      expect(component.feedbackType()).toBe('success');
    });

    it('should correctly verify a wrong answer for simple addition', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('7');

      expect(component.isCorrect()).toBe(false);

      component.verifyAnswer();

      expect(component.showFeedback()).toBe(true);
      expect(component.feedbackType()).toBe('retry');
    });

    it('should verify answer with 3 operands addition', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        operand3: 2,
        result: 10,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('10');
      expect(component.isCorrect()).toBe(true);

      component.userAnswerStr.set('9');
      expect(component.isCorrect()).toBe(false);
    });
  });

  describe('Answer Verification for Subtractions', () => {
    it('should correctly verify a right answer for simple subtraction', () => {
      const operation: MathOperation = {
        operand1: 10,
        operator: '-',
        operand2: 3,
        result: 7,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('7');
      expect(component.isCorrect()).toBe(true);

      component.verifyAnswer();
      expect(component.feedbackType()).toBe('success');
    });

    it('should correctly verify a wrong answer for simple subtraction', () => {
      const operation: MathOperation = {
        operand1: 10,
        operator: '-',
        operand2: 3,
        result: 7,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('8');
      expect(component.isCorrect()).toBe(false);

      component.verifyAnswer();
      expect(component.feedbackType()).toBe('retry');
    });

    it('should verify answer with 3 operands subtraction', () => {
      const operation: MathOperation = {
        operand1: 20,
        operator: '-',
        operand2: 5,
        operand3: 3,
        result: 12,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('12');
      expect(component.isCorrect()).toBe(true);

      component.userAnswerStr.set('15');
      expect(component.isCorrect()).toBe(false);
    });

    it('should handle zero result correctly', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '-',
        operand2: 5,
        result: 0,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('0');
      expect(component.isCorrect()).toBe(true);

      component.verifyAnswer();
      expect(component.feedbackType()).toBe('success');
    });

    it('should never generate negative results', () => {
      // Test con 100 operazioni generate casuali
      for (let i = 0; i < 100; i++) {
        const operation = mathService.generateOperation('subtraction', 100, 2);
        expect(operation.result).toBeGreaterThanOrEqual(0);

        // Verifica che il calcolo sia corretto
        const calculatedResult = operation.operand1 - operation.operand2;
        expect(operation.result).toBe(calculatedResult);
      }
    });
  });

  describe('String to Number Conversion', () => {
    it('should correctly compare string input to number result', () => {
      const operation: MathOperation = {
        operand1: 15,
        operator: '+',
        operand2: 27,
        result: 42,
      };
      component.currentOperation.set(operation);

      // Test con stringa
      component.userAnswerStr.set('42');
      expect(component.isCorrect()).toBe(true);

      // Test con numero convertito
      component.userAnswerStr.set('42');
      expect(component.isCorrect()).toBe(true);
    });

    it('should handle leading zeros in input', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('08');
      expect(component.isCorrect()).toBe(true);

      component.userAnswerStr.set('008');
      expect(component.isCorrect()).toBe(true);
    });

    it('should handle empty string as incorrect', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('');
      expect(component.isCorrect()).toBe(false);
    });

    it('should handle whitespace correctly', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set(' 8 ');
      // Number(' 8 ') === 8, quindi dovrebbe essere corretto
      expect(component.isCorrect()).toBe(true);
    });
  });

  describe('Attempt Counter and Show Answer', () => {
    it('should show answer after 3 wrong attempts', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '+',
        operand2: 3,
        result: 8,
      };
      component.currentOperation.set(operation);
      component.userAnswerStr.set('7');

      // Primo tentativo
      component.verifyAnswer();
      expect(component.attemptCount()).toBe(1);
      expect(component.feedbackType()).toBe('retry');

      // Secondo tentativo
      component.verifyAnswer();
      expect(component.attemptCount()).toBe(2);
      expect(component.feedbackType()).toBe('retry');

      // Terzo tentativo
      component.verifyAnswer();
      expect(component.attemptCount()).toBe(3);
      expect(component.feedbackType()).toBe('show-answer');
    });

    it('should reset attempt counter on next exercise', () => {
      component.attemptCount.set(3);
      component.nextExercise();
      expect(component.attemptCount()).toBe(0);
    });
  });

  describe('Critical Edge Cases', () => {
    it('should handle result 0 correctly', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '-',
        operand2: 5,
        result: 0,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('0');
      expect(Number(component.userAnswerStr())).toBe(0);
      expect(component.currentOperation().result).toBe(0);
      expect(component.isCorrect()).toBe(true);
    });

    it('should reject negative answers for subtraction', () => {
      const operation: MathOperation = {
        operand1: 5,
        operator: '-',
        operand2: 3,
        result: 2,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('-2');
      expect(component.isCorrect()).toBe(false);
    });

    it('should handle large numbers correctly', () => {
      const operation: MathOperation = {
        operand1: 999,
        operator: '+',
        operand2: 1,
        result: 1000,
      };
      component.currentOperation.set(operation);

      component.userAnswerStr.set('1000');
      expect(component.isCorrect()).toBe(true);
    });
  });

  describe('Generated Operations Validation', () => {
    it('should always generate valid additions', () => {
      for (let i = 0; i < 50; i++) {
        component.exerciseOptions.update((opts) => ({
          ...opts,
          operationType: 'addition',
        }));

        const operation = component.generateNewOperation();

        // Verifica che il risultato memorizzato sia corretto
        const expectedResult = operation.operand1 + operation.operand2 + (operation.operand3 || 0);
        expect(operation.result).toBe(expectedResult);
      }
    });

    it('should always generate valid subtractions', () => {
      for (let i = 0; i < 50; i++) {
        component.exerciseOptions.update((opts) => ({
          ...opts,
          operationType: 'subtraction',
        }));

        const operation = component.generateNewOperation();

        // Verifica che il risultato memorizzato sia corretto
        const expectedResult = operation.operand1 - operation.operand2 - (operation.operand3 || 0);
        expect(operation.result).toBe(expectedResult);

        // Verifica che il risultato non sia negativo
        expect(operation.result).toBeGreaterThanOrEqual(0);
      }
    });
  });
});
