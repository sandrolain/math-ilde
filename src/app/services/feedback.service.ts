import { Injectable } from '@angular/core';
import type { FeedbackType } from '../types/exercise.types';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private readonly successMessages = [
    'Fantastico!',
    'Perfetto!',
    'Complimenti!',
    'Ottimo lavoro!',
    'Eccellente!',
    'Magnifico!',
  ];

  private readonly retryMessages = [
    'Ritenta!',
    'Prova ancora!',
    'Quasi! Riprova!',
    'Ci sei quasi!',
    'Non mollare!',
  ];

  /**
   * Ottiene un messaggio casuale in base al tipo di feedback
   */
  getMessage(type: FeedbackType, correctAnswer?: number): string {
    switch (type) {
      case 'success':
        return this.getRandomMessage(this.successMessages);
      case 'retry':
        return this.getRandomMessage(this.retryMessages);
      case 'show-answer':
        return `La risposta è ${correctAnswer}. Proviamo con un altro esercizio!`;
      default:
        return '';
    }
  }

  /**
   * Seleziona un messaggio casuale da un array
   */
  private getRandomMessage(messages: string[]): string {
    const randomIndex = Math.floor(Math.random() * messages.length);
    return messages[randomIndex];
  }
}
