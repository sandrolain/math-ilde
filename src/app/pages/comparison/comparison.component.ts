import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { FeedbackService } from '../../services/feedback.service';
import { ComparisonOptionsStorageService } from '../../services/comparison-options-storage.service';
import type {
  FeedbackType,
  ComparisonOptions,
  ComparisonMode,
  ComparisonLevel,
  ComparisonExercise,
  SortDirection,
} from '../../types/exercise.types';

// Colori per le bolle di ordinamento
const SORT_COLORS = ['#a8d8ea', '#ffb6c1', '#b4e7ce', '#f0e68c', '#c8b4e7'];

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateExercise(opts: ComparisonOptions): ComparisonExercise {
  if (opts.mode === 'symbol') {
    const a = rnd(0, opts.level);
    // Talvolta genera uguali (circa 15%)
    const b = rnd(0, 14) < 2 ? a : rnd(0, opts.level);
    const correctSymbol: '<' | '>' | '=' = a < b ? '<' : a > b ? '>' : '=';
    return { mode: 'symbol', numberA: a, numberB: b, correctSymbol };
  } else {
    const count = 5;
    const max = opts.level;
    // Genera 5 numeri distinti
    const set = new Set<number>();
    let tries = 0;
    while (set.size < count && tries < 100) {
      tries++;
      set.add(rnd(0, max));
    }
    const numbers = shuffle([...set]);
    const sortDirection: SortDirection = rnd(0, 1) === 0 ? 'ascending' : 'descending';
    const sortedNumbers = [...numbers].sort((a, b) =>
      sortDirection === 'ascending' ? a - b : b - a,
    );
    return { mode: 'sort', numbers, sortDirection, sortedNumbers };
  }
}

@Component({
  selector: 'app-comparison',
  imports: [HeaderComponent, FeedbackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Confronto e Ordinamento" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <aside class="sidebar">
            <div class="lg:hidden flex justify-start mb-4">
              <button
                (click)="toggleMobileMenu()"
                class="btn btn-primary"
                [attr.aria-expanded]="mobileMenuOpen()"
                aria-label="Apri opzioni"
              >
                {{ mobileMenuOpen() ? '✕ Chiudi' : '☰ Opzioni' }}
              </button>
            </div>

            <div
              class="fixed lg:relative inset-y-0 left-0 w-80 bg-white shadow-lg p-6 space-y-6 z-40 transition-transform duration-300 lg:translate-x-0 max-h-screen overflow-y-auto"
              [class.translate-x-[-100%]]="!mobileMenuOpen()"
            >
              <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold text-(--color-text-primary)">Opzioni</h3>
                <button
                  (click)="toggleMobileMenu()"
                  class="lg:hidden text-2xl text-(--color-text-primary)"
                  aria-label="Chiudi opzioni"
                >
                  ✕
                </button>
              </div>

              <!-- Modalità -->
              <div class="space-y-2">
                <span class="section-label">Modalità:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="mode"
                      value="symbol"
                      class="option-input"
                      [checked]="options().mode === 'symbol'"
                      (change)="setMode('symbol')"
                    />
                    <span class="option-label">⚖️ Inserisci il simbolo</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="mode"
                      value="sort"
                      class="option-input"
                      [checked]="options().mode === 'sort'"
                      (change)="setMode('sort')"
                    />
                    <span class="option-label">🔢 Metti in ordine</span>
                  </label>
                </div>
              </div>

              <!-- Livello -->
              <div class="space-y-2">
                <span class="section-label">Numeri fino a:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="10"
                      class="option-input"
                      [checked]="options().level === 10"
                      (change)="setLevel(10)"
                    />
                    <span class="option-label">⭐ 10</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="100"
                      class="option-input"
                      [checked]="options().level === 100"
                      (change)="setLevel(100)"
                    />
                    <span class="option-label">⭐⭐ 100</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="level"
                      value="1000"
                      class="option-input"
                      [checked]="options().level === 1000"
                      (change)="setLevel(1000)"
                    />
                    <span class="option-label">⭐⭐⭐ 1000</span>
                  </label>
                </div>
              </div>

              <!-- Barre visive (solo modalità symbol) -->
              @if (options().mode === 'symbol') {
                <div class="space-y-2">
                  <span class="section-label">Rappresentazione visiva:</span>
                  <label class="option-item">
                    <input
                      type="checkbox"
                      class="option-input"
                      [checked]="options().showBars"
                      (change)="toggleBars()"
                    />
                    <span class="option-label">📊 Mostra barre</span>
                  </label>
                </div>
              }
            </div>
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Pulsante cambia -->
              <div class="text-center mb-6">
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Genera un nuovo esercizio"
                >
                  ➜ Cambia esercizio
                </button>
              </div>

              <!-- ===== MODALITÀ: inserisci il simbolo ===== -->
              @if (exercise().mode === 'symbol') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                  Scegli il simbolo corretto:
                </p>

                <!-- Barre visive -->
                @if (options().showBars) {
                  <div class="bars-container" aria-hidden="true" role="presentation">
                    <div class="bar-column">
                      <div
                        class="visual-bar"
                        [style.height.px]="barHeightA()"
                        style="background: #a8d8ea"
                      ></div>
                      <span class="bar-value">{{ exercise().numberA }}</span>
                    </div>
                    <div class="bar-spacer" aria-hidden="true"></div>
                    <div class="bar-column">
                      <div
                        class="visual-bar"
                        [style.height.px]="barHeightB()"
                        style="background: #ffb6c1"
                      ></div>
                      <span class="bar-value">{{ exercise().numberB }}</span>
                    </div>
                  </div>
                }

                <!-- Confronto numeri + bottoni simbolo -->
                <div
                  class="symbol-row"
                  role="group"
                  [attr.aria-label]="'Confronta ' + exercise().numberA + ' e ' + exercise().numberB"
                >
                  <span
                    class="cmp-number"
                    [attr.aria-label]="'Primo numero: ' + exercise().numberA"
                  >
                    {{ exercise().numberA }}
                  </span>

                  <!-- slot simbolo -->
                  <div
                    class="symbol-slot"
                    aria-live="polite"
                    [attr.aria-label]="
                      selectedSymbol() ? 'Simbolo scelto: ' + selectedSymbol() : 'Scegli un simbolo'
                    "
                  >
                    {{ selectedSymbol() ?? '?' }}
                  </div>

                  <span
                    class="cmp-number"
                    [attr.aria-label]="'Secondo numero: ' + exercise().numberB"
                  >
                    {{ exercise().numberB }}
                  </span>
                </div>

                <!-- Pulsanti <, >, = -->
                <div class="symbol-buttons" role="group" aria-label="Simboli di confronto">
                  @for (sym of symbols; track sym) {
                    <button
                      class="sym-btn"
                      [class.sym-btn--selected]="selectedSymbol() === sym"
                      [class.sym-btn--correct]="showFeedback() && sym === exercise().correctSymbol"
                      [class.sym-btn--wrong]="
                        showFeedback() &&
                        selectedSymbol() === sym &&
                        sym !== exercise().correctSymbol
                      "
                      (click)="selectSymbol(sym)"
                      [attr.aria-pressed]="selectedSymbol() === sym"
                      [attr.aria-label]="'Simbolo ' + sym"
                    >
                      {{ sym }}
                    </button>
                  }
                </div>

                <div class="mt-6 max-w-sm mx-auto">
                  <button
                    (click)="verifySymbol()"
                    class="btn btn-primary w-full"
                    [disabled]="selectedSymbol() === null"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- ===== MODALITÀ: metti in ordine ===== -->
              @if (exercise().mode === 'sort') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-2">
                  Metti i numeri in ordine
                  <strong>{{
                    exercise().sortDirection === 'ascending' ? 'crescente ↑' : 'decrescente ↓'
                  }}</strong
                  >:
                </p>
                <p class="text-center text-sm text-(--color-text-secondary) mb-8">
                  Tocca due numeri per scambiarli di posto
                </p>

                <!-- Griglia bolle ordinabili -->
                <div
                  class="sort-grid"
                  role="list"
                  [attr.aria-label]="
                    'Ordina i numeri in ordine ' +
                    (exercise().sortDirection === 'ascending' ? 'crescente' : 'decrescente')
                  "
                >
                  @for (num of sortItems(); track $index) {
                    <button
                      class="sort-bubble"
                      [class.sort-bubble--selected]="sortSelected() === $index"
                      [class.sort-bubble--correct]="showFeedback() && isSortCorrect()"
                      [class.sort-bubble--wrong]="
                        showFeedback() &&
                        !isSortCorrect() &&
                        num !== exercise().sortedNumbers![$index]
                      "
                      [style.background]="sortColors[$index]"
                      (click)="toggleSortSelect($index)"
                      role="listitem"
                      [attr.aria-label]="'Numero ' + num + ', posizione ' + ($index + 1)"
                      [attr.aria-pressed]="sortSelected() === $index"
                    >
                      {{ num }}
                    </button>
                  }
                </div>

                <div class="mt-8 max-w-sm mx-auto">
                  <button
                    (click)="verifySort()"
                    class="btn btn-primary w-full"
                    aria-label="Verifica l'ordine"
                  >
                    Verifica l'ordine
                  </button>
                </div>
              }

              <!-- Feedback overlay -->
              <app-feedback
                [show]="showFeedback()"
                [type]="feedbackType()"
                [message]="feedbackMessage()"
                (close)="closeFeedback()"
                (next)="nextExercise()"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ---- Barre visive ---- */
      .bars-container {
        display: flex;
        justify-content: center;
        align-items: flex-end;
        gap: 2rem;
        height: 140px;
        margin-bottom: 1.5rem;
      }

      .bar-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        width: 80px;
      }

      .bar-spacer {
        width: 40px;
      }

      .visual-bar {
        width: 80px;
        min-height: 6px;
        border-radius: 10px 10px 0 0;
        transition: height 0.3s ease;
      }

      .bar-value {
        font-size: 1.4rem;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      /* ---- Riga confronto ---- */
      .symbol-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
      }

      .cmp-number {
        font-size: 4rem;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
        min-width: 80px;
        text-align: center;
      }

      .symbol-slot {
        width: 90px;
        height: 90px;
        border: 3px dashed #667eea;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 3rem;
        font-weight: 800;
        color: var(--color-text-primary);
        background: white;
        transition: all 0.15s ease;
      }

      /* ---- Pulsanti simbolo ---- */
      .symbol-buttons {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-bottom: 0.5rem;
      }

      .sym-btn {
        width: 80px;
        height: 80px;
        border: 3px solid #e2e8f0;
        border-radius: 20px;
        background: white;
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.15s ease;
        touch-action: manipulation;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
      }

      @media (hover: hover) {
        .sym-btn:hover {
          border-color: #667eea;
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        }
      }

      .sym-btn--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.07);
        transform: scale(1.08);
      }

      .sym-btn--correct {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25) !important;
      }

      .sym-btn--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
      }

      /* ---- Griglia sort ---- */
      .sort-grid {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin: 0 auto;
        max-width: 480px;
      }

      .sort-bubble {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        border: 3px solid transparent;
        font-size: 1.8rem;
        font-weight: 800;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
        touch-action: manipulation;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      @media (hover: hover) {
        .sort-bubble:hover {
          transform: scale(1.08);
        }
      }

      .sort-bubble--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.3),
          0 4px 12px rgba(0, 0, 0, 0.12);
        transform: scale(1.12);
      }

      .sort-bubble--correct {
        border-color: #22c55e !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.3) !important;
      }

      .sort-bubble--wrong {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.25) !important;
      }
    `,
  ],
})
export class ComparisonComponent {
  readonly symbols: Array<'<' | '>' | '='> = ['<', '>', '='];
  readonly sortColors = SORT_COLORS;

  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(ComparisonOptionsStorageService);

  options = signal<ComparisonOptions>(this.storageService.loadOptions());
  exercise = signal<ComparisonExercise>(generateExercise(this.storageService.loadOptions()));

  // Symbol mode state
  selectedSymbol = signal<'<' | '>' | '=' | null>(null);

  // Sort mode state
  sortItems = signal<number[]>([]);
  sortSelected = signal<number | null>(null);

  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  barHeightA = computed(() => {
    const ex = this.exercise();
    if (ex.numberA === undefined || ex.numberB === undefined) return 20;
    const max = Math.max(ex.numberA, ex.numberB, 1);
    return Math.max(6, Math.round((ex.numberA / max) * 120));
  });

  barHeightB = computed(() => {
    const ex = this.exercise();
    if (ex.numberA === undefined || ex.numberB === undefined) return 20;
    const max = Math.max(ex.numberA, ex.numberB, 1);
    return Math.max(6, Math.round((ex.numberB / max) * 120));
  });

  isSortCorrect = computed(() => {
    const items = this.sortItems();
    const expected = this.exercise().sortedNumbers ?? [];
    return items.every((v, i) => v === expected[i]);
  });

  feedbackMessage = computed(() => {
    const ex = this.exercise();
    if (this.feedbackType() === 'success') {
      return this.feedbackService.getMessage('success');
    }
    if (this.feedbackType() === 'show-answer') {
      if (ex.mode === 'symbol') {
        return `La risposta corretta è "${ex.correctSymbol}". Proviamo con un altro esercizio!`;
      }
      const sorted = (ex.sortedNumbers ?? []).join(', ');
      return `L'ordine corretto è: ${sorted}. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
    // Inizializza sortItems al primo caricamento
    this.resetSortItems();
  }

  private resetSortItems(): void {
    const nums = this.exercise().numbers;
    if (nums) this.sortItems.set([...nums]);
    this.sortSelected.set(null);
  }

  // ---- Symbol mode ----

  selectSymbol(sym: '<' | '>' | '='): void {
    if (!this.showFeedback()) this.selectedSymbol.set(sym);
  }

  verifySymbol(): void {
    const chosen = this.selectedSymbol();
    if (chosen === null) return;
    this.attemptCount.update((c) => c + 1);
    if (chosen === this.exercise().correctSymbol) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- Sort mode ----

  toggleSortSelect(index: number): void {
    if (this.showFeedback()) return;
    const current = this.sortSelected();
    if (current === null) {
      this.sortSelected.set(index);
    } else if (current === index) {
      this.sortSelected.set(null);
    } else {
      // Scambia i due elementi
      this.sortItems.update((items) => {
        const arr = [...items];
        [arr[current], arr[index]] = [arr[index], arr[current]];
        return arr;
      });
      this.sortSelected.set(null);
    }
  }

  verifySort(): void {
    this.attemptCount.update((c) => c + 1);
    if (this.isSortCorrect()) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- Common ----

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.selectedSymbol.set(null);
  }

  nextExercise(): void {
    this.exercise.set(generateExercise(this.options()));
    this.selectedSymbol.set(null);
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
    this.resetSortItems();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  setMode(mode: ComparisonMode): void {
    this.options.update((o) => ({ ...o, mode }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setLevel(level: ComparisonLevel): void {
    this.options.update((o) => ({ ...o, level }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  toggleBars(): void {
    this.options.update((o) => ({ ...o, showBars: !o.showBars }));
  }
}
