import { Component, input, computed, signal, effect } from '@angular/core';
import type { MathOperation, VisualElement, ShapeType } from '../../types/exercise.types';

@Component({
  selector: 'app-visual-representation',
  imports: [],
  template: `
    <div class="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-6 min-h-[200px]">
      @for (group of groupedElements(); track group.groupIndex) {
        <div
          [class]="getGroupClasses()"
          style="border-color: var(--color-primary); background-color: rgba(255, 255, 255, 0.5);"
        >
          @for (element of group.elements; track element.index) {
            <div
              [class]="getElementClasses(element)"
              [style.background-color]="element.color"
              [attr.aria-label]="getElementAriaLabel(element)"
            >
              @if (element.type === 'star') {
                <svg viewBox="0 0 24 24" fill="currentColor" class="w-full h-full">
                  <path
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </svg>
              }
            </div>
          }
        </div>

        @if (!$last && visualOperator()) {
          <div class="text-4xl font-bold text-[var(--color-text-primary)]">
            {{ visualOperator() }}
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .shape-element {
        opacity: 1;
      }

      .crossed-out {
        position: relative;
        opacity: 0.3;
      }

      .crossed-out::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 120%;
        height: 3px;
        background-color: #ef4444;
        transform: translate(-50%, -50%) rotate(-45deg);
      }
    `,
  ],
})
export class VisualRepresentationComponent {
  operation = input.required<MathOperation>();
  displayMode = input<'grouped' | 'total'>('grouped');

  // Computed per l'operatore grafico (moltiplicazioni mostrano somma, divisioni nulla)
  visualOperator = computed(() => {
    if (this.displayMode() === 'total') return '';
    const op = this.operation();
    // La moltiplicazione graficamente è una somma di gruppi uguali
    if (op.operator === '×') return '+';
    // La divisione graficamente è solo una separazione, non ha operatore
    if (op.operator === '÷') return '';
    return op.operator;
  });

  // Computed per generare gli elementi visivi raggruppati
  groupedElements = computed(() => {
    const op = this.operation();
    const groups: { groupIndex: number; elements: VisualElement[] }[] = [];

    // Modalità 'total': mostra solo il risultato totale in un unico gruppo
    if (this.displayMode() === 'total') {
      groups.push({
        groupIndex: 0,
        elements: this.createElements(op.result, 'circle', '#A8D8EA', 0, 0),
      });
      return groups;
    }

    if (op.operator === '+') {
      // Addizione: gruppi separati per ogni addendo
      groups.push({
        groupIndex: 0,
        elements: this.createElements(op.operand1, 'circle', '#A8D8EA', 0, 0),
      });

      groups.push({
        groupIndex: 1,
        elements: this.createElements(op.operand2, 'square', '#FFB6C1', 1, op.operand1),
      });

      if (op.operand3 !== undefined) {
        groups.push({
          groupIndex: 2,
          elements: this.createElements(
            op.operand3,
            'star',
            '#F0E68C',
            2,
            op.operand1 + op.operand2,
          ),
        });
      }
    } else if (op.operator === '-') {
      // Sottrazione: tutti gli elementi del minuendo, con alcuni barrati
      const totalElements = op.operand1;
      const firstCrossOut = op.operand2;
      const secondCrossOut = op.operand3 || 0;
      const elements: VisualElement[] = [];

      for (let i = 0; i < totalElements; i++) {
        let color: string;
        if (i < firstCrossOut) {
          // Primo gruppo sottratto (operand2) - rosa
          color = '#FFB6C1';
        } else if (i < firstCrossOut + secondCrossOut) {
          // Secondo gruppo sottratto (operand3) - giallo
          color = '#F0E68C';
        } else {
          // Elementi rimanenti - azzurro
          color = '#A8D8EA';
        }
        elements.push({
          type: 'circle',
          color,
          group: 0,
          index: i,
        });
      }

      groups.push({ groupIndex: 0, elements });
    } else if (op.operator === '×') {
      // Moltiplicazione: operand2 gruppi, ognuno con operand1 elementi
      // Es: 4 × 2 = 2 gruppi di 4 elementi
      for (let group = 0; group < op.operand2; group++) {
        groups.push({
          groupIndex: group,
          elements: this.createElements(
            op.operand1,
            'circle',
            this.getGroupColor(group),
            group,
            group * op.operand1,
          ),
        });
      }
    } else if (op.operator === '÷') {
      // Divisione: tutti gli elementi divisi in gruppi uguali
      const elementsPerGroup = op.result;
      const numberOfGroups = op.operand2;

      for (let group = 0; group < numberOfGroups; group++) {
        groups.push({
          groupIndex: group,
          elements: this.createElements(
            elementsPerGroup,
            'circle',
            this.getGroupColor(group),
            group,
            group * elementsPerGroup,
          ),
        });
      }
    }

    return groups;
  });

  private createElements(
    count: number,
    type: ShapeType,
    color: string,
    group: number,
    startIndex: number,
  ): VisualElement[] {
    return Array.from({ length: count }, (_, i) => ({
      type,
      color,
      group,
      index: startIndex + i,
    }));
  }

  private getGroupColor(groupIndex: number): string {
    const colors = ['#A8D8EA', '#FFB6C1', '#B4E7CE', '#F0E68C', '#DDA0DD', '#98D8C8'];
    return colors[groupIndex % colors.length];
  }

  getElementClasses(element: VisualElement): string {
    const baseClasses = 'shape-element transition-all duration-300';
    const sizeClass = this.getElementSize();

    // Per sottrazione, barra gli elementi che devono essere sottratti
    if (this.operation().operator === '-') {
      const toCrossOut = this.operation().operand2 + (this.operation().operand3 || 0);
      if (element.index < toCrossOut) {
        return `${baseClasses} ${sizeClass} crossed-out`;
      }
    }

    // Forma specifica
    let shapeClass = '';
    switch (element.type) {
      case 'circle':
        shapeClass = 'rounded-full';
        break;
      case 'square':
        shapeClass = 'rounded-lg';
        break;
      case 'star':
        shapeClass = 'rounded-lg p-1';
        break;
    }

    return `${baseClasses} ${sizeClass} ${shapeClass}`;
  }

  getGroupClasses(): string {
    if (this.displayMode() === 'total') {
      // Modalità total: griglia con max 10 colonne
      return 'grid grid-cols-10 gap-2 p-4';
    }
    // Modalità grouped: layout flessibile con bordo
    return 'flex flex-wrap items-center justify-center gap-2 p-4 rounded-2xl border-3 md:min-h-24 min-w-12 min-h-20';
  }

  private getElementSize(): string {
    const totalElements = this.getTotalElements();

    if (totalElements <= 20) {
      return 'w-12 h-12 md:w-16 md:h-16';
    } else if (totalElements <= 50) {
      return 'w-8 h-8 md:w-10 md:h-10';
    } else if (totalElements <= 100) {
      return 'w-6 h-6 md:w-8 md:h-8';
    } else {
      return 'w-4 h-4 md:w-6 md:h-6';
    }
  }

  private getTotalElements(): number {
    const op = this.operation();

    switch (op.operator) {
      case '+':
        return op.operand1 + op.operand2 + (op.operand3 || 0);
      case '-':
        return op.operand1;
      case '×':
        return op.operand1 * op.operand2;
      case '÷':
        return op.operand1;
      default:
        return 0;
    }
  }

  getElementAriaLabel(element: VisualElement): string {
    const shapes: Record<ShapeType, string> = {
      circle: 'cerchio',
      square: 'quadrato',
      star: 'stella',
    };
    return shapes[element.type];
  }
}
