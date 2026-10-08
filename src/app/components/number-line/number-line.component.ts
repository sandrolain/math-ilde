import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-number-line',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="number-line" aria-labelledby="number-line-title">
      <h3 id="number-line-title">Linea dei numeri</h3>
      @if (showAnswer()) {
        <p class="number-line__description">Parti da {{ start() }} e arriva a {{ target() }}.</p>
      } @else {
        <p class="number-line__description">Osserva i passi sulla linea dei numeri.</p>
      }
      <div
        class="number-line__track"
        [style.--point-count]="points().length"
        aria-hidden="true"
      >
        @for (point of points(); track point) {
          <span
            class="number-line__point"
          [class.number-line__point--start]="highlightPoints() && point === start()"
          [class.number-line__point--target]="highlightPoints() && point === target()"
          >
            <span class="number-line__dot"></span>
          @if (showLabels()) {
            <span>{{ point }}</span>
          }
        </span>
        }
      </div>
      @if (showAnswer()) {
        <p class="sr-only">
          Il punto di partenza è {{ start() }}. Il risultato è {{ target() }}.
        </p>
      } @else {
        <p class="sr-only">Linea dei numeri da osservare durante l'esercizio.</p>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(100%, 42rem);
      }

      .number-line {
        padding: 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }

      h3 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
      }

      .number-line__description {
        margin: 0.25rem 0 1rem;
        color: var(--color-text-secondary);
        text-align: center;
      }

      .number-line__track {
        display: grid;
        grid-template-columns: repeat(var(--point-count), minmax(1.5rem, 1fr));
        gap: 0.25rem;
        align-items: end;
        min-height: 3.5rem;
        border-bottom: 3px solid var(--color-primary-strong);
      }

      .number-line__point {
        display: grid;
        justify-items: center;
        gap: 0.35rem;
        color: var(--color-text-secondary);
        font-size: 0.85rem;
      }

      .number-line__dot {
        width: 0.75rem;
        height: 0.75rem;
        border: 2px solid var(--color-primary-strong);
        border-radius: 50%;
        background: var(--color-surface);
      }

      .number-line__point--start,
      .number-line__point--target {
        color: var(--color-text-primary);
        font-weight: 800;
      }

      .number-line__point--start .number-line__dot {
        background: var(--color-info);
      }

      .number-line__point--target .number-line__dot {
        background: var(--color-success);
      }
    `,
  ],
})
export class NumberLineComponent {
  start = input.required<number>();
  target = input.required<number>();
  showAnswer = input(true);
  showLabels = input(true);
  highlightPoints = input(true);
  rangeEnd = input<number | null>(null);

  points = computed(() => {
    const end = this.rangeEnd();
    if (end !== null) {
      return Array.from({ length: end + 1 }, (_, index) => index);
    }
    const first = Math.min(this.start(), this.target());
    const last = Math.max(this.start(), this.target());
    return Array.from({ length: last - first + 1 }, (_, index) => first + index);
  });
}
