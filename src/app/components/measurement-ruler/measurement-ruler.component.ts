import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-measurement-ruler',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="ruler" [attr.aria-label]="ariaLabel()">
      <figcaption>Scala graduata</figcaption>
      <div class="ruler__track" aria-hidden="true">
        <div class="ruler__fill" [style.width.%]="fillPercent()"></div>
        @for (mark of marks(); track mark.value) {
          <div class="ruler__mark" [style.left.%]="mark.position">
            <span class="ruler__tick"></span>
            <span class="ruler__number">{{ mark.value }}</span>
          </div>
        }
      </div>
      <p class="ruler__value">{{ value() }} {{ unit() }}</p>
    </figure>
  `,
  styles: [
    `
      :host {
        display: block;
        width: min(100%, 34rem);
        margin: 1.5rem auto;
      }

      .ruler {
        margin: 0;
        padding: 1rem 1.25rem;
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
      }

      figcaption {
        margin-bottom: 2rem;
        color: var(--color-text-primary);
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
      }

      .ruler__track {
        position: relative;
        height: 0.75rem;
        border-radius: 1rem;
        background: var(--color-background);
      }

      .ruler__fill {
        height: 100%;
        border-radius: inherit;
        background: var(--color-primary-strong);
      }

      .ruler__mark {
        position: absolute;
        top: 0;
        display: grid;
        justify-items: center;
        transform: translateX(-50%);
      }

      .ruler__tick {
        width: 0.15rem;
        height: 1.1rem;
        background: var(--color-text-secondary);
      }

      .ruler__number {
        margin-top: 0.45rem;
        color: var(--color-text-secondary);
        font-size: 0.9rem;
        font-weight: 700;
      }

      .ruler__value {
        margin: 2.25rem 0 0;
        color: var(--color-primary-strong);
        font-size: 1.25rem;
        font-weight: 800;
        text-align: center;
      }
    `,
  ],
})
export class MeasurementRulerComponent {
  readonly value = input.required<number>();
  readonly max = input.required<number>();
  readonly unit = input.required<string>();

  readonly fillPercent = computed(() => Math.min(100, (this.value() / this.max()) * 100));
  readonly marks = computed(() =>
    Array.from({ length: 6 }, (_, index) => {
      const value = Math.round((this.max() / 5) * index);
      return { value, position: (index / 5) * 100 };
    }),
  );
  readonly ariaLabel = computed(
    () => `Scala graduata da zero a ${this.max()} ${this.unit()}. Valore: ${this.value()} ${this.unit()}`,
  );
}
