import { Component, input, computed } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import type {
  MathOperation,
  VisualElement,
  ShapeType,
  FruitType,
} from '../../types/exercise.types';

interface RowOfElements {
  elements: VisualElement[];
  rowIndex: number;
  count: number;
  label: string;
}

@Component({
  selector: 'app-visual-representation',
  imports: [NgOptimizedImage],
  template: `
    <div class="flex flex-col items-center justify-center gap-4 md:gap-6 p-6 min-h-50">
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
                    [attr.aria-label]="getElementAriaLabel(element)"
                  >
                    <img
                      [ngSrc]="'/icons/fruits/' + element.fruit + '.png'"
                      [alt]="getElementAriaLabel(element)"
                      width="100"
                      height="100"
                      class="w-full h-full object-contain"
                    />
                  </div>
                }
              </div>
              <div
                class="text-lg md:text-xl font-bold min-w-30 flex flex-col items-center justify-center leading-none"
                style="color: var(--color-text-primary);"
                [innerHTML]="row.label"
              ></div>
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

        img {
          opacity: 0.3;
        }
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
        opacity: 0.5;
      }
    `,
  ],
})
export class VisualRepresentationComponent {
  operation = input.required<MathOperation>();
  displayMode = input<'grouped' | 'total'>('grouped');

  private readonly availableFruits: FruitType[] = [
    'apple',
    'banana',
    'blueberry',
    'cherry',
    'coconut',
    'grape',
    'kiwi',
    'lemon',
    'orange',
    'pineapple',
    'strawberry',
    'watermelon',
  ];

  private usedFruits: Set<FruitType> = new Set();

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
    this.usedFruits.clear();

    // Modalità 'total': mostra solo il risultato totale
    if (this.displayMode() === 'total') {
      const fruit = this.getRandomFruit();
      const elements = this.createElements(op.result, 'circle', '#A8D8EA', 0, 0, fruit);
      groups.push({
        groupIndex: 0,
        rows: this.organizeInRows(elements),
      });
      return groups;
    }

    if (op.operator === '+') {
      // Addizione: gruppi separati per ogni addendo
      const fruit1 = this.getRandomFruit();
      const elements1 = this.createElements(op.operand1, 'circle', '#A8D8EA', 0, 0, fruit1);
      groups.push({
        groupIndex: 0,
        rows: this.organizeInRows(elements1),
      });

      const fruit2 = this.getRandomFruit();
      const elements2 = this.createElements(
        op.operand2,
        'square',
        '#FFB6C1',
        1,
        op.operand1,
        fruit2,
      );
      groups.push({
        groupIndex: 1,
        rows: this.organizeInRows(elements2),
      });

      if (op.operand3 !== undefined) {
        const fruit3 = this.getRandomFruit();
        const elements3 = this.createElements(
          op.operand3,
          'star',
          '#F0E68C',
          2,
          op.operand1 + op.operand2,
          fruit3,
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
      const fruit = this.getRandomFruit();

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
          fruit,
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
      const fruit = this.getRandomFruit();
      for (let group = 0; group < op.operand2; group++) {
        const elements = this.createElements(
          op.operand1,
          'circle',
          this.getGroupColor(group),
          group,
          group * op.operand1,
          fruit,
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
      const fruit = this.getRandomFruit();

      for (let group = 0; group < numberOfGroups; group++) {
        const elements = this.createElements(
          elementsPerGroup,
          'circle',
          this.getGroupColor(group),
          group,
          group * elementsPerGroup,
          fruit,
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
    fruit: FruitType,
  ): VisualElement[] {
    return Array.from({ length: count }, (_, i) => ({
      type,
      fruit,
      color,
      group,
      index: startIndex + i,
    }));
  }

  private getRandomFruit(): FruitType {
    const availableChoices = this.availableFruits.filter((f) => !this.usedFruits.has(f));
    const choices = availableChoices.length > 0 ? availableChoices : this.availableFruits;
    const fruit = choices[Math.floor(Math.random() * choices.length)];
    this.usedFruits.add(fruit);
    return fruit;
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
      return `<div>10</div><div>${roman}</div><div>1da</div>`;
    } else {
      return `<div>${count}</div><div>${roman}</div><div>${count}u</div>`;
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

    return `${baseClasses} ${sizeClass}`;
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
    const fruitNames: Record<FruitType, string> = {
      apple: 'mela',
      banana: 'banana',
      blueberry: 'mirtillo',
      cherry: 'ciliegia',
      coconut: 'cocco',
      grape: 'uva',
      kiwi: 'kiwi',
      lemon: 'limone',
      orange: 'arancia',
      pineapple: 'ananas',
      strawberry: 'fragola',
      watermelon: 'anguria',
    };
    return fruitNames[element.fruit];
  }
}
