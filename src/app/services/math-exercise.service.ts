import { Injectable } from '@angular/core';
import type {
  MathOperation,
  OperationType,
  DifficultyLevel,
  NumberOfOperands,
  OperatorSymbol,
} from '../types/exercise.types';

@Injectable({
  providedIn: 'root',
})
export class MathExerciseService {
  /**
   * Genera un'operazione matematica casuale basata sui parametri specificati
   */
  generateOperation(
    type: OperationType,
    level: DifficultyLevel,
    numberOfOperands: NumberOfOperands,
  ): MathOperation {
    switch (type) {
      case 'addition':
        return this.generateAddition(level, numberOfOperands);
      case 'subtraction':
        return this.generateSubtraction(level, numberOfOperands);
      case 'multiplication':
        return this.generateMultiplication(level);
      case 'division':
        return this.generateDivision(level);
      case 'mixed':
        // Mix casuale tra addizione e sottrazione
        const randomType = Math.random() < 0.5 ? 'addition' : 'subtraction';
        return this.generateOperation(randomType, level, numberOfOperands);
      default:
        return this.generateAddition(level, numberOfOperands);
    }
  }

  /**
   * Genera un'addizione casuale
   */
  private generateAddition(
    level: DifficultyLevel,
    numberOfOperands: NumberOfOperands,
  ): MathOperation {
    if (level === 50) {
      // Livello intermedio: primo addendo 10-99, altri 0-9
      const operand1 = this.randomInt(10, 99);
      const operand2 = this.randomInt(0, 9);

      if (numberOfOperands === 2) {
        return {
          operand1,
          operator: '+',
          operand2,
          result: operand1 + operand2,
        };
      } else {
        const operand3 = this.randomInt(0, 9);
        return {
          operand1,
          operator: '+',
          operand2,
          operand3,
          result: operand1 + operand2 + operand3,
        };
      }
    }

    if (numberOfOperands === 2) {
      // Genera due addendi la cui somma non superi il livello
      const operand1 = this.randomInt(0, level);
      const maxOperand2 = Math.min(level - operand1, level);
      const operand2 = this.randomInt(0, maxOperand2);

      return {
        operand1,
        operator: '+',
        operand2,
        result: operand1 + operand2,
      };
    } else {
      // 3 addendi
      const operand1 = this.randomInt(0, Math.floor(level / 3));
      const operand2 = this.randomInt(0, Math.floor((level - operand1) / 2));
      const maxOperand3 = Math.min(level - operand1 - operand2, level);
      const operand3 = this.randomInt(0, maxOperand3);

      return {
        operand1,
        operator: '+',
        operand2,
        operand3,
        result: operand1 + operand2 + operand3,
      };
    }
  }

  /**
   * Genera una sottrazione casuale (risultato sempre >= 0)
   */
  private generateSubtraction(
    level: DifficultyLevel,
    numberOfOperands: NumberOfOperands,
  ): MathOperation {
    if (level === 50) {
      // Livello intermedio: primo operando 10-99, altri 0-9
      const operand2 = this.randomInt(0, 9);
      const operand3 = numberOfOperands === 3 ? this.randomInt(0, 9) : 0;
      const minOperand1 = operand2 + operand3 + 10; // Almeno 10 per avere 2 cifre
      const operand1 = this.randomInt(minOperand1, 99);

      if (numberOfOperands === 2) {
        return {
          operand1,
          operator: '-',
          operand2,
          result: operand1 - operand2,
        };
      } else {
        return {
          operand1,
          operator: '-',
          operand2,
          operand3,
          result: operand1 - operand2 - operand3,
        };
      }
    }

    if (numberOfOperands === 2) {
      // Genera minuendo e sottraendo dove minuendo >= sottraendo
      const operand1 = this.randomInt(1, level);
      const operand2 = this.randomInt(0, operand1);

      return {
        operand1,
        operator: '-',
        operand2,
        result: operand1 - operand2,
      };
    } else {
      // 3 operandi: a - b - c dove a >= (b + c)
      const operand2 = this.randomInt(0, Math.floor(level / 3));
      const operand3 = this.randomInt(0, Math.floor(level / 3));
      const minOperand1 = operand2 + operand3;
      const operand1 = this.randomInt(minOperand1, level);

      return {
        operand1,
        operator: '-',
        operand2,
        operand3,
        result: operand1 - operand2 - operand3,
      };
    }
  }

  /**
   * Genera una moltiplicazione casuale
   */
  private generateMultiplication(level: DifficultyLevel): MathOperation {
    let factor1: number;
    let factor2: number;

    switch (level) {
      case 10:
        // Livello 1: Tabelline 1-5
        factor1 = this.randomInt(1, 5);
        factor2 = this.randomInt(1, 5);
        break;
      case 50:
        // Livello intermedio: Tabelline 1-7
        factor1 = this.randomInt(1, 7);
        factor2 = this.randomInt(1, 7);
        break;
      case 100:
        // Livello 2: Tabelline 1-10
        factor1 = this.randomInt(1, 10);
        factor2 = this.randomInt(1, 10);
        break;
      case 1000:
        // Livello 3: Numeri più grandi
        factor1 = this.randomInt(1, 20);
        factor2 = this.randomInt(1, 50);
        break;
      default:
        factor1 = this.randomInt(1, 10);
        factor2 = this.randomInt(1, 10);
    }

    return {
      operand1: factor1,
      operator: '×',
      operand2: factor2,
      result: factor1 * factor2,
    };
  }

  /**
   * Genera una divisione casuale (sempre con risultato intero)
   */
  private generateDivision(level: DifficultyLevel): MathOperation {
    let divisor: number;
    let quotient: number;

    switch (level) {
      case 10:
        // Livello 1: divisori 1-5, quozienti 1-10
        divisor = this.randomInt(1, 5);
        quotient = this.randomInt(1, 10);
        break;
      case 50:
        // Livello intermedio: divisori 1-7, quozienti 1-15
        divisor = this.randomInt(1, 7);
        quotient = this.randomInt(1, 15);
        break;
      case 100:
        // Livello 2: divisori 1-10, quozienti 1-20
        divisor = this.randomInt(1, 10);
        quotient = this.randomInt(1, 20);
        break;
      case 1000:
        // Livello 3: divisori 1-20, quozienti 1-50
        divisor = this.randomInt(1, 20);
        quotient = this.randomInt(1, 50);
        break;
      default:
        divisor = this.randomInt(1, 10);
        quotient = this.randomInt(1, 10);
    }

    const dividend = divisor * quotient;

    return {
      operand1: dividend,
      operator: '÷',
      operand2: divisor,
      result: quotient,
    };
  }

  /**
   * Genera un numero intero casuale tra min e max (inclusi)
   */
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Formatta l'operazione come stringa per la visualizzazione
   */
  formatOperation(operation: MathOperation): string {
    if (operation.operand3 !== undefined) {
      return `${operation.operand1} ${operation.operator} ${operation.operand2} ${operation.operator} ${operation.operand3}`;
    }
    return `${operation.operand1} ${operation.operator} ${operation.operand2}`;
  }
}
