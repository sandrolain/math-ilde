import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import type { SyllableOptions, SyllableMode } from '../../types/exercise.types';

interface ModeOption {
  icon: string;
  label: string;
  value: SyllableMode;
}

const MODE_OPTIONS: ModeOption[] = [
  { icon: '🔤', label: 'Sillabe', value: 'syllable' },
  { icon: '🎨', label: 'Colori', value: 'color' },
  { icon: '🔢', label: 'Numeri', value: 'number' },
  { icon: '🐾', label: 'Animali', value: 'animal' },
  { icon: '👤', label: 'Nomi', value: 'name' },
  { icon: '🧸', label: 'Oggetti', value: 'things' },
  { icon: '💬', label: 'Frasi', value: 'sentence' },
];

@Component({
  selector: 'app-syllable-options-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Mobile toggle button -->
    <div class="lg:hidden flex justify-start mb-4">
      <button
        (click)="toggleMobileMenu()"
        class="btn btn-primary"
        [attr.aria-expanded]="mobileMenuOpen()"
        aria-controls="syllable-options-sidebar"
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
      id="syllable-options-sidebar"
      class="fixed lg:relative inset-y-0 left-0 w-80 bg-white shadow-lg p-6 space-y-6 z-40 transition-transform duration-300 lg:translate-x-0 max-h-screen overflow-y-auto"
      [class.translate-x-[-100%]]="!mobileMenuOpen()"
      role="region"
      aria-label="Opzioni sillabe"
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

      <!-- Sezione modalità -->
      <div class="space-y-2">
        <fieldset>
          <legend class="block text-sm font-semibold text-(--color-text-primary) mb-2">
            Modalità:
          </legend>
          <div class="grid grid-cols-2 gap-2">
            @for (mode of modeOptions; track mode.value) {
              <button
                class="flex flex-col items-center p-3 rounded-xl border-2 transition-all min-h-11 text-sm font-medium"
                [class.border-(--color-primary)]="options().activeMode === mode.value"
                [class.bg-sky-50]="options().activeMode === mode.value"
                [class.border-gray-200]="options().activeMode !== mode.value"
                [attr.aria-pressed]="options().activeMode === mode.value"
                (click)="setMode(mode.value)"
              >
                <span aria-hidden="true" class="text-2xl mb-1">{{ mode.icon }}</span>
                <span>{{ mode.label }}</span>
              </button>
            }
          </div>
        </fieldset>
      </div>

      <!-- Opzioni sillabe (solo modalità syllable) -->
      @if (options().activeMode === 'syllable') {
        <div class="space-y-2">
          <fieldset>
            <legend class="block text-sm font-semibold text-(--color-text-primary) mb-2">
              Costruzione sillabe:
            </legend>
            <div class="space-y-2">
              <label
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
              >
                <input
                  type="checkbox"
                  class="w-5 h-5 rounded accent-(--color-primary)"
                  [checked]="options().addS"
                  (change)="toggleAddS()"
                  [disabled]="options().twoConsonants"
                />
                <span class="text-sm text-(--color-text-primary)">Aggiungi "s" iniziale</span>
              </label>
              <label
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
              >
                <input
                  type="checkbox"
                  class="w-5 h-5 rounded accent-(--color-primary)"
                  [checked]="options().twoConsonants"
                  (change)="toggleTwoConsonants()"
                  [disabled]="options().addS"
                />
                <span class="text-sm text-(--color-text-primary)">Aggiungi seconda consonante</span>
              </label>
              <label
                class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
              >
                <input
                  type="checkbox"
                  class="w-5 h-5 rounded accent-(--color-primary)"
                  [checked]="options().useDoubles"
                  (change)="toggleUseDoubles()"
                />
                <span class="text-sm text-(--color-text-primary)">Usa consonanti doppie</span>
              </label>
            </div>
          </fieldset>
        </div>
      }

      <!-- Opzioni visualizzazione -->
      <div class="space-y-2">
        <fieldset>
          <legend class="block text-sm font-semibold text-(--color-text-primary) mb-2">
            Visualizzazione:
          </legend>
          <div class="space-y-2">
            <label
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
            >
              <input
                type="checkbox"
                class="w-5 h-5 rounded accent-(--color-primary)"
                [checked]="options().showUppercase"
                (change)="toggleShowUppercase()"
                [disabled]="options().showUppercase && !options().showLowercase"
              />
              <span class="text-sm text-(--color-text-primary)"
                >Mostra <strong>MAIUSCOLE</strong></span
              >
            </label>
            <label
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
            >
              <input
                type="checkbox"
                class="w-5 h-5 rounded accent-(--color-primary)"
                [checked]="options().showLowercase"
                (change)="toggleShowLowercase()"
                [disabled]="options().showLowercase && !options().showUppercase"
              />
              <span class="text-sm text-(--color-text-primary)">Mostra minuscole</span>
            </label>
            <label
              class="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer min-h-11"
            >
              <input
                type="checkbox"
                class="w-5 h-5 rounded accent-(--color-primary)"
                [checked]="options().showCursive"
                (change)="toggleShowCursive()"
              />
              <span class="text-sm text-(--color-text-primary)">Mostra in corsivo</span>
            </label>
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
export class SyllableOptionsControlComponent {
  options = input.required<SyllableOptions>();
  optionsChange = output<SyllableOptions>();

  mobileMenuOpen = signal(false);
  readonly modeOptions = MODE_OPTIONS;

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  setMode(mode: SyllableMode): void {
    this.emit({ activeMode: mode });
  }

  toggleAddS(): void {
    if (!this.options().twoConsonants) {
      this.emit({ addS: !this.options().addS });
    }
  }

  toggleTwoConsonants(): void {
    if (!this.options().addS) {
      this.emit({ twoConsonants: !this.options().twoConsonants });
    }
  }

  toggleUseDoubles(): void {
    this.emit({ useDoubles: !this.options().useDoubles });
  }

  toggleShowUppercase(): void {
    const current = this.options();
    if (current.showUppercase && !current.showLowercase) return;
    this.emit({ showUppercase: !current.showUppercase });
  }

  toggleShowLowercase(): void {
    const current = this.options();
    if (current.showLowercase && !current.showUppercase) return;
    this.emit({ showLowercase: !current.showLowercase });
  }

  toggleShowCursive(): void {
    this.emit({ showCursive: !this.options().showCursive });
  }

  private emit(partial: Partial<SyllableOptions>): void {
    this.optionsChange.emit({ ...this.options(), ...partial });
  }
}
