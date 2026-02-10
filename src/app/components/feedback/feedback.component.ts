import { Component, input, output, viewChild, ElementRef, effect } from '@angular/core';
import type { FeedbackType } from '../../types/exercise.types';

@Component({
  selector: 'app-feedback',
  imports: [],
  template: `
    @if (show()) {
      <div class="overlay" (click)="$event.stopPropagation()">
        <div [class]="getModalClasses()" role="alert" aria-live="polite">
          @if (type() === 'success') {
            <div class="text-6xl mb-4 text-center">🎉</div>
          }
          @if (type() === 'retry') {
            <div class="text-6xl mb-4 text-center">💪</div>
          }
          @if (type() === 'show-answer') {
            <div class="text-6xl mb-4 text-center">💡</div>
          }

          <div class="feedback-message">
            {{ message() }}
          </div>

          <div class="text-center mt-6">
            <button
              #continueBtn
              (click)="onContinue()"
              class="btn btn-lg"
              [class.btn-success]="type() !== 'retry'"
              [class.btn-primary]="type() === 'retry'"
              [attr.aria-label]="getButtonLabel()"
            >
              {{ getButtonText() }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FeedbackComponent {
  show = input.required<boolean>();
  type = input.required<FeedbackType>();
  message = input.required<string>();
  close = output<void>();
  next = output<void>();

  continueBtn = viewChild<ElementRef<HTMLButtonElement>>('continueBtn');

  constructor() {
    effect(() => {
      if (this.show()) {
        setTimeout(() => {
          this.continueBtn()?.nativeElement.focus();
        }, 100);
      }
    });
  }

  onContinue(): void {
    if (this.type() === 'retry') {
      this.close.emit();
    } else {
      this.next.emit();
    }
  }

  getButtonText(): string {
    return this.type() === 'retry' ? 'Ritenta' : 'Prossimo esercizio →';
  }

  getButtonLabel(): string {
    return this.type() === 'retry' ? 'Ritenta questo esercizio' : 'Passa al prossimo esercizio';
  }

  getModalClasses(): string {
    switch (this.type()) {
      case 'success':
        return 'modal modal-success';
      case 'retry':
        return 'modal modal-retry';
      case 'show-answer':
        return 'modal modal-info';
      default:
        return 'modal';
    }
  }
}
