import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-array-representation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="array-representation" aria-labelledby="array-title">
      <h3 id="array-title">{{ title() }}</h3>
      <p class="array-representation__description">
        {{ rows() }} gruppi da {{ columns() }} elementi.
      </p>
      <div
        class="array-representation__grid"
        [style.--column-count]="columns()"
        aria-hidden="true"
      >
        @for (cell of cells(); track cell) {
          <span class="array-representation__cell"></span>
        }
      </div>
      <p class="sr-only">
        {{ rows() }} per {{ columns() }} uguale {{ rows() * columns() }}.
      </p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(100%, 22rem);
      }

      .array-representation {
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

      .array-representation__description {
        margin: 0.25rem 0 1rem;
        color: var(--color-text-secondary);
        text-align: center;
      }

      .array-representation__grid {
        display: grid;
        grid-template-columns: repeat(var(--column-count), minmax(1rem, 1fr));
        gap: 0.35rem;
      }

      .array-representation__cell {
        aspect-ratio: 1;
        border: 2px solid var(--color-primary-strong);
        border-radius: 0.45rem;
        background: var(--color-info);
      }
    `,
  ],
})
export class ArrayRepresentationComponent {
  rows = input.required<number>();
  columns = input.required<number>();
  title = input('Schieramento di gruppi uguali');

  cells = computed(() => Array.from({ length: this.rows() * this.columns() }, (_, index) => index));
}
