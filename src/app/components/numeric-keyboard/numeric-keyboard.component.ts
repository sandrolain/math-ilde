import { Component, output } from '@angular/core';

@Component({
  selector: 'app-numeric-keyboard',
  imports: [],
  template: `
    <div class="keyboard-container">
      <div class="keyboard-grid">
        @for (number of numbers; track number) {
          <button
            class="key key-number"
            (click)="onNumberClick(number)"
            [attr.aria-label]="'Numero ' + number"
          >
            {{ number }}
          </button>
        }
        <button class="key key-number" (click)="onNumberClick(0)" aria-label="Numero 0">0</button>
        <button class="key key-backspace" (click)="onBackspace()" aria-label="Cancella">⌫</button>
        <button class="key key-clear" (click)="onClear()" aria-label="Cancella tutto">C</button>
      </div>
    </div>
  `,
  styles: [
    `
      .keyboard-container {
        background: linear-gradient(to top, #ffffff, #f8f9fa);
        border-top: 3px solid var(--color-primary);
        border-bottom: 3px solid var(--color-primary);
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 0.75rem;
        margin: 1rem 0;
        animation: slideDown 0.3s ease-out;
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .keyboard-grid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 0.5rem;
        margin: 0 auto;
      }

      .key {
        aspect-ratio: 1;
        max-height: 44px;
        min-height: 32px;
        border: none;
        border-radius: 12px;
        font-size: 1.5rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s ease;
        touch-action: manipulation;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .key:active {
        transform: scale(0.95);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .key-number {
        background: linear-gradient(135deg, #a8d8ea 0%, #8ec5d6 100%);
        color: white;
      }

      .key-backspace {
        background: linear-gradient(135deg, #ffb6c1 0%, #ff9fb0 100%);
        color: white;
      }

      .key-clear {
        background: linear-gradient(135deg, #f0e68c 0%, #e6d875 100%);
        color: #4a5568;
      }

      /* Effetto hover solo su dispositivi non touch */
      @media (hover: hover) {
        .key:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
      }

      /* Tablet e desktop */
      @media (min-width: 768px) {
        .key {
          min-height: 55px;
          font-size: 1.75rem;
        }
      }

      /* Desktop large */
      @media (min-width: 1024px) {
        .keyboard-container {
          padding: 1rem;
        }

        .key {
          min-height: 60px;
          font-size: 1.85rem;
        }
      }
    `,
  ],
})
export class NumericKeyboardComponent {
  numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  numberPressed = output<number>();
  backspacePressed = output<void>();
  clearPressed = output<void>();

  onNumberClick(num: number): void {
    this.numberPressed.emit(num);
  }

  onBackspace(): void {
    this.backspacePressed.emit();
  }

  onClear(): void {
    this.clearPressed.emit();
  }
}
