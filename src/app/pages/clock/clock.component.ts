import {
  Component,
  signal,
  computed,
  inject,
  effect,
  ChangeDetectionStrategy,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { HeaderComponent } from '../../components/header/header.component';
import { FeedbackComponent } from '../../components/feedback/feedback.component';
import { NumericKeyboardComponent } from '../../components/numeric-keyboard/numeric-keyboard.component';
import { FeedbackService } from '../../services/feedback.service';
import { ClockOptionsStorageService } from '../../services/clock-options-storage.service';
import type {
  FeedbackType,
  ClockOptions,
  ClockPrecision,
  ClockMode,
  ClockExercise,
} from '../../types/exercise.types';

// ---- helpers ----

function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function minutePool(precision: ClockPrecision): number[] {
  if (precision === 'hours') return [0];
  if (precision === 'half-quarters') return [0, 15, 30, 45];
  // five-minutes
  return Array.from({ length: 12 }, (_, i) => i * 5);
}

function formatTime(h: number, m: number): string {
  return `${h}:${m.toString().padStart(2, '0')}`;
}

function generateChoices(
  correct: { hours: number; minutes: number },
  precision: ClockPrecision,
): Array<{ hours: number; minutes: number }> {
  const pool = minutePool(precision);
  const choices: Array<{ hours: number; minutes: number }> = [correct];
  let tries = 0;
  while (choices.length < 4 && tries < 60) {
    tries++;
    const h = rnd(1, 12);
    const m = pool[rnd(0, pool.length - 1)];
    const dup = choices.some((c) => c.hours === h && c.minutes === m);
    if (!dup) choices.push({ hours: h, minutes: m });
  }
  // shuffle
  for (let i = choices.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}

// ---- SVG clock helpers ----
const CX = 100,
  CY = 100,
  R = 90;

/** Angolo in radianti per lancetta ore: ore + minuti/60, partendo da 12 */
function hourAngle(h: number, m: number): number {
  return (((h % 12) + m / 60) / 12) * 2 * Math.PI - Math.PI / 2;
}

/** Angolo in radianti per lancetta minuti: partendo da 12 */
function minuteAngle(m: number): number {
  return (m / 60) * 2 * Math.PI - Math.PI / 2;
}

function handEnd(angleDeg: number, length: number): { x: number; y: number } {
  return {
    x: CX + length * Math.cos(angleDeg),
    y: CY + length * Math.sin(angleDeg),
  };
}

@Component({
  selector: 'app-clock',
  imports: [HeaderComponent, FeedbackComponent, NumericKeyboardComponent, NgTemplateOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="bg-app">
      <app-header title="Lettura dell'Orologio" />

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
                      value="analog-to-digital"
                      class="option-input"
                      [checked]="options().mode === 'analog-to-digital'"
                      (change)="setMode('analog-to-digital')"
                    />
                    <span class="option-label">🕐 → Scrivi l'orario</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="mode"
                      value="digital-to-analog"
                      class="option-input"
                      [checked]="options().mode === 'digital-to-analog'"
                      (change)="setMode('digital-to-analog')"
                    />
                    <span class="option-label">🔢 → Scegli l'orologio</span>
                  </label>
                </div>
              </div>

              <!-- Precisione -->
              <div class="space-y-2">
                <span class="section-label">Precisione:</span>
                <div class="space-y-2">
                  <label class="option-item">
                    <input
                      type="radio"
                      name="precision"
                      value="hours"
                      class="option-input"
                      [checked]="options().precision === 'hours'"
                      (change)="setPrecision('hours')"
                    />
                    <span class="option-label">🟢 Solo ore intere</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="precision"
                      value="half-quarters"
                      class="option-input"
                      [checked]="options().precision === 'half-quarters'"
                      (change)="setPrecision('half-quarters')"
                    />
                    <span class="option-label">🟡 Mezze ore e quarti</span>
                  </label>
                  <label class="option-item">
                    <input
                      type="radio"
                      name="precision"
                      value="five-minutes"
                      class="option-input"
                      [checked]="options().precision === 'five-minutes'"
                      (change)="setPrecision('five-minutes')"
                    />
                    <span class="option-label">🔴 Multipli di 5 minuti</span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <!-- Area esercizio -->
          <main class="exercise-area">
            <div class="card">
              <!-- Cambia esercizio -->
              <div class="text-center mb-8">
                <button
                  (click)="nextExercise()"
                  class="btn btn-secondary btn-sm"
                  aria-label="Genera un nuovo esercizio"
                >
                  ➜ Cambia esercizio
                </button>
              </div>

              <!-- ===== MODALITÀ: analogico → scrivi orario ===== -->
              @if (options().mode === 'analog-to-digital') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-8">
                  Guarda l'orologio e scrivi l'orario:
                </p>

                <!-- Orologio analogico -->
                <div class="flex justify-center mb-10">
                  <div class="clock-wrapper">
                    <ng-container
                      *ngTemplateOutlet="
                        clockFace;
                        context: { h: exercise().hours, m: exercise().minutes, size: 220 }
                      "
                    />
                  </div>
                </div>

                <!-- Input ore : minuti -->
                <div class="max-w-sm mx-auto space-y-6">
                  <div class="time-input-row" [attr.aria-label]="'Inserisci ore e minuti'">
                    <button
                      class="time-slot"
                      [class.time-slot--active]="activeField() === 'hours'"
                      [class.time-slot--filled]="hoursStr().length > 0"
                      (click)="activateField('hours')"
                      aria-label="Ore. Clicca per inserire"
                    >
                      {{ hoursStr() || '?' }}
                    </button>
                    <span class="time-colon" aria-hidden="true">:</span>
                    <button
                      class="time-slot"
                      [class.time-slot--active]="activeField() === 'minutes'"
                      [class.time-slot--filled]="minutesStr().length > 0"
                      (click)="activateField('minutes')"
                      aria-label="Minuti. Clicca per inserire"
                    >
                      {{ minutesStr() || '??' }}
                    </button>
                  </div>

                  @if (activeField() !== null) {
                    <app-numeric-keyboard
                      (numberPressed)="onNumberPressed($event)"
                      (backspacePressed)="onBackspacePressed()"
                      (clearPressed)="onClearPressed()"
                    />
                  }

                  <button
                    (click)="verifyAnalogToDigital()"
                    class="btn btn-primary w-full"
                    [disabled]="hoursStr().length === 0 || minutesStr().length === 0"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
                  </button>
                </div>
              }

              <!-- ===== MODALITÀ: digitale → scegli orologio ===== -->
              @if (options().mode === 'digital-to-analog') {
                <p class="text-center text-xl text-(--color-text-secondary) mb-6">
                  Quale orologio segna quest'orario?
                </p>

                <!-- Orario digitale grande -->
                <div
                  class="digital-display"
                  role="heading"
                  aria-level="2"
                  [attr.aria-label]="exercise().hours + ' e ' + exercise().minutes + ' minuti'"
                >
                  {{ formatTime(exercise().hours, exercise().minutes) }}
                </div>

                <!-- 4 orologi tra cui scegliere -->
                <div
                  class="choices-grid-clock"
                  role="group"
                  aria-label="Scegli l'orologio corretto"
                >
                  @for (choice of exercise().choices; track $index) {
                    <button
                      class="choice-clock"
                      [class.choice-clock--selected]="selectedChoice() === $index"
                      [class.choice-clock--correct]="
                        showFeedback() && $index === exercise().correctChoiceIndex
                      "
                      [class.choice-clock--wrong]="
                        showFeedback() &&
                        selectedChoice() === $index &&
                        $index !== exercise().correctChoiceIndex
                      "
                      (click)="selectChoice($index)"
                      [attr.aria-label]="
                        'Orologio ' + ($index + 1) + ': ' + formatTime(choice.hours, choice.minutes)
                      "
                      [attr.aria-pressed]="selectedChoice() === $index"
                    >
                      <ng-container
                        *ngTemplateOutlet="
                          clockFace;
                          context: { h: choice.hours, m: choice.minutes, size: 110 }
                        "
                      />
                    </button>
                  }
                </div>

                <div class="mt-6 max-w-sm mx-auto">
                  <button
                    (click)="verifyDigitalToAnalog()"
                    class="btn btn-primary w-full"
                    [disabled]="selectedChoice() === null"
                    aria-label="Verifica la risposta"
                  >
                    Verifica la risposta
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

    <!-- ===== Template orologio SVG riutilizzabile ===== -->
    <ng-template #clockFace let-h="h" let-m="m" let-size="size">
      <svg
        [attr.width]="size"
        [attr.height]="size"
        viewBox="0 0 200 200"
        role="img"
        [attr.aria-label]="h + ':' + (m < 10 ? '0' + m : m)"
        class="clock-svg"
      >
        <!-- Sfondo -->
        <circle cx="100" cy="100" r="95" fill="white" stroke="#e2e8f0" stroke-width="6" />

        <!-- Numeri ore -->
        @for (num of clockNumbers; track num.n) {
          <text
            [attr.x]="num.x"
            [attr.y]="num.y"
            text-anchor="middle"
            dominant-baseline="central"
            font-size="13"
            font-weight="700"
            fill="#4a5568"
          >
            {{ num.n }}
          </text>
        }

        <!-- Tacche minuti -->
        @for (tick of minuteTicks; track tick.key) {
          <line
            [attr.x1]="tick.x1"
            [attr.y1]="tick.y1"
            [attr.x2]="tick.x2"
            [attr.y2]="tick.y2"
            [attr.stroke]="tick.major ? '#94a3b8' : '#cbd5e1'"
            [attr.stroke-width]="tick.major ? 2.5 : 1.5"
            stroke-linecap="round"
          />
        }

        <!-- Lancetta ore -->
        <line
          cx="100"
          cy="100"
          [attr.x1]="100"
          [attr.y1]="100"
          [attr.x2]="hourHand(h, m).x"
          [attr.y2]="hourHand(h, m).y"
          stroke="#4a5568"
          stroke-width="6"
          stroke-linecap="round"
        />

        <!-- Lancetta minuti -->
        <line
          [attr.x1]="100"
          [attr.y1]="100"
          [attr.x2]="minuteHand(m).x"
          [attr.y2]="minuteHand(m).y"
          stroke="#a8d8ea"
          stroke-width="4"
          stroke-linecap="round"
        />

        <!-- Centro -->
        <circle cx="100" cy="100" r="5" fill="#4a5568" />
      </svg>
    </ng-template>
  `,
  styles: [
    `
      /* ---- Orologio ---- */
      .clock-wrapper {
        filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.12));
      }

      .clock-svg {
        border-radius: 50%;
        overflow: visible;
      }

      /* ---- Input ore:minuti (analog→digital) ---- */
      .time-input-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
      }

      .time-slot {
        width: 110px;
        height: 80px;
        border: 3px dashed var(--color-primary);
        border-radius: 16px;
        background: white;
        font-size: 2.8rem;
        font-weight: 700;
        color: var(--color-text-primary);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s ease;
        touch-action: manipulation;
      }

      .time-slot--active {
        border-style: solid;
        border-color: #667eea;
        box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.3);
        transform: scale(1.05);
      }

      .time-slot--filled {
        border-style: solid;
        border-color: var(--color-primary);
      }

      .time-colon {
        font-size: 3rem;
        font-weight: 800;
        color: var(--color-text-primary);
        line-height: 1;
        margin: 0 0.25rem;
      }

      /* ---- Display digitale (digital→analog) ---- */
      .digital-display {
        font-size: 5rem;
        font-weight: 800;
        text-align: center;
        color: var(--color-text-primary);
        font-variant-numeric: tabular-nums;
        letter-spacing: 0.05em;
        margin-bottom: 2rem;
        line-height: 1;
      }

      /* ---- Griglia scelte orologi ---- */
      .choices-grid-clock {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
        max-width: 520px;
        margin: 0 auto;
      }

      .choice-clock {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.75rem;
        border: 3px solid #e2e8f0;
        border-radius: 20px;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        touch-action: manipulation;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      @media (hover: hover) {
        .choice-clock:hover {
          border-color: var(--color-primary);
          transform: translateY(-3px);
          box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
        }
      }

      .choice-clock--selected {
        border-color: #667eea;
        box-shadow:
          0 0 0 4px rgba(102, 126, 234, 0.25),
          0 2px 8px rgba(0, 0, 0, 0.07);
        transform: scale(1.04);
      }

      .choice-clock--correct {
        border-color: #22c55e !important;
        background: #f0fdf4 !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.25) !important;
      }

      .choice-clock--wrong {
        border-color: #ef4444 !important;
        background: #fef2f2 !important;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2) !important;
      }

      .choice-clock-label {
        font-size: 1rem;
        font-weight: 700;
        color: var(--color-text-secondary);
      }
    `,
  ],
})
export class ClockComponent {
  private readonly feedbackService = inject(FeedbackService);
  private readonly storageService = inject(ClockOptionsStorageService);

  options = signal<ClockOptions>(this.storageService.loadOptions());
  exercise = signal<ClockExercise>(this.buildExercise());

  // analog-to-digital state
  activeField = signal<'hours' | 'minutes' | null>('hours');
  hoursStr = signal<string>('');
  minutesStr = signal<string>('');

  // digital-to-analog state
  selectedChoice = signal<number | null>(null);

  attemptCount = signal<number>(0);
  showFeedback = signal<boolean>(false);
  feedbackType = signal<FeedbackType>('retry');
  mobileMenuOpen = signal<boolean>(false);

  feedbackMessage = computed(() => {
    if (this.feedbackType() === 'success') {
      return this.feedbackService.getMessage('success');
    }
    if (this.feedbackType() === 'show-answer') {
      const ex = this.exercise();
      return `La risposta corretta è ${formatTime(ex.hours, ex.minutes)}. Proviamo con un altro esercizio!`;
    }
    return this.feedbackService.getMessage('retry');
  });

  // Pre-computed SVG clock decorations (static, same for all clocks)
  readonly clockNumbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const angle = (n / 12) * 2 * Math.PI - Math.PI / 2;
    return {
      n,
      x: +(CX + 74 * Math.cos(angle)).toFixed(1),
      y: +(CY + 74 * Math.sin(angle)).toFixed(1),
    };
  });

  readonly minuteTicks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
    const major = i % 5 === 0;
    const inner = major ? 80 : 84;
    return {
      key: i,
      x1: +(CX + inner * Math.cos(angle)).toFixed(1),
      y1: +(CY + inner * Math.sin(angle)).toFixed(1),
      x2: +(CX + R * Math.cos(angle)).toFixed(1),
      y2: +(CY + R * Math.sin(angle)).toFixed(1),
      major,
    };
  });

  constructor() {
    effect(() => this.storageService.saveOptions(this.options()));
  }

  // ---- template helpers ----

  readonly formatTime = formatTime;

  hourHand(h: number, m: number): { x: number; y: number } {
    return handEnd(hourAngle(h, m), 52);
  }

  minuteHand(m: number): { x: number; y: number } {
    return handEnd(minuteAngle(m), 72);
  }

  // ---- input handlers (analog→digital) ----

  activateField(field: 'hours' | 'minutes'): void {
    this.activeField.set(field);
  }

  onNumberPressed(num: number): void {
    const field = this.activeField();
    if (field === 'hours') {
      if (this.hoursStr().length < 2) this.hoursStr.update((s) => s + num);
    } else if (field === 'minutes') {
      if (this.minutesStr().length < 2) this.minutesStr.update((s) => s + num);
    }
  }

  onBackspacePressed(): void {
    const field = this.activeField();
    if (field === 'hours') this.hoursStr.update((s) => s.slice(0, -1));
    else if (field === 'minutes') this.minutesStr.update((s) => s.slice(0, -1));
  }

  onClearPressed(): void {
    const field = this.activeField();
    if (field === 'hours') this.hoursStr.set('');
    else if (field === 'minutes') this.minutesStr.set('');
  }

  verifyAnalogToDigital(): void {
    const h = parseInt(this.hoursStr(), 10);
    const m = parseInt(this.minutesStr(), 10);
    const ex = this.exercise();
    const correct = h === ex.hours && m === ex.minutes;
    this.attemptCount.update((c) => c + 1);
    this.feedbackType.set(correct ? 'success' : this.attemptCount() >= 3 ? 'show-answer' : 'retry');
    this.showFeedback.set(true);
  }

  // ---- choice handlers (digital→analog) ----

  selectChoice(index: number): void {
    if (!this.showFeedback()) this.selectedChoice.set(index);
  }

  verifyDigitalToAnalog(): void {
    const chosen = this.selectedChoice();
    if (chosen === null) return;
    this.attemptCount.update((c) => c + 1);
    const correct = chosen === this.exercise().correctChoiceIndex;
    this.feedbackType.set(correct ? 'success' : this.attemptCount() >= 3 ? 'show-answer' : 'retry');
    this.showFeedback.set(true);
  }

  closeFeedback(): void {
    this.showFeedback.set(false);
    this.hoursStr.set('');
    this.minutesStr.set('');
    this.activeField.set('hours');
    this.selectedChoice.set(null);
  }

  nextExercise(): void {
    this.exercise.set(this.buildExercise());
    this.hoursStr.set('');
    this.minutesStr.set('');
    this.activeField.set('hours');
    this.selectedChoice.set(null);
    this.attemptCount.set(0);
    this.showFeedback.set(false);
    this.feedbackType.set('retry');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  setMode(mode: ClockMode): void {
    this.options.update((o) => ({ ...o, mode }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  setPrecision(precision: ClockPrecision): void {
    this.options.update((o) => ({ ...o, precision }));
    this.nextExercise();
    this.mobileMenuOpen.set(false);
  }

  // ---- exercise generation ----

  private buildExercise(): ClockExercise {
    const opts = this.options();
    const pool = minutePool(opts.precision);
    const hours = rnd(1, 12);
    const minutes = pool[rnd(0, pool.length - 1)];
    const correct = { hours, minutes };
    const choices = generateChoices(correct, opts.precision);
    const correctChoiceIndex = choices.findIndex((c) => c.hours === hours && c.minutes === minutes);
    return { hours, minutes, choices, correctChoiceIndex };
  }
}
