import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import type { TimesTableOptions, TimesTableLength } from '../../types/exercise.types';

const LENGTH_OPTIONS: { value: TimesTableLength; label: string }[] = [
  { value: 10, label: 'Fino a 10' },
  { value: 12, label: 'Fino a 12' },
  { value: 20, label: 'Fino a 20' },
];

@Component({
  selector: 'app-times-table-options-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile toggle button -->
    <div class="lg:hidden flex justify-start mb-4">
      <button
        (click)="toggleMobileMenu()"
        class="btn btn-primary"
        [attr.aria-expanded]="mobileMenuOpen()"
        aria-controls="tt-options-sidebar"
      >
        {{ mobileMenuOpen() ? '✕ Chiudi' : '☰ Opzioni' }}
      </button>
    </div>

    <!-- Overlay mobile -->
    @if (mobileMenuOpen()) {
      <div
        class="fixed inset-0 bg-black/30 z-30 lg:hidden"
        (click)="toggleMobileMenu()"
        aria-hidden="true"
      ></div>
    }

    <!-- Sidebar -->
    <div
      id="tt-options-sidebar"
      class="fixed lg:relative inset-y-0 left-0 w-80 bg-white shadow-lg p-6 space-y-6 z-40 transition-transform duration-300 lg:translate-x-0 max-h-screen overflow-y-auto"
      [class.translate-x-[-100%]]="!mobileMenuOpen()"
      role="region"
      aria-label="Opzioni tabelline"
    >
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-(--color-text-primary)">Opzioni</h3>
        <button
          (click)="toggleMobileMenu()"
          class="lg:hidden text-2xl text-(--color-text-primary) min-w-11 min-h-11 flex items-center justify-center"
          aria-label="Chiudi opzioni"
        >
          ✕
        </button>
      </div>

      <!-- Azioni rapide -->
      <div class="space-y-2">
        <p class="block text-sm font-semibold text-(--color-text-primary) mb-2">Azioni:</p>
        <button class="w-full btn btn-primary min-h-11" (click)="changeTable.emit()">
          🔢 Cambia tabellina
        </button>
        <button class="w-full btn btn-primary min-h-11" (click)="retry.emit()">🔄 Rimescola</button>
      </div>

      <!-- Lunghezza tabellina -->
      <div class="space-y-2">
        <fieldset>
          <legend class="block text-sm font-semibold text-(--color-text-primary) mb-2">
            Lunghezza tabellina:
          </legend>
          <div class="space-y-2">
            @for (opt of lengthOptions; track opt.value) {
              <label
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
              >
                <input
                  type="radio"
                  name="tableLength"
                  class="w-5 h-5 accent-(--color-primary)"
                  [value]="opt.value"
                  [checked]="options().tableLength === opt.value"
                  (change)="onLengthChange(opt.value)"
                />
                <span class="text-sm text-(--color-text-primary)">{{ opt.label }}</span>
              </label>
            }
          </div>
        </fieldset>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class TimesTableOptionsControlComponent {
  options = input.required<TimesTableOptions>();
  optionsChange = output<TimesTableOptions>();
  changeTable = output<void>();
  retry = output<void>();

  mobileMenuOpen = signal(false);
  readonly lengthOptions = LENGTH_OPTIONS;

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  onLengthChange(length: TimesTableLength): void {
    this.optionsChange.emit({ ...this.options(), tableLength: length });
  }
}
