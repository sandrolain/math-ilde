import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-ten-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ten-frame" aria-labelledby="ten-frame-title">
      <h3 id="ten-frame-title">Cornice del dieci</h3>
      <div class="ten-frame__grid" aria-hidden="true">
        @for (cell of cells(); track cell) {
          <span class="ten-frame__cell" [class.ten-frame__cell--filled]="cell <= filled()">
            {{ cell <= filled() ? '●' : '' }}
          </span>
        }
      </div>
      <p class="sr-only">{{ filled() }} elementi su 10 sono evidenziati.</p>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(100%, 22rem);
      }

      .ten-frame {
        padding: 1rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }

      h3 {
        margin: 0 0 0.75rem;
        color: var(--color-text-primary);
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
      }

      .ten-frame__grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 0.35rem;
      }

      .ten-frame__cell {
        display: grid;
        place-items: center;
        aspect-ratio: 1;
        border: 2px solid var(--color-primary);
        border-radius: 0.45rem;
        color: transparent;
        background: white;
        font-size: 1.5rem;
      }

      .ten-frame__cell--filled {
        color: var(--color-text-primary);
        background: var(--color-info);
      }
    `,
  ],
})
export class TenFrameComponent {
  filled = input.required<number>();

  cells = computed(() => Array.from({ length: 10 }, (_, index) => index + 1));
}
