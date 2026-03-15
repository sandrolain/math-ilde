import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { HeaderComponent } from '../../../components/header/header.component';
import { SidebarOptionsComponent } from '../../../components/sidebar-options/sidebar-options.component';
import { rnd, shuffle } from '../../../utils/math-utils';
import { GameMemoryOptionsStorageService } from '../../../services/game-memory-options-storage.service';
import type {
  MemoryOptions,
  MemoryOperationType,
  MemoryGridSize,
  MemoryCard,
} from '../../../types/exercise.types';

// ---- Generazione coppie ----

interface Pair {
  operation: string;
  result: string;
}

function generatePairs(opType: MemoryOperationType, count: number): Pair[] {
  const pairs: Pair[] = [];
  const usedResults = new Set<number>();
  let tries = 0;

  while (pairs.length < count && tries < 300) {
    tries++;
    let op = '';
    let result = 0;

    const type =
      opType === 'mixed'
        ? (['addition', 'subtraction', 'multiplication', 'division'] as const)[rnd(0, 3)]
        : opType;

    if (type === 'addition') {
      const a = rnd(1, 20);
      const b = rnd(1, 20);
      result = a + b;
      op = `${a} + ${b}`;
    } else if (type === 'subtraction') {
      const b = rnd(1, 15);
      const a = rnd(b, b + 15);
      result = a - b;
      op = `${a} − ${b}`;
    } else if (type === 'multiplication') {
      const a = rnd(2, 9);
      const b = rnd(2, 9);
      result = a * b;
      op = `${a} × ${b}`;
    } else {
      // division: generate by multiplying first
      const b = rnd(2, 9);
      const q = rnd(2, 9);
      result = q;
      op = `${b * q} ÷ ${b}`;
    }

    if (!usedResults.has(result)) {
      usedResults.add(result);
      pairs.push({ operation: op, result: String(result) });
    }
  }

  return pairs;
}

function buildCards(pairs: Pair[]): MemoryCard[] {
  const cards: MemoryCard[] = [];
  pairs.forEach((pair, pairId) => {
    cards.push({
      id: pairId * 2,
      pairId,
      variant: 'operation',
      label: pair.operation,
      isFlipped: false,
      isMatched: false,
    });
    cards.push({
      id: pairId * 2 + 1,
      pairId,
      variant: 'result',
      label: pair.result,
      isFlipped: false,
      isMatched: false,
    });
  });
  return shuffle(cards);
}

// Palette carte: blu operazioni, verde risultati
const OP_COLOR = '#a8d8ea';
const RES_COLOR = '#b4e7ce';
const BACK_COLOR = '#667eea';

const SUCCESS_MESSAGES = [
  'Bravo!',
  'Perfetto!',
  'Complimenti!',
  'Ottimo lavoro!',
  'Sei un campione!',
];

function medalForMoves(moves: number, totalPairs: number): { emoji: string; label: string } {
  const ratio = moves / totalPairs;
  if (ratio <= 1.5) return { emoji: '🥇', label: 'Oro' };
  if (ratio <= 2.5) return { emoji: '🥈', label: 'Argento' };
  return { emoji: '🥉', label: 'Bronzo' };
}

@Component({
  selector: 'app-game-memory',
  imports: [HeaderComponent, SidebarOptionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app min-h-screen">
      <app-header title="Memory Matematico" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <app-sidebar-options>
            <!-- Tipo operazione -->
            <div class="space-y-2">
              <span class="section-label">Operazione:</span>
              <div class="space-y-2">
                @for (op of opTypes; track op.value) {
                  <label class="option-item">
                    <input
                      type="radio"
                      name="opType"
                      [value]="op.value"
                      class="option-input"
                      [checked]="options().operationType === op.value"
                      (change)="setOpType(op.value)"
                    />
                    <span class="option-label">{{ op.label }}</span>
                  </label>
                }
              </div>
            </div>

            <!-- Dimensione griglia -->
            <div class="space-y-2">
              <span class="section-label">Difficoltà:</span>
              <div class="space-y-2">
                <label class="option-item">
                  <input
                    type="radio"
                    name="gridSize"
                    value="4x3"
                    class="option-input"
                    [checked]="options().gridSize === '4x3'"
                    (change)="setGridSize('4x3')"
                  />
                  <span class="option-label">⭐ Facile (4×3 — 6 coppie)</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="gridSize"
                    value="4x4"
                    class="option-input"
                    [checked]="options().gridSize === '4x4'"
                    (change)="setGridSize('4x4')"
                  />
                  <span class="option-label">⭐⭐ Difficile (4×4 — 8 coppie)</span>
                </label>
              </div>
            </div>

            <!-- Pulsante nuova partita -->
            <button
              (click)="newGame()"
              class="btn btn-primary w-full"
              aria-label="Inizia una nuova partita"
            >
              🔄 Nuova partita
            </button>
          </app-sidebar-options>

          <!-- Area gioco -->
          <main class="exercise-area">
            <div class="card">
              <!-- Statistiche -->
              <div class="stats-bar" aria-live="polite" aria-atomic="true">
                <div class="stat-item">
                  <span class="stat-label">Coppie</span>
                  <span class="stat-value">{{ matchedPairs() }} / {{ totalPairs() }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">Mosse</span>
                  <span class="stat-value">{{ moves() }}</span>
                </div>
                <button
                  (click)="newGame()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Ricomincia la partita"
                >
                  🔄 Ricomincia
                </button>
              </div>

              <!-- Legenda colori -->
              <div class="legend" aria-hidden="true">
                <span class="legend-dot" style="background: #a8d8ea"></span>
                <span class="legend-text text-(--color-text-secondary)">Operazione</span>
                <span class="legend-dot" style="background: #b4e7ce; margin-left: 1rem"></span>
                <span class="legend-text text-(--color-text-secondary)">Risultato</span>
              </div>

              <!-- Griglia carte -->
              <div
                class="memory-grid"
                [class.grid-4x3]="options().gridSize === '4x3'"
                [class.grid-4x4]="options().gridSize === '4x4'"
                role="grid"
                aria-label="Griglia Memory Matematico"
              >
                @for (card of cards(); track card.id; let i = $index) {
                  <button
                    class="memory-card"
                    [class.card-flipped]="card.isFlipped || card.isMatched"
                    [class.card-matched]="card.isMatched"
                    [class.card-wrong]="isWrongPair() && flippedIndices().includes(i)"
                    [disabled]="card.isFlipped || card.isMatched || flippedIndices().length >= 2"
                    (click)="flipCard(i)"
                    [attr.aria-label]="
                      card.isFlipped || card.isMatched
                        ? (card.variant === 'operation' ? 'Operazione: ' : 'Risultato: ') +
                          card.label
                        : 'Carta coperta ' + (i + 1)
                    "
                    [attr.aria-pressed]="card.isFlipped || card.isMatched"
                  >
                    <!-- Retro -->
                    <span class="card-back" aria-hidden="true">🧮</span>
                    <!-- Fronte -->
                    <span
                      class="card-front"
                      [style.background]="card.variant === 'operation' ? opColor : resColor"
                      aria-hidden="true"
                    >
                      {{ card.label }}
                    </span>
                  </button>
                }
              </div>

              <!-- Overlay fine partita -->
              @if (isComplete()) {
                <div
                  class="overlay"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Partita completata"
                >
                  <div class="overlay-box">
                    <div class="medal-icon" aria-hidden="true">
                      {{ medal().emoji }}
                    </div>
                    <h2 class="overlay-title">
                      {{ successMessage() }}
                    </h2>
                    <p class="overlay-sub">
                      Hai trovato tutte le {{ totalPairs() }} coppie in
                      <strong>{{ moves() }} mosse</strong>!
                    </p>
                    <p class="overlay-medal">Medaglia {{ medal().label }}</p>
                    <button
                      (click)="newGame()"
                      class="btn btn-primary mt-6"
                      aria-label="Gioca ancora"
                    >
                      🔄 Gioca ancora!
                    </button>
                  </div>
                </div>
              }
            </div>
          </main>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ---- Stats bar ---- */
      .stats-bar {
        display: flex;
        align-items: center;
        gap: 1.5rem;
        margin-bottom: 1rem;
        flex-wrap: wrap;
      }

      .stat-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        min-width: 60px;
      }

      .stat-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .stat-value {
        font-size: 1.5rem;
        font-weight: 800;
        color: var(--color-text-primary);
      }

      /* ---- Legend ---- */
      .legend {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        margin-bottom: 1.25rem;
        font-size: 0.85rem;
      }

      .legend-dot {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: inline-block;
        flex-shrink: 0;
      }

      /* ---- Grid ---- */
      .memory-grid {
        display: grid;
        gap: 0.6rem;
        justify-content: center;
      }

      .grid-4x3 {
        grid-template-columns: repeat(4, 1fr);
        max-width: 480px;
        margin: 0 auto;
      }

      .grid-4x4 {
        grid-template-columns: repeat(4, 1fr);
        max-width: 480px;
        margin: 0 auto;
      }

      /* ---- Card flip ---- */
      .memory-card {
        position: relative;
        aspect-ratio: 3/4;
        border: none;
        background: transparent;
        cursor: pointer;
        perspective: 600px;
        touch-action: manipulation;
        border-radius: 14px;
        min-height: 80px;
      }

      .memory-card:disabled {
        cursor: default;
      }

      .card-back,
      .card-front {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        font-weight: 700;
        transition:
          transform 0.4s ease,
          box-shadow 0.2s;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        border: 2.5px solid rgba(0, 0, 0, 0.08);
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
      }

      .card-back {
        background: #667eea;
        color: white;
        font-size: 1.6rem;
        transform: rotateY(0deg);
      }

      .card-front {
        font-size: clamp(0.85rem, 2.5vw, 1.15rem);
        text-align: center;
        padding: 0.4rem;
        color: #2d3748;
        transform: rotateY(180deg);
        line-height: 1.2;
      }

      /* Flipped state */
      .card-flipped .card-back {
        transform: rotateY(-180deg);
      }

      .card-flipped .card-front {
        transform: rotateY(0deg);
      }

      /* Hover (non flipped) */
      @media (hover: hover) {
        .memory-card:not(:disabled):not(.card-flipped):hover .card-back {
          transform: rotateY(-15deg);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
        }
      }

      /* Matched */
      .card-matched .card-front {
        border-color: #22c55e !important;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.3) !important;
      }

      /* Wrong pair flash */
      .card-wrong .card-front {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.25) !important;
        animation: wrongShake 0.4s ease;
      }

      @keyframes wrongShake {
        0%,
        100% {
          transform: rotateY(0deg) translateX(0);
        }
        25% {
          transform: rotateY(0deg) translateX(-4px);
        }
        75% {
          transform: rotateY(0deg) translateX(4px);
        }
      }

      /* ---- Overlay fine partita ---- */
      .overlay {
        position: absolute;
        inset: 0;
        background: rgba(255, 255, 255, 0.92);
        border-radius: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        animation: fadeIn 0.4s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: scale(0.95);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      .overlay-box {
        text-align: center;
        padding: 2rem;
      }

      .medal-icon {
        font-size: 4rem;
        margin-bottom: 0.75rem;
      }

      .overlay-title {
        font-size: 2rem;
        font-weight: 800;
        color: var(--color-text-primary);
        margin-bottom: 0.5rem;
      }

      .overlay-sub {
        font-size: 1.1rem;
        color: var(--color-text-secondary);
        margin-bottom: 0.25rem;
      }

      .overlay-medal {
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-text-primary);
      }

      /* Position relative on the card container so overlay is scoped */
      .card {
        position: relative;
        overflow: hidden;
      }
    `,
  ],
})
export class GameMemoryComponent {
  readonly opColor = OP_COLOR;
  readonly resColor = RES_COLOR;

  readonly opTypes: { value: MemoryOperationType; label: string }[] = [
    { value: 'addition', label: '➕ Addizioni' },
    { value: 'subtraction', label: '➖ Sottrazioni' },
    { value: 'multiplication', label: '✖️ Moltiplicazioni' },
    { value: 'division', label: '➗ Divisioni' },
    { value: 'mixed', label: '🔀 Misto' },
  ];

  private readonly storageService = inject(GameMemoryOptionsStorageService);

  options = signal<MemoryOptions>(this.storageService.loadOptions());
  cards = signal<MemoryCard[]>([]);
  flippedIndices = signal<number[]>([]);
  moves = signal<number>(0);
  isComplete = signal<boolean>(false);
  isWrongPair = signal<boolean>(false);
  successMessage = signal<string>(SUCCESS_MESSAGES[0]);

  matchedPairs = computed(
    () => this.cards().filter((c) => c.isMatched && c.variant === 'operation').length,
  );
  totalPairs = computed(() => this.cards().length / 2);
  medal = computed(() => medalForMoves(this.moves(), this.totalPairs()));

  private flipTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
    this.newGame();
  }

  newGame(): void {
    if (this.flipTimeout) {
      clearTimeout(this.flipTimeout);
      this.flipTimeout = null;
    }
    const count = this.options().gridSize === '4x4' ? 8 : 6;
    const pairs = generatePairs(this.options().operationType, count);
    this.cards.set(buildCards(pairs));
    this.flippedIndices.set([]);
    this.moves.set(0);
    this.isComplete.set(false);
    this.isWrongPair.set(false);
    this.successMessage.set(SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]);
  }

  flipCard(index: number): void {
    if (this.flipTimeout) return;
    const cards = this.cards();
    const card = cards[index];
    if (!card || card.isFlipped || card.isMatched) return;
    const flipped = this.flippedIndices();
    if (flipped.length >= 2) return;

    // Flip the card
    this.cards.update((cs) => cs.map((c, i) => (i === index ? { ...c, isFlipped: true } : c)));
    const newFlipped = [...flipped, index];
    this.flippedIndices.set(newFlipped);

    if (newFlipped.length === 2) {
      this.moves.update((m) => m + 1);
      const [a, b] = newFlipped;
      const ca = this.cards()[a];
      const cb = this.cards()[b];

      if (ca.pairId === cb.pairId) {
        // Match!
        this.flipTimeout = setTimeout(() => {
          this.cards.update((cs) =>
            cs.map((c, i) => (i === a || i === b ? { ...c, isMatched: true } : c)),
          );
          this.flippedIndices.set([]);
          this.flipTimeout = null;
          const allMatched = this.cards().every((c) => c.isMatched);
          if (allMatched) this.isComplete.set(true);
        }, 600);
      } else {
        // No match — show briefly then flip back
        this.isWrongPair.set(true);
        this.flipTimeout = setTimeout(() => {
          this.cards.update((cs) =>
            cs.map((c, i) => (i === a || i === b ? { ...c, isFlipped: false } : c)),
          );
          this.flippedIndices.set([]);
          this.isWrongPair.set(false);
          this.flipTimeout = null;
        }, 900);
      }
    }
  }

  setOpType(value: MemoryOperationType): void {
    this.options.update((o) => ({ ...o, operationType: value }));
    this.newGame();
  }

  setGridSize(value: MemoryGridSize): void {
    this.options.update((o) => ({ ...o, gridSize: value }));
    this.newGame();
  }
}
