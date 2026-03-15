import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { HeaderComponent } from '../../components/header/header.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { NumericKeyboardComponent } from '../../components/numeric-keyboard/numeric-keyboard.component';
import { SidebarOptionsComponent } from '../../components/sidebar-options/sidebar-options.component';
import { rnd, shuffle } from '../../utils/math-utils';
import { FeedbackService } from '../../services/feedback.service';
import { GeometryOptionsStorageService } from '../../services/geometry-options-storage.service';
import type {
  FeedbackType,
  GeometryOptions,
  GeometryMode,
  GeometryShapeId,
  GeometryShapeItem,
  GeometryExercise,
} from '../../types/exercise.types';

// ---- Definizioni geometriche ----

interface ShapeDef {
  id: GeometryShapeId;
  label: string;
  sides: number;
  /** path SVG (viewBox 0 0 100 100) */
  path: string;
}

const SHAPES: ShapeDef[] = [
  {
    id: 'circle',
    label: 'Cerchio',
    sides: 0,
    path: '<circle cx="50" cy="50" r="44" />',
  },
  {
    id: 'triangle',
    label: 'Triangolo',
    sides: 3,
    path: '<polygon points="50,6 94,94 6,94" />',
  },
  {
    id: 'square',
    label: 'Quadrato',
    sides: 4,
    path: '<rect x="8" y="8" width="84" height="84" />',
  },
  {
    id: 'rectangle',
    label: 'Rettangolo',
    sides: 4,
    path: '<rect x="4" y="22" width="92" height="56" />',
  },
  {
    id: 'rhombus',
    label: 'Rombo',
    sides: 4,
    path: '<polygon points="50,4 96,50 50,96 4,50" />',
  },
  {
    id: 'pentagon',
    label: 'Pentagono',
    sides: 5,
    path: '<polygon points="50,5 95,36 78,90 22,90 5,36" />',
  },
  {
    id: 'hexagon',
    label: 'Esagono',
    sides: 6,
    path: '<polygon points="50,4 92,27 92,73 50,96 8,73 8,27" />',
  },
  {
    id: 'octagon',
    label: 'Ottagono',
    sides: 8,
    path: '<polygon points="30,4 70,4 96,30 96,70 70,96 30,96 4,70 4,30" />',
  },
];

const SHAPE_MAP = new Map<GeometryShapeId, ShapeDef>(SHAPES.map((s) => [s.id, s]));

const BASIC_SHAPES: GeometryShapeId[] = ['circle', 'triangle', 'square', 'rectangle'];
const ADVANCED_SHAPES: GeometryShapeId[] = ['rhombus', 'pentagon', 'hexagon', 'octagon'];
const ALL_SHAPES: GeometryShapeId[] = SHAPES.map((s) => s.id);

// Palette colori pastel per le figure nella griglia find-all
const GRID_COLORS = [
  '#a8d8ea',
  '#ffb6c1',
  '#b4e7ce',
  '#f0e68c',
  '#c8b4e7',
  '#ffc8a2',
  '#b8e0ff',
  '#d4f1c4',
  '#ffd6e7',
];

function getPool(group: GeometryOptions['shapeGroup']): GeometryShapeId[] {
  if (group === 'basic') return BASIC_SHAPES;
  if (group === 'advanced') return ADVANCED_SHAPES;
  return ALL_SHAPES;
}

function buildNameChoices(correct: GeometryShapeId, pool: GeometryShapeId[]): GeometryShapeId[] {
  const distractors = pool.filter((id) => id !== correct);
  const picked = shuffle(distractors).slice(0, 3);
  return shuffle([correct, ...picked]);
}

function generateExercise(opts: GeometryOptions): GeometryExercise {
  const pool = getPool(opts.shapeGroup);

  if (opts.mode === 'recognize') {
    const targetShape = pool[rnd(0, pool.length - 1)];
    const nameChoices = buildNameChoices(targetShape, pool);
    const correctNameIndex = nameChoices.indexOf(targetShape);
    return {
      mode: 'recognize',
      targetShape,
      targetVariant: rnd(0, 3),
      nameChoices,
      correctNameIndex,
    };
  }

  if (opts.mode === 'count-sides') {
    const targetShape = pool[rnd(0, pool.length - 1)];
    const def = SHAPE_MAP.get(targetShape)!;
    return {
      mode: 'count-sides',
      targetShape,
      targetVariant: rnd(0, 3),
      correctSides: def.sides,
    };
  }

  // find-all: griglia 3×3 (9 celle)
  const findType = pool[rnd(0, pool.length - 1)];
  // Almeno 2 occorrenze del tipo da trovare, ma non tutte uguali
  const targetCount = rnd(2, 4);
  const otherPool = pool.filter((id) => id !== findType);
  const gridItems: GeometryShapeItem[] = [];

  // Aggiungi le figure target
  for (let i = 0; i < targetCount; i++) {
    gridItems.push({ id: findType, variant: rnd(0, 3) });
  }
  // Riempi le restanti celle con figure diverse
  for (let i = gridItems.length; i < 9; i++) {
    const otherId = otherPool[rnd(0, otherPool.length - 1)];
    gridItems.push({ id: otherId, variant: rnd(0, 3) });
  }
  const shuffled = shuffle(gridItems);
  const correctIndices = shuffled.reduce<number[]>((acc, item, idx) => {
    if (item.id === findType) acc.push(idx);
    return acc;
  }, []);

  return { mode: 'find-all', gridItems: shuffled, findType, correctIndices };
}

// Rotazioni di variante per dare varietà visiva senza cambiare la figura
const VARIANT_ROTATIONS = [0, 15, -15, 30];

@Component({
  selector: 'app-geometry',
  imports: [HeaderComponent, FeedbackComponent, NumericKeyboardComponent, SidebarOptionsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Geometria di Base" />

      <div class="container-main">
        <div class="layout-exercise">
          <!-- Sidebar opzioni -->
          <app-sidebar-options [(open)]="mobileMenuOpen">
            <!-- Modalità -->
            <div class="space-y-2">
              <span class="section-label">Modalità:</span>
              <div class="space-y-2">
                <label class="option-item">
                  <input
                    type="radio"
                    name="mode"
                    value="recognize"
                    class="option-input"
                    [checked]="options().mode === 'recognize'"
                    (change)="setMode('recognize')"
                  />
                  <span class="option-label">🔍 Riconosci la figura</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="mode"
                    value="count-sides"
                    class="option-input"
                    [checked]="options().mode === 'count-sides'"
                    (change)="setMode('count-sides')"
                  />
                  <span class="option-label">🔢 Conta i lati</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="mode"
                    value="find-all"
                    class="option-input"
                    [checked]="options().mode === 'find-all'"
                    (change)="setMode('find-all')"
                  />
                  <span class="option-label">🎯 Trova le figure</span>
                </label>
              </div>
            </div>

            <!-- Gruppo figure -->
            <div class="space-y-2">
              <span class="section-label">Figure:</span>
              <div class="space-y-2">
                <label class="option-item">
                  <input
                    type="radio"
                    name="shapeGroup"
                    value="basic"
                    class="option-input"
                    [checked]="options().shapeGroup === 'basic'"
                    (change)="setShapeGroup('basic')"
                  />
                  <span class="option-label">⭐ Semplici</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="shapeGroup"
                    value="advanced"
                    class="option-input"
                    [checked]="options().shapeGroup === 'advanced'"
                    (change)="setShapeGroup('advanced')"
                  />
                  <span class="option-label">⭐⭐ Avanzate</span>
                </label>
                <label class="option-item">
                  <input
                    type="radio"
                    name="shapeGroup"
                    value="all"
                    class="option-input"
                    [checked]="options().shapeGroup === 'all'"
                    (change)="setShapeGroup('all')"
                  />
                  <span class="option-label">⭐⭐⭐ Tutte</span>
                </label>
              </div>
            </div>
          </app-sidebar-options>

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

              <!-- ===== MODALITÀ: riconosci la figura ===== -->
              @if (exercise().mode === 'recognize') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                  Come si chiama questa figura?
                </p>

                <!-- Figura grande -->
                <div class="shape-showcase" aria-hidden="true">
                  <svg
                    viewBox="0 0 100 100"
                    width="180"
                    height="180"
                    [style.transform]="
                      'rotate(' + variantRotation(exercise().targetVariant ?? 0) + 'deg)'
                    "
                    [attr.aria-label]="'Figura geometrica'"
                  >
                    <g
                      [innerHTML]="shapeInnerHTML(exercise().targetShape!)"
                      fill="#a8d8ea"
                      stroke="#5ba4c4"
                      stroke-width="3"
                    />
                  </svg>
                </div>

                <!-- 4 opzioni nome -->
                <div class="name-choices" role="group" aria-label="Scegli il nome della figura">
                  @for (shapeId of exercise().nameChoices; track $index) {
                    <button
                      class="name-btn"
                      [class.name-btn--selected]="selectedNameIndex() === $index"
                      [class.name-btn--correct]="
                        showFeedback() && $index === exercise().correctNameIndex
                      "
                      [class.name-btn--wrong]="
                        showFeedback() &&
                        selectedNameIndex() === $index &&
                        $index !== exercise().correctNameIndex
                      "
                      (click)="selectName($index)"
                      [attr.aria-pressed]="selectedNameIndex() === $index"
                      [attr.aria-label]="shapeName(shapeId)"
                    >
                      {{ shapeName(shapeId) }}
                    </button>
                  }
                </div>

                <div class="mt-6 max-w-sm mx-auto">
                  <button
                    (click)="verifyRecognize()"
                    class="btn btn-primary w-full"
                    [disabled]="selectedNameIndex() === null"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- ===== MODALITÀ: conta i lati ===== -->
              @if (exercise().mode === 'count-sides') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                  Quanti lati ha questa figura?
                </p>

                <!-- Figura grande -->
                <div class="shape-showcase" aria-hidden="true">
                  <svg
                    viewBox="0 0 100 100"
                    width="180"
                    height="180"
                    [style.transform]="
                      'rotate(' + variantRotation(exercise().targetVariant ?? 0) + 'deg)'
                    "
                    aria-hidden="true"
                  >
                    <g
                      [innerHTML]="shapeInnerHTML(exercise().targetShape!)"
                      fill="#ffb6c1"
                      stroke="#d4829a"
                      stroke-width="3"
                    />
                  </svg>
                </div>

                <!-- Input risposta -->
                <div class="sides-input-row" aria-label="Inserisci il numero di lati">
                  <div
                    class="sides-slot"
                    [attr.aria-label]="
                      sidesStr() ? sidesStr() + ' lati' : 'Inserisci il numero di lati'
                    "
                  >
                    {{ sidesStr() || '?' }}
                  </div>
                  <span class="sides-label">lati</span>
                </div>

                <div class="max-w-sm mx-auto mt-4">
                  <app-numeric-keyboard
                    (numberPressed)="onSideNumberPressed($event)"
                    (backspacePressed)="onSideBackspace()"
                    (clearPressed)="onSideClear()"
                  />
                </div>

                <div class="mt-4 max-w-sm mx-auto">
                  <button
                    (click)="verifySides()"
                    class="btn btn-primary w-full"
                    [disabled]="sidesStr().length === 0"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- ===== MODALITÀ: trova le figure ===== -->
              @if (exercise().mode === 'find-all') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-2">
                  Tocca tutte le figure che sono:
                </p>
                <p class="find-target-label" aria-live="polite">
                  {{ shapeName(exercise().findType!) }}
                </p>

                <!-- Griglia 3×3 -->
                <div
                  class="find-grid"
                  role="group"
                  [attr.aria-label]="
                    'Griglia di figure. Trova tutti i ' + shapeName(exercise().findType!)
                  "
                >
                  @for (item of exercise().gridItems; track $index) {
                    <button
                      class="find-cell"
                      [class.find-cell--selected]="findSelected().has($index)"
                      [class.find-cell--correct]="
                        showFeedback() && (exercise().correctIndices ?? []).includes($index)
                      "
                      [class.find-cell--wrong]="
                        showFeedback() &&
                        findSelected().has($index) &&
                        !(exercise().correctIndices ?? []).includes($index)
                      "
                      (click)="toggleFindSelect($index)"
                      [attr.aria-pressed]="findSelected().has($index)"
                      [attr.aria-label]="shapeName(item.id) + ', cella ' + ($index + 1)"
                    >
                      <svg
                        viewBox="0 0 100 100"
                        width="56"
                        height="56"
                        [style.transform]="'rotate(' + variantRotation(item.variant) + 'deg)'"
                        aria-hidden="true"
                      >
                        <g
                          [innerHTML]="shapeInnerHTML(item.id)"
                          [attr.fill]="gridColors[$index % gridColors.length]"
                          stroke="rgba(0,0,0,0.15)"
                          stroke-width="3"
                        />
                      </svg>
                    </button>
                  }
                </div>

                <div class="mt-6 max-w-sm mx-auto">
                  <button
                    (click)="verifyFindAll()"
                    class="btn btn-primary w-full"
                    [disabled]="findSelected().size === 0"
                    aria-label="Verifica la selezione"
                  >
                    Verifica la selezione
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
      /* ---- Shape showcase (modal centralizzato) ---- */
      .shape-showcase {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-bottom: 2rem;
        filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.12));
      }

      /* ---- Name choices ---- */
      .name-choices {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        max-width: 420px;
        margin: 0 auto;
      }

      .name-btn {
        padding: 1rem;
        border: 3px solid #e2e8f0;
        border-radius: 20px;
        background: white;
        font-size: 1.3rem;
        font-weight: 700;
        color: var(--color-text-primary);
        cursor: pointer;
        transition: all 0.15s ease;
        touch-action: manipulation;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
        min-height: 64px;
      }

      @media (hover: hover) {
        .name-btn:hover {
          border-color: var(--color-primary);
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
        }
      }

      .name-btn--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.07);
        transform: scale(1.04);
      }

      .name-btn--correct {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25) !important;
      }

      .name-btn--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
      }

      /* ---- Count sides input ---- */
      .sides-input-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        margin-bottom: 0.5rem;
      }

      .sides-slot {
        width: 100px;
        height: 90px;
        border: 3px solid #667eea;
        border-radius: 20px;
        background: white;
        font-size: 3rem;
        font-weight: 800;
        color: var(--color-text-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
      }

      .sides-label {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--color-text-secondary);
      }

      /* ---- Find target label ---- */
      .find-target-label {
        text-align: center;
        font-size: 2rem;
        font-weight: 800;
        color: var(--color-text-primary);
        margin-bottom: 1.75rem;
        padding: 0.5rem 1.5rem;
        background: #f0f8ff;
        border: 2.5px solid var(--color-primary);
        border-radius: 20px;
        display: inline-block;
        width: fit-content;
        margin-left: auto;
        margin-right: auto;
      }

      /* ---- Find grid 3×3 ---- */
      .find-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.75rem;
        max-width: 360px;
        margin: 0 auto;
      }

      .find-cell {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem;
        border: 3px solid #e2e8f0;
        border-radius: 16px;
        background: white;
        cursor: pointer;
        transition: all 0.15s ease;
        touch-action: manipulation;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        aspect-ratio: 1;
      }

      @media (hover: hover) {
        .find-cell:hover {
          border-color: var(--color-primary);
          transform: scale(1.05);
        }
      }

      .find-cell--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.07);
        transform: scale(1.06);
        background: #f0f0ff;
      }

      .find-cell--correct {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25) !important;
      }

      .find-cell--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
      }
    `,
  ],
})
export class GeometryComponent {
  readonly gridColors = GRID_COLORS;

  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(GeometryOptionsStorageService);
  private readonly sanitizer = inject(DomSanitizer);

  options = signal<GeometryOptions>(this.storageService.loadOptions());
  exercise = signal<GeometryExercise>(generateExercise(this.storageService.loadOptions()));

  // recognize state
  selectedNameIndex = signal<number | null>(null);

  // count-sides state
  sidesStr = signal<string>('');

  // find-all state
  findSelected = signal<Set<number>>(new Set());

  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  feedbackMessage = computed(() => {
    const ex = this.exercise();
    if (this.feedbackType() === 'success') {
      return this.feedbackService.getMessage('success');
    }
    if (this.feedbackType() === 'show-answer') {
      if (ex.mode === 'recognize') {
        return `È un ${this.shapeName(ex.targetShape!)}. Proviamo con un altro esercizio!`;
      }
      if (ex.mode === 'count-sides') {
        const sides = ex.correctSides ?? 0;
        const sideLabel = sides === 0 ? 'nessun lato (è un cerchio)' : `${sides} lati`;
        return `Questa figura ha ${sideLabel}. Proviamo con un altro esercizio!`;
      }
      return `Hai trovato ${this.findSelected().size > 0 ? 'alcune' : 'nessuna'} figura giusta. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
  }

  // ---- helpers ----

  shapeName(id: GeometryShapeId): string {
    return SHAPE_MAP.get(id)?.label ?? '';
  }

  shapeInnerHTML(id: GeometryShapeId): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(SHAPE_MAP.get(id)?.path ?? '');
  }

  variantRotation(variant: number): number {
    return VARIANT_ROTATIONS[variant % VARIANT_ROTATIONS.length];
  }

  // ---- recognize mode ----

  selectName(index: number): void {
    if (!this.showFeedback()) this.selectedNameIndex.set(index);
  }

  verifyRecognize(): void {
    const chosen = this.selectedNameIndex();
    if (chosen === null) return;
    this.attemptCount.update((c) => c + 1);
    if (chosen === this.exercise().correctNameIndex) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- count-sides mode ----

  onSideNumberPressed(num: number): void {
    if (this.sidesStr().length < 2) this.sidesStr.update((s) => s + num);
  }

  onSideBackspace(): void {
    this.sidesStr.update((s) => s.slice(0, -1));
  }

  onSideClear(): void {
    this.sidesStr.set('');
  }

  verifySides(): void {
    const val = parseInt(this.sidesStr(), 10);
    this.attemptCount.update((c) => c + 1);
    if (val === this.exercise().correctSides) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- find-all mode ----

  toggleFindSelect(index: number): void {
    if (this.showFeedback()) return;
    this.findSelected.update((s) => {
      const next = new Set(s);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  verifyFindAll(): void {
    this.attemptCount.update((c) => c + 1);
    const selected = this.findSelected();
    const correct = new Set(this.exercise().correctIndices ?? []);
    const isCorrect = selected.size === correct.size && [...selected].every((i) => correct.has(i));
    if (isCorrect) {
      this.feedbackType.set('success');
    } else if (this.attemptCount() >= 3) {
      this.feedbackType.set('show-answer');
    } else {
      this.feedbackType.set('retry');
    }
    this.showFeedback.set(true);
  }

  // ---- common ----

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.selectedNameIndex.set(null);
    this.sidesStr.set('');
    this.findSelected.set(new Set());
  }

  nextExercise(): void {
    this.exercise.set(generateExercise(this.options()));
    this.selectedNameIndex.set(null);
    this.sidesStr.set('');
    this.findSelected.set(new Set());
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  setMode(mode: GeometryMode): void {
    this.options.update((o) => ({ ...o, mode }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setShapeGroup(shapeGroup: GeometryOptions['shapeGroup']): void {
    this.options.update((o) => ({ ...o, shapeGroup }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }
}
