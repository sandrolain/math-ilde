import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface ShapeOption {
  sides: number;
  label: string;
  color: string;
}

const SHAPES: ShapeOption[] = [
  { sides: 3, label: 'Triangolo', color: '#a8d8ea' },
  { sides: 4, label: 'Quadrato', color: '#ffb6c1' },
  { sides: 5, label: 'Pentagono', color: '#b4e7ce' },
  { sides: 6, label: 'Esagono', color: '#c8b4e7' },
  { sides: 8, label: 'Ottagono', color: '#ffc8a2' },
];

function polygonPoints(sides: number): string {
  return Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides) * 2 * Math.PI - Math.PI / 2;
    return `${(100 + 78 * Math.cos(angle)).toFixed(1)},${(100 + 78 * Math.sin(angle)).toFixed(1)}`;
  }).join(' ');
}

@Component({
  selector: 'app-laboratory',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="laboratory">
      <a routerLink="/geometria" class="back-link">← Torna alla geometria</a>
      <h1>Laboratorio delle figure</h1>
      <p class="intro">Scegli una figura e osserva come cambia quando aumentano i lati.</p>

      <section class="lab-card" aria-labelledby="shape-title">
        <h2 id="shape-title">Quale figura vuoi esplorare?</h2>
        <div class="shape-picker" role="group" aria-label="Scegli una figura">
          @for (shape of shapes; track shape.sides) {
            <button
              type="button"
              class="shape-choice"
              [class.shape-choice--selected]="selectedSides() === shape.sides"
              [style.--shape-color]="shape.color"
              [attr.aria-pressed]="selectedSides() === shape.sides"
              (click)="selectShape(shape.sides)"
            >
              {{ shape.label }}
            </button>
          }
        </div>

        <div class="shape-stage">
          <svg viewBox="0 0 200 200" role="img" [attr.aria-label]="shapeDescription()">
            <polygon [attr.points]="points()" [attr.fill]="selectedShape().color" stroke="#375a7f" stroke-width="4" />
          </svg>
          <p class="shape-description">{{ shapeDescription() }}</p>
        </div>

        <div class="fact-list" aria-label="Informazioni sulla figura">
          <div><strong>{{ selectedShape().sides }}</strong><span>lati</span></div>
          <div><strong>{{ selectedShape().sides }}</strong><span>vertici</span></div>
          <div><strong>{{ selectedShape().label }}</strong><span>nome</span></div>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      :host { display: block; }
      .laboratory { width: min(100% - 2rem, 58rem); margin: 0 auto; padding: 2rem 0 4rem; }
      .back-link { color: var(--color-primary-strong); font-weight: 700; }
      h1 { margin: 1rem 0 .5rem; color: var(--color-text-primary); font-size: clamp(2rem, 6vw, 3.5rem); text-align: center; }
      .intro { margin: 0 auto 2rem; color: var(--color-text-secondary); font-size: 1.15rem; text-align: center; }
      .lab-card { padding: clamp(1rem, 4vw, 2rem); border: 2px solid var(--color-primary); border-radius: 1.25rem; background: var(--color-surface); }
      h2 { margin: 0 0 1rem; color: var(--color-text-primary); text-align: center; }
      .shape-picker { display: flex; flex-wrap: wrap; justify-content: center; gap: .75rem; }
      .shape-choice { min-height: 2.75rem; padding: .6rem 1rem; border: 2px solid var(--shape-color); border-radius: 999px; background: white; color: var(--color-text-primary); font-weight: 800; cursor: pointer; }
      .shape-choice--selected, .shape-choice:focus-visible { outline: 3px solid var(--color-primary-strong); outline-offset: 2px; background: var(--shape-color); }
      .shape-stage { display: grid; justify-items: center; margin: 2rem auto 1.5rem; }
      svg { width: min(100%, 18rem); aspect-ratio: 1; }
      .shape-description { margin: .5rem 0 0; color: var(--color-text-secondary); font-size: 1.1rem; font-weight: 700; text-align: center; }
      .fact-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: .75rem; }
      .fact-list div { display: grid; gap: .25rem; padding: .8rem; border-radius: .75rem; background: var(--color-background); text-align: center; }
      .fact-list strong { color: var(--color-primary-strong); font-size: 1.25rem; }
      .fact-list span { color: var(--color-text-secondary); }
      @media (max-width: 36rem) { .fact-list { grid-template-columns: 1fr; } }
    `,
  ],
})
export class LaboratoryComponent {
  readonly shapes = SHAPES;
  readonly selectedSides = signal(4);
  readonly selectedShape = computed(
    () => this.shapes.find((shape) => shape.sides === this.selectedSides()) ?? this.shapes[1],
  );
  readonly points = computed(() => polygonPoints(this.selectedSides()));
  readonly shapeDescription = computed(
    () => `${this.selectedShape().label}: ${this.selectedShape().sides} lati e ${this.selectedShape().sides} vertici.`,
  );

  selectShape(sides: number): void {
    this.selectedSides.set(sides);
  }
}
