import { Injectable } from '@angular/core';
import type { MathOperation } from '../types/exercise.types';

export type HintLevel = 1 | 2 | 3;

@Injectable({
  providedIn: 'root',
})
export class HintService {
  getLevel(attemptCount: number): HintLevel {
    if (attemptCount >= 3) {
      return 3;
    }
    if (attemptCount >= 2) {
      return 2;
    }
    return 1;
  }

  getHint(operation: MathOperation, attemptCount: number): string {
    const level = this.getLevel(attemptCount);

    switch (operation.operator) {
      case '+':
        return this.getAdditionHint(operation, level);
      case '-':
        return this.getSubtractionHint(operation, level);
      case '×':
        return level === 1
          ? 'Osserva i gruppi uguali.'
          : level === 2
            ? 'Conta quanti elementi ci sono in un gruppo, poi conta i gruppi.'
            : 'Somma lo stesso gruppo una volta per ogni gruppo colorato.';
      case '÷':
        return level === 1
          ? 'Osserva come sono distribuiti gli elementi.'
          : level === 2
            ? 'Conta quanti elementi ci sono in ogni gruppo.'
            : 'Verifica che tutti i gruppi abbiano lo stesso numero di elementi.';
    }
  }

  private getAdditionHint(operation: MathOperation, level: HintLevel): string {
    if (level === 1) {
      return 'Osserva i gruppi colorati e conta gli elementi.';
    }
    if (level === 2) {
      return operation.operand3 === undefined
        ? 'Conta il primo gruppo, poi aggiungi il secondo.'
        : 'Somma un gruppo alla volta: prima i primi due, poi il terzo.';
    }
    return 'Parti dal primo numero e fai tanti passi avanti quanti ne indica il gruppo successivo.';
  }

  private getSubtractionHint(operation: MathOperation, level: HintLevel): string {
    if (level === 1) {
      return 'Osserva gli elementi barrati e quelli che restano.';
    }
    if (level === 2) {
      return 'Conta tutti gli elementi, togli quelli barrati e guarda quanti ne restano.';
    }
    return `Parti da ${operation.operand1} e fai passi indietro per ogni elemento barrato.`;
  }
}
