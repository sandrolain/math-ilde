import { Component, input, computed } from '@angular/core';
import type { MathOperation, VisualElement, ShapeType } from '../../types/exercise.types';

interface RowOfElements {
  elements: VisualElement[];
  rowIndex: number;
  count: number;
  label: string;
}

@Component({
  selector: 'app-visual-representation',
  imports: [],
  template: `
    <div class="flex flex-wrap items-center justify-center gap-4 md:gap-6 p-6 min-h-50">
      @for (group of groupedElements(); track group.groupIndex) {
        <div
          class="flex flex-col gap-3 items-center p-4 rounded-2xl border-3 min-w-12 min-h-20"
          style="border-color: var(--color-primary); background-color: rgba(255, 255, 255, 0.5);"
        >
          @if (group.rows.length === 0) {
            <div class="text-2xl font-bold opacity-30" style="color: var(--color-text-primary);">
              ∅
            </div>
          }
          @for (row of group.rows; track row.rowIndex) {
            <div class="flex items-center justify-between gap-4 w-full">
              <div class="flex gap-2 items-center justify-center">
                @for (element of row.elements; track element.index) {
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
              <div
                class="text-lg md:text-xl font-bold min-w-30"
                style="color: var(--color-text-primary);"
              >
                {{ row.label }}
              </div>
            </div>
          }
        </div>

        @if (!$last && visualOperator()) {
          <div class="text-4xl font-bold" style="color: var(--color-text-primary);">
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

  // Computed per generare gli elementi visivi raggruppati in righe di 10
  groupedElements = computed(() => {
    const op = this.operation();
    const groups: { groupIndex: number; rows: RowOfElements[] }[] = [];

    // Modalità 'total': mostra solo il risultato totale
    if (this.displayMode() === 'total') {
      const elements = this.createElements(op.result, 'circle', '#A8D8EA', 0, 0);
      groups.push({
        groupIndex: 0,
        rows: this.organizeInRows(elements),
      });
      return groups;
    }

    if (op.operator === '+') {
      // Addizione: gruppi separati per ogni addendo
      const elements1 = this.createElements(op.operand1, 'circle', '#A8D8EA', 0, 0);
      groups.push({
        groupIndex: 0,
        rows: this.organizeInRows(elements1),
      });

      const elements2 = this.createElements(op.operand2, 'square', '#FFB6C1', 1, op.operand1);
      groups.push({
        groupIndex: 1,
        rows: this.organizeInRows(elements2),
      });

      if (op.operand3 !== undefined) {
        const elements3 = this.createElements(
          op.operand3,
          'star',
          '#F0E68C',
          2,
          op.operand1 + op.operand2,
        );
        groups.push({
          groupIndex: 2,
          rows: this.organizeInRows(elements3),
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
          color = '#FFB6C1';
        } else if (i < firstCrossOut + secondCrossOut) {
          color = '#F0E68C';
        } else {
          color = '#A8D8EA';
        }
        elements.push({
          type: 'circle',
          color,
          group: 0,
          index: i,
        });
      }

      groups.push({
        groupIndex: 0,
        rows: this.organizeInRows(elements),
      });
    } else if (op.operator === '×') {
      // Moltiplicazione: operand2 gruppi, ognuno con operand1 elementi
      for (let group = 0; group < op.operand2; group++) {
        const elements = this.createElements(
          op.operand1,
          'circle',
          this.getGroupColor(group),
          group,
          group * op.operand1,
        );
        groups.push({
          groupIndex: group,
          rows: this.organizeInRows(elements),
        });
      }
    } else if (op.operator === '÷') {
      // Divisione: tutti gli elementi divisi in gruppi uguali
      const elementsPerGroup = op.result;
      const numberOfGroups = op.operand2;

      for (let group = 0; group < numberOfGroups; group++) {
        const elements = this.createElements(
          elementsPerGroup,
          'circle',
          this.getGroupColor(group),
          group,
          group * elementsPerGroup,
        );
        groups.push({
          groupIndex: group,
          rows: this.organizeInRows(elements),
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

  private organizeInRows(elements: VisualElement[]): RowOfElements[] {
    const rows: RowOfElements[] = [];
    const elementsPerRow = 10;

    for (let i = 0; i < elements.length; i += elementsPerRow) {
      const rowElements = elements.slice(i, i + elementsPerRow);
      const count = rowElements.length;

      rows.push({
        elements: rowElements,
        rowIndex: i / elementsPerRow,
        count,
        label: this.createRowLabel(count),
      });
    }

    return rows;
  }

  private createRowLabel(count: number): string {
    const roman = this.toRoman(count);
    if (count === 10) {
      return `10, ${roman}, 1da`;
    } else {
      return `${count}, ${roman}, ${count}u`;
    }
  }

  private toRoman(num: number): string {
    if (num === 0) return '0';

    const romanNumerals: [number, string][] = [
      [10, 'X'],
      [9, 'IX'],
      [5, 'V'],
      [4, 'IV'],
      [1, 'I'],
    ];

    let result = '';
    let remaining = num;

    for (const [value, numeral] of romanNumerals) {
      while (remaining >= value) {
        result += numeral;
        remaining -= value;
      }
    }

    return result;
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
