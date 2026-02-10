import { Component, input, output, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import type {
  OperationType,
  DifficultyLevel,
  NumberOfOperands,
  SectionType,
  ExerciseOptions,
} from '../../types/exercise.types';

@Component({
  selector: 'app-options-control',
  imports: [FormsModule, CommonModule],
  template: `
    <!-- Mobile toggle button -->
    <div class="lg:hidden flex justify-start mb-4">
      <button
        (click)="toggleMobileMenu()"
        class="btn btn-primary"
        [attr.aria-expanded]="mobileMenuOpen()"
      >
        {{ mobileMenuOpen() ? '✕ Chiudi' : '☰ Opzioni' }}
      </button>
    </div>

    <!-- Sidebar menu - slide out on mobile -->
    <div
      class="fixed lg:relative inset-y-0 left-0 w-80 bg-white shadow-lg p-6 space-y-6 z-40 transition-transform duration-300 lg:translate-x-0 max-h-screen overflow-y-auto"
      [class.translate-x-[-100%]]="!mobileMenuOpen()"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-[var(--color-text-primary)]">Opzioni</h3>
        <button
          (click)="toggleMobileMenu()"
          class="lg:hidden text-2xl text-[var(--color-text-primary)]"
        >
          ✕
        </button>
      </div>

      <!-- Tipo di operazione (solo per addizioni-sottrazioni) -->
      @if (section() === 'addition-subtraction') {
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
            Tipo di operazione:
          </label>
          <div class="space-y-2">
            <label
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="operationType"
                value="addition"
                [(ngModel)]="selectedOperationType"
                (change)="onOptionsChange()"
                class="w-5 h-5"
                [style.accent-color]="'var(--color-primary)'"
              />
              <span class="text-lg">Solo addizioni ➕</span>
            </label>
            <label
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="operationType"
                value="subtraction"
                [(ngModel)]="selectedOperationType"
                (change)="onOptionsChange()"
                class="w-5 h-5"
                [style.accent-color]="'var(--color-primary)'"
              />
              <span class="text-lg">Solo sottrazioni ➖</span>
            </label>
            <label
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="operationType"
                value="mixed"
                [(ngModel)]="selectedOperationType"
                (change)="onOptionsChange()"
                class="w-5 h-5"
                [style.accent-color]="'var(--color-primary)'"
              />
              <span class="text-lg">Misto ➕➖</span>
            </label>
          </div>
        </div>
      }

      <!-- Livello di difficoltà -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
          Livello:
        </label>
        <div class="space-y-2">
          <label
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="radio"
              name="level"
              [value]="10"
              [(ngModel)]="selectedLevel"
              (change)="onOptionsChange()"
              class="w-5 h-5"
              [style.accent-color]="'var(--color-primary)'"
            />
            <span class="text-lg">{{ getLevelLabel(10) }}</span>
          </label>
          <label
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="radio"
              name="level"
              [value]="50"
              [(ngModel)]="selectedLevel"
              (change)="onOptionsChange()"
              class="w-5 h-5"
              [style.accent-color]="'var(--color-primary)'"
            />
            <span class="text-lg">{{ getLevelLabel(50) }}</span>
          </label>
          <label
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="radio"
              name="level"
              [value]="100"
              [(ngModel)]="selectedLevel"
              (change)="onOptionsChange()"
              class="w-5 h-5"
              [style.accent-color]="'var(--color-primary)'"
            />
            <span class="text-lg">{{ getLevelLabel(100) }}</span>
          </label>
          <label
            class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <input
              type="radio"
              name="level"
              [value]="1000"
              [(ngModel)]="selectedLevel"
              (change)="onOptionsChange()"
              class="w-5 h-5"
              [style.accent-color]="'var(--color-primary)'"
            />
            <span class="text-lg">{{ getLevelLabel(1000) }}</span>
          </label>
        </div>
      </div>

      <!-- Numero di operandi (solo per addizioni-sottrazioni) -->
      @if (section() === 'addition-subtraction') {
        <div class="space-y-2">
          <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
            Numero di addendi:
          </label>
          <div class="space-y-2">
            <label
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="numberOfOperands"
                [value]="2"
                [(ngModel)]="selectedNumberOfOperands"
                (change)="onOptionsChange()"
                class="w-5 h-5"
                [style.accent-color]="'var(--color-primary)'"
              />
              <span class="text-lg">2 addendi</span>
            </label>
            <label
              class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="numberOfOperands"
                [value]="3"
                [(ngModel)]="selectedNumberOfOperands"
                (change)="onOptionsChange()"
                class="w-5 h-5"
                [style.accent-color]="'var(--color-primary)'"
              />
              <span class="text-lg">3 addendi</span>
            </label>
          </div>
        </div>
      }

      <!-- Mostra rappresentazione grafica -->
      <div class="space-y-2">
        <label class="block text-sm font-semibold text-[var(--color-text-primary)]">
          Visualizzazione:
        </label>
        <label
          class="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
        >
          <input
            type="checkbox"
            [(ngModel)]="showVisuals"
            (change)="onOptionsChange()"
            class="w-5 h-5"
            [style.accent-color]="'var(--color-primary)'"
          />
          <span class="text-lg">Mostra forme 🎨</span>
        </label>
      </div>
    </div>

    <!-- Mobile menu overlay -->
    @if (mobileMenuOpen()) {
      <div class="fixed inset-0 bg-black/50 lg:hidden z-30" (click)="toggleMobileMenu()"></div>
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
export class OptionsControlComponent {
  section = input.required<SectionType>();
  operationType = input.required<OperationType>();
  level = input.required<DifficultyLevel>();
  numberOfOperands = input.required<NumberOfOperands>();
  visualsEnabled = input<boolean>(true);

  optionsChanged = output<Partial<ExerciseOptions>>();

  mobileMenuOpen = signal(false);

  selectedOperationType: OperationType = 'mixed';
  selectedLevel: DifficultyLevel = 10;
  selectedNumberOfOperands: NumberOfOperands = 2;
  showVisuals = true;

  constructor() {
    // Sincronizza i valori interni con gli input quando cambiano
    effect(() => {
      this.selectedOperationType = this.operationType();
      this.selectedLevel = this.level();
      this.selectedNumberOfOperands = this.numberOfOperands();
      this.showVisuals = this.visualsEnabled();
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  onOptionsChange(): void {
    this.mobileMenuOpen.set(false); // Close menu on mobile when option changes
    this.optionsChanged.emit({
      operationType: this.selectedOperationType,
      level: this.selectedLevel,
      numberOfOperands: this.selectedNumberOfOperands,
      showVisuals: this.showVisuals,
    });
  }

  getLevelLabel(level: DifficultyLevel): string {
    const section = this.section();

    if (section === 'addition-subtraction') {
      switch (level) {
        case 10:
          return 'Livello 1: fino a 10';
        case 50:
          return 'Livello 2: primo a 2 cifre';
        case 100:
          return 'Livello 3: fino a 100';
        case 1000:
          return 'Livello 4: fino a 1000';
      }
    } else if (section === 'multiplication') {
      switch (level) {
        case 10:
          return 'Livello 1: Tabelline 1-5';
        case 50:
          return 'Livello 2: Tabelline 1-7';
        case 100:
          return 'Livello 3: Tabelline 1-10';
        case 1000:
          return 'Livello 4: Numeri grandi';
      }
    } else if (section === 'division') {
      switch (level) {
        case 10:
          return 'Livello 1: Divisioni semplici';
        case 50:
          return 'Livello 2: Divisioni medie';
        case 100:
          return 'Livello 3: Divisioni complesse';
        case 1000:
          return 'Livello 4: Divisioni avanzate';
      }
    }

    return `Livello ${level}`;
  }
}
