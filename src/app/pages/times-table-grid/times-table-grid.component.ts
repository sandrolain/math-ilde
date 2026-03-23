import { Component, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../components/header/header.component';

/**
 * Pastel palette — alternating colors for each block.
 * Blocks cycle through this array so adjacent blocks are always distinguishable.
 */
const BLOCK_COLORS = [
  '#fda4af', // rose
  '#93c5fd', // blue
  '#86efac', // green
  '#fcd34d', // yellow
  '#c4b5fd', // violet
  '#fdba74', // orange
  '#67e8f9', // cyan
  '#d9f99d', // lime
  '#f9a8d4', // pink
  '#a5b4fc', // indigo
];

interface GridCell {
  /** 0-based block index, or -1 for empty */
  blockIndex: number;
  color: string;
}

@Component({
  selector: 'app-times-table-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HeaderComponent, FormsModule],
  host: { class: 'block' },
  template: `
    <app-header title="Tabelline a Blocchi" />

    <main class="main-wrap">
      <!-- Controls -->
      <div class="controls-card" role="region" aria-label="Scegli la moltiplicazione">
        <div class="selects-row">
          <div class="select-group">
            <label class="select-label" for="factor-a">Primo fattore</label>
            <select
              id="factor-a"
              class="factor-select"
              [(ngModel)]="factorA"
              (ngModelChange)="onFactorChange()"
              aria-label="Primo fattore"
            >
              @for (n of factors; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
          </div>

          <span class="op-symbol" aria-hidden="true">×</span>

          <div class="select-group">
            <label class="select-label" for="factor-b">Secondo fattore</label>
            <select
              id="factor-b"
              class="factor-select"
              [(ngModel)]="factorB"
              (ngModelChange)="onFactorChange()"
              aria-label="Secondo fattore"
            >
              @for (n of factors; track n) {
                <option [value]="n">{{ n }}</option>
              }
            </select>
          </div>

          <span class="op-symbol" aria-hidden="true">=</span>
          <span
            class="result-value"
            [attr.aria-label]="factorA + ' per ' + factorB + ' uguale ' + result()"
            >{{ result() }}</span
          >
        </div>

        <p class="operation-desc">
          {{ factorB() }} blocchi da {{ factorA() }} celle ciascuno — totale {{ result() }} celle
        </p>
      </div>

      <!-- Grid -->
      <div class="grid-scroll" role="region" aria-label="Griglia delle moltiplicazioni">
        <div
          class="grid-wrap"
          role="grid"
          [attr.aria-label]="'Griglia 10 colonne per ' + gridRows + ' righe'"
        >
          <!-- Column headers -->
          <div class="grid-row">
            <div class="grid-corner" aria-hidden="true"></div>
            @for (col of colRange; track col) {
              <div class="col-header" aria-hidden="true">{{ col + 1 }}</div>
            }
          </div>

          <!-- Data rows -->
          @for (row of rowRange; track row) {
            <div class="grid-row" role="row">
              <div class="row-header" aria-hidden="true">{{ row + 1 }}</div>
              @for (col of colRange; track col) {
                @let cell = grid()[row * 10 + col];
                <div
                  class="grid-cell"
                  role="gridcell"
                  [style.background-color]="cell.blockIndex >= 0 ? cell.color : '#f3f4f6'"
                  [class.cell-filled]="cell.blockIndex >= 0"
                  [attr.aria-label]="getCellLabel(row, col, cell)"
                ></div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Legend -->
      <div class="legend" role="list" aria-label="Legenda blocchi">
        @for (b of blockRange(); track b) {
          <div class="legend-item" role="listitem">
            <span
              class="legend-dot"
              [style.background-color]="BLOCK_COLORS[b % BLOCK_COLORS.length]"
              aria-hidden="true"
            ></span>
            <span>Blocco {{ b + 1 }} ({{ factorA() }} celle)</span>
          </div>
        }
      </div>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .main-wrap {
        max-width: 640px;
        margin: 0 auto;
        padding: 1rem 1rem 3rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        align-items: center;
      }

      .controls-card {
        width: 100%;
        background: white;
        border-radius: 1.25rem;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
        border: 2px solid var(--color-primary, #a8d8ea);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }

      .selects-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: center;
      }

      .select-group {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .select-label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--color-text-secondary, #718096);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .factor-select {
        height: 52px;
        width: 80px;
        font-size: 1.75rem;
        font-weight: 700;
        text-align: center;
        border: 2px solid var(--color-primary, #a8d8ea);
        border-radius: 0.75rem;
        background: #f0f9ff;
        color: var(--color-text-primary, #4a5568);
        cursor: pointer;
        appearance: none;
        -webkit-appearance: none;
        padding: 0 0.5rem;
      }

      .factor-select:focus-visible {
        outline: 3px solid var(--color-primary, #a8d8ea);
        outline-offset: 2px;
      }

      .op-symbol {
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-text-secondary, #718096);
        line-height: 1;
        align-self: flex-end;
        padding-bottom: 0.25rem;
      }

      .result-value {
        font-size: 2.5rem;
        font-weight: 800;
        color: var(--color-text-primary, #4a5568);
        min-width: 3rem;
        text-align: center;
        align-self: flex-end;
        padding-bottom: 0.125rem;
      }

      .operation-desc {
        font-size: 0.9rem;
        color: var(--color-text-secondary, #718096);
        text-align: center;
      }

      .grid-scroll {
        width: 100%;
        overflow-x: auto;
      }

      .grid-wrap {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 320px;
        width: min(540px, 100%);
        margin: 0 auto;
      }

      .grid-row {
        display: grid;
        grid-template-columns: 1.5rem repeat(10, 1fr);
        gap: 2px;
      }

      .grid-corner {
        /* empty */
      }

      .col-header,
      .row-header {
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 600;
        color: var(--color-text-secondary, #9ca3af);
        user-select: none;
      }

      .col-header {
        height: 1.5rem;
      }

      .row-header {
        height: 100%;
      }

      .grid-cell {
        aspect-ratio: 1;
        border-radius: 3px;
        border: 1.5px solid rgba(0, 0, 0, 0.08);
        transition: background-color 0.3s ease;
      }

      .grid-cell.cell-filled {
        border-color: rgba(0, 0, 0, 0.12);
      }

      .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem 1rem;
        justify-content: center;
        width: 100%;
      }

      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.85rem;
        color: var(--color-text-secondary, #718096);
      }

      .legend-dot {
        display: inline-block;
        width: 1rem;
        height: 1rem;
        border-radius: 3px;
        border: 1.5px solid rgba(0, 0, 0, 0.1);
        flex-shrink: 0;
      }
    `,
  ],
})
export class TimesTableGridComponent {
  readonly BLOCK_COLORS = BLOCK_COLORS;
  readonly factors = Array.from({ length: 10 }, (_, i) => i + 1);
  readonly colRange = Array.from({ length: 10 }, (_, i) => i);

  factorA = signal(3);
  factorB = signal(4);

  result = computed(() => this.factorA() * this.factorB());

  /** Number of grid rows needed (always at least 1) */
  gridRows = 10;
  rowRange = Array.from({ length: 10 }, (_, i) => i);

  blockRange = computed(() => Array.from({ length: this.factorB() }, (_, i) => i));

  /**
   * Flat array of 100 cells (10 rows × 10 cols).
   * Cells are filled left-to-right, top-to-bottom in groups of factorA.
   * Each group (block) cycle through BLOCK_COLORS.
   */
  grid = computed<GridCell[]>(() => {
    const a = this.factorA();
    const b = this.factorB();
    const total = a * b;
    const cells: GridCell[] = Array.from({ length: 100 }, () => ({
      blockIndex: -1,
      color: 'transparent',
    }));

    let cellIdx = 0;
    for (let block = 0; block < b; block++) {
      const color = BLOCK_COLORS[block % BLOCK_COLORS.length];
      for (let j = 0; j < a; j++) {
        if (cellIdx < 100) {
          cells[cellIdx] = { blockIndex: block, color };
          cellIdx++;
        }
      }
    }
    return cells;
  });

  onFactorChange(): void {
    // grid() is computed automatically; nothing extra needed
  }

  getCellLabel(row: number, col: number, cell: GridCell): string {
    if (cell.blockIndex < 0) return `Cella vuota riga ${row + 1} colonna ${col + 1}`;
    return `Blocco ${cell.blockIndex + 1}, riga ${row + 1} colonna ${col + 1}`;
  }
}
