import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { CalligrafoService } from '../../services/calligrafo.service';
import {
  EM_TOP_MARGIN,
  EM_VIEW_HEIGHT,
  ITALIAN_STYLE_LABELS,
  MESSAGES_IT,
  bbox,
  type Issue,
  type Point,
  type Stroke,
  type Style,
  type Template,
} from '../../calligrafo';

interface Feedback {
  ok: boolean;
  stars: 0 | 1 | 2 | 3;
  message: string;
  recognized: string | null;
}

const INK_COLOR = '#24566a';

@Component({
  selector: 'app-handwriting-canvas',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="writing-card" aria-labelledby="writing-title">
      <h2 id="writing-title">{{ isWord() ? 'Scrivi questa parola' : 'Scrivi questa lettera' }}</h2>
      <div class="writing-workspace">
        <div class="writing-controls" aria-label="Comandi scrittura">
          <div class="writing-controls__top">
          <ng-content select="[writing-controls-top]"></ng-content>
          </div>
          <div class="writing-card__actions">
            <button type="button" class="btn btn-secondary" (click)="showModel()">
              <span aria-hidden="true">✏️</span> Mostra
            </button>
            <button
              type="button"
              class="btn btn-secondary"
              (click)="undo()"
              [disabled]="strokes().length === 0"
            >
              <span aria-hidden="true">↩️</span> Annulla
            </button>
            <button type="button" class="btn btn-secondary" (click)="clear()">
              <span aria-hidden="true">🧽</span> Cancella
            </button>
            <button type="button" class="btn btn-primary" (click)="evaluate()">
              <span aria-hidden="true">✅</span> Controlla
            </button>
          </div>
        </div>

        <div class="writing-content">
          <div class="writing-card__prompt-wrap" aria-live="polite">
            <canvas
              #modelPreview
              class="writing-card__model-preview"
              width="280"
              height="160"
              [attr.aria-label]="
                (isWord() ? 'Modello della parola ' : 'Modello della lettera ') + displayChar()
              "
            ></canvas>
            <span class="sr-only">{{ displayChar() }}</span>
          </div>
          <p class="writing-card__hint">{{ styleLabel() }}</p>
          <div class="writing-stage">
            <canvas
              #canvas
              class="writing-canvas"
              width="640"
              height="400"
              [attr.aria-label]="
                isWord() ? 'Riquadro per scrivere la parola a mano' : 'Riquadro per scrivere la lettera a mano'
              "
              (pointerdown)="onPointerDown($event)"
              (pointermove)="onPointerMove($event)"
              (pointerup)="onPointerUp($event)"
              (pointercancel)="onPointerUp($event)"
              (lostpointercapture)="onPointerUp($event)"
            ></canvas>
          </div>
        </div>
      </div>

      @if (visibleFeedback(); as fb) {
        <div
          class="writing-feedback"
          [class.writing-feedback--success]="fb.ok"
          role="status"
          aria-live="polite"
        >
          <p class="writing-feedback__stars" [attr.aria-label]="fb.stars + ' stelle su 3'">
            {{ starsText(fb.stars) }}
          </p>
          <p class="writing-feedback__message">{{ fb.message }}</p>
          @if (fb.recognized) {
            <p class="writing-feedback__recognized">Questa sembra una «{{ fb.recognized }}».</p>
          }
        </div>
      }
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
      }
      .writing-card {
        padding: clamp(1rem, 3vw, 1.5rem);
        border: 2px solid var(--color-primary);
        border-radius: 1rem;
        background: var(--color-surface);
        text-align: center;
      }
      h2 {
        margin: 0;
        color: var(--color-text-primary);
        font-size: clamp(1.35rem, 3.5vw, 1.75rem);
      }
      .writing-card__prompt-wrap {
        display: flex;
        justify-content: center;
        margin: 0 0 0.75rem;
      }
      .writing-card__model-preview {
        display: block;
        width: min(25rem, 100%);
        height: 12rem;
        border: 3px solid var(--color-primary);
        border-radius: 1.25rem;
        background: var(--color-info-surface, #eef7fb);
        user-select: none;
        -webkit-user-select: none;
      }
      .writing-card__hint {
        margin: 0 0 0.75rem;
        color: var(--color-text-secondary);
        font-size: 1.05rem;
        text-align: center;
      }
      .writing-workspace {
        display: grid;
        grid-template-columns: minmax(11rem, 16rem) minmax(0, 46rem);
        align-items: center;
        justify-content: center;
        gap: clamp(1rem, 3vw, 2rem);
      }
      .writing-content {
        min-width: 0;
      }
      .writing-controls,
      .writing-controls__top,
      .writing-card__actions {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
      }
      .writing-controls__top {
        padding-bottom: 0.6rem;
      }
      .writing-controls button {
        width: 100%;
        height: 3.5rem;
        min-height: 3.5rem;
        white-space: nowrap;
      }
      .writing-controls {
        align-self: stretch;
        justify-content: center;
      }
      .writing-stage {
        display: flex;
        justify-content: center;
        min-width: 0;
      }
      .writing-canvas {
        display: block;
        width: 100%;
        max-width: 46rem;
        aspect-ratio: 10 / 5;
        border: 3px dashed var(--color-primary);
        border-radius: 0.85rem;
        background: #fff;
        touch-action: none;
        cursor: crosshair;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
      }
      .writing-card__actions {
        margin-top: 0;
      }
      .writing-card__actions button:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }
      .writing-feedback {
        margin: 1rem 0 0;
        padding: 0.75rem;
        border-radius: 0.75rem;
        background: var(--color-encourage-surface);
        color: var(--color-encourage-strong);
      }
      .writing-feedback--success {
        background: var(--color-success-surface);
        color: var(--color-success-strong);
      }
      .writing-feedback__stars {
        margin: 0 0 0.35rem;
        color: var(--color-encourage-strong);
        font-size: 1.8rem;
        letter-spacing: 0.15rem;
      }
      .writing-feedback--success .writing-feedback__stars {
        color: var(--color-success-strong);
      }
      .writing-feedback__message {
        margin: 0;
        font-weight: 700;
      }
      .writing-feedback__recognized {
        margin: 0.35rem 0 0;
        font-size: 0.95rem;
      }
      @media (max-width: 42rem) {
        .writing-workspace {
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        .writing-controls,
        .writing-controls__top,
        .writing-card__actions {
          width: 100%;
        }
        .writing-canvas {
          max-width: 46rem;
        }
      }
    `,
  ],
})
export class HandwritingCanvasComponent implements AfterViewInit, OnDestroy {
  private readonly calligrafo = inject(CalligrafoService);

  @ViewChild('canvas') private canvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('modelPreview') private modelPreviewRef?: ElementRef<HTMLCanvasElement>;

  target = input.required<string>();
  writingStyle = input<Style>('stampatello-maiuscolo');
  sizeTolerance = input<number | null>(16);
  feedbackInPopup = input(false);
  /** Cambiandone il valore il foglio e il modello vengono azzerati (es. "Nuova lettera"). */
  clearToken = input(0);

  evaluated = output<boolean>();
  result = output<boolean | null>();

  readonly strokes = signal<Stroke[]>([]);
  readonly feedback = signal<Feedback | null>(null);
  readonly visibleFeedback = computed(() =>
    this.feedbackInPopup() ? null : this.feedback(),
  );

  readonly displayChar = computed(() => {
    const char = this.target();
    return this.writingStyle().endsWith('maiuscolo') ? char.toUpperCase() : char.toLowerCase();
  });
  readonly isWord = computed(() => this.target().length > 1);
  readonly styleLabel = computed(() => ITALIAN_STYLE_LABELS[this.writingStyle()]);
  readonly isCursive = computed(() => this.writingStyle().startsWith('corsivo'));

  private drawing = false;
  private current: Stroke = [];
  private ghost: {
    template: Template;
    centerX: number;
    progress: number;
    target: number;
    last: number;
  } | null = null;
  private animationHandle: number | null = null;
  private resizeObserver?: ResizeObserver;
  private wordModelShown = false;

  /**
   * Impedisce che il gesto di scrittura faccia scorrere la pagina su touch,
   * anche sui browser che non rispettano appieno `touch-action: none`.
   */
  private readonly preventTouchScroll = (event: TouchEvent): void => {
    if (event.cancelable) event.preventDefault();
  };

  constructor() {
    effect(() => {
      // Dipendenze esplicite: lettera, stile e richiesta di reset.
      this.target();
      this.writingStyle();
      this.clearToken();
      // Il ridisegno è imperativo: va eseguito senza tracciare i segnali che
      // legge (es. `strokes`), altrimenti l'effetto si riattiverebbe a ogni
      // tratto aggiunto cancellando la scrittura.
      untracked(() => {
        this.resetState();
        this.redraw();
        this.redrawModelPreview();
      });
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.redraw();
        this.redrawModelPreview();
      });
      this.resizeObserver.observe(canvas);
      if (this.modelPreviewRef?.nativeElement) {
        this.resizeObserver.observe(this.modelPreviewRef.nativeElement);
      }
    }
    // Fallback non-passivo: su alcuni browser (es. safari mobile) `touch-action`
    // da solo non blocca sempre lo scroll durante il disegno.
    canvas?.addEventListener('touchstart', this.preventTouchScroll, { passive: false });
    canvas?.addEventListener('touchmove', this.preventTouchScroll, { passive: false });
    this.redraw();
    this.redrawModelPreview();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    const canvas = this.canvasRef?.nativeElement;
    canvas?.removeEventListener('touchstart', this.preventTouchScroll);
    canvas?.removeEventListener('touchmove', this.preventTouchScroll);
    if (this.animationHandle !== null) cancelAnimationFrame(this.animationHandle);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.drawing || event.button > 0) return;
    const point = this.toEm(event);
    if (!point) return;
    this.drawing = true;
    this.current = [point];
    this.feedback.set(null);
    const canvas = this.canvasRef?.nativeElement;
    canvas?.setPointerCapture?.(event.pointerId);
    this.redraw();
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.drawing) return;
    const events =
      typeof event.getCoalescedEvents === 'function' ? event.getCoalescedEvents() : [event];
    for (const raw of events.length > 0 ? events : [event]) {
      const point = this.toEm(raw);
      if (!point) continue;
      const last = this.current[this.current.length - 1];
      if (!last || Math.hypot(last.x - point.x, last.y - point.y) >= 0.6) {
        this.current.push(point);
      }
    }
    this.redraw();
  }

  onPointerUp(event: PointerEvent): void {
    if (!this.drawing) return;
    this.drawing = false;
    const canvas = this.canvasRef?.nativeElement;
    if (canvas?.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture?.(event.pointerId);
    }
    if (this.current.length > 0) {
      this.strokes.update((strokes) => [...strokes, this.current]);
    }
    this.current = [];
    this.redraw();
  }

  undo(): void {
    if (this.strokes().length === 0) return;
    this.strokes.update((strokes) => strokes.slice(0, -1));
    this.feedback.set(null);
    this.result.emit(null);
    this.redraw();
  }

  clear(): void {
    this.resetState();
    this.result.emit(null);
    this.redraw();
  }

  evaluate(): void {
    const strokes = this.strokes();
    if (strokes.length === 0) {
      this.feedback.set({
        ok: false,
        stars: 0,
        message: MESSAGES_IT.empty,
        recognized: null,
      });
      this.evaluated.emit(false);
      this.result.emit(false);
      return;
    }

    const outcome = this.isWord()
      ? this.verifyWord(strokes)
      : this.calligrafo.verify(
          { style: this.writingStyle(), char: this.target() },
          strokes,
          { sizeTolerance: this.sizeTolerance() },
        );

    this.feedback.set({
      ok: outcome.ok,
      stars: outcome.stars,
      message: this.primaryMessage(outcome.issues, outcome.ok),
      recognized:
        outcome.issues.find((issue) => issue.code === 'wrong-letter')?.recognizedAs ?? null,
    });
    this.evaluated.emit(outcome.ok);
    this.result.emit(outcome.ok);
  }

  /** Mostra il modello della lettera, con animazione opzionale. */
  showModel(animate = true): void {
    if (this.isWord()) {
      this.wordModelShown = true;
      this.redraw();
      this.redrawModelPreview();
      return;
    }
    const template = this.calligrafo.findTemplate(this.writingStyle(), this.target());
    if (!template) return;
    const box = bbox(template.strokes.flat());
    this.ghost = {
      template,
      centerX: (box.minX + box.maxX) / 2,
      progress: animate ? 0 : template.strokes.length,
      target: template.strokes.length,
      last: 0,
    };
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = null;
    }
    if (!animate) {
      this.redraw();
      return;
    }
    this.ghost.last = performance.now();
    const step = (now: number): void => {
      const ghost = this.ghost;
      if (!ghost || ghost.progress >= ghost.target) {
        this.animationHandle = null;
        return;
      }
      const elapsed = now - ghost.last;
      const duration = 1400;
      ghost.progress = Math.min(ghost.target, ghost.progress + (elapsed / duration) * ghost.target);
      ghost.last = now;
      this.redraw();
      this.animationHandle = requestAnimationFrame(step);
    };
    this.animationHandle = requestAnimationFrame(step);
  }

  starsText(stars: number): string {
    return '★'.repeat(stars) + '☆'.repeat(Math.max(0, 3 - stars));
  }

  private resetState(): void {
    this.strokes.set([]);
    this.current = [];
    this.drawing = false;
    this.feedback.set(null);
    this.ghost = null;
    this.wordModelShown = false;
    if (this.animationHandle !== null) {
      cancelAnimationFrame(this.animationHandle);
      this.animationHandle = null;
    }
  }

  private primaryMessage(issues: Issue[], ok: boolean): string {
    const error = issues.find((issue) => issue.severity === 'error');
    const other = issues.find((issue) => issue.severity === 'warning') ?? issues[0];
    const chosen = error ?? other;
    if (ok && !chosen) return 'Perfetto! Lettera ben scritta.';
    return chosen?.message ?? 'Lettera ben scritta.';
  }

  private toEm(event: PointerEvent): Point | null {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    const scale = rect.height / EM_VIEW_HEIGHT;
    return {
      x: (event.clientX - rect.left) / scale,
      y: (event.clientY - rect.top) / scale - EM_TOP_MARGIN,
    };
  }

  private redraw(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(rect.width * dpr);
    const pixelHeight = Math.round(rect.height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);

    const scale = rect.height / EM_VIEW_HEIGHT;
    this.drawGuides(context, rect.width, rect.height, scale);
    if (this.isWord()) {
      if (this.wordModelShown) this.drawWordGhost(context, rect.width, scale);
    } else if (this.ghost) {
      this.drawGhost(context, rect.width, scale);
    }
    this.drawStrokes(context, scale, this.strokes());
    if (this.current.length > 0) this.drawStrokes(context, scale, [this.current]);
  }

  private redrawModelPreview(): void {
    const canvas = this.modelPreviewRef?.nativeElement;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const width = canvas.clientWidth || canvas.width;
    const height = canvas.clientHeight || canvas.height;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.clearRect(0, 0, width, height);
    context.fillStyle = '#edf7fb';
    context.fillRect(0, 0, width, height);

    if (this.isWord()) {
      this.drawWordPreview(context, width, height);
      return;
    }
    const template = this.calligrafo.findTemplate(this.writingStyle(), this.target());
    if (!template) return;
    const points = template.strokes.flat();
    if (points.length === 0) return;
    const bounds = bbox(points);
    this.drawGuides(context, width, height, height / EM_VIEW_HEIGHT);
    this.drawGhost(
      context,
      width,
      height / EM_VIEW_HEIGHT,
      {
        template,
        centerX: (bounds.minX + bounds.maxX) / 2,
        progress: template.strokes.length,
      },
      false,
    );
  }

  private drawWordPreview(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
  ): void {
    this.drawGuides(context, width, height, height / EM_VIEW_HEIGHT);
    this.drawWordTemplates(context, width, height / EM_VIEW_HEIGHT, false);
  }

  private drawWordGhost(
    context: CanvasRenderingContext2D,
    width: number,
    scale: number,
  ): void {
    this.drawWordTemplates(context, width, scale, true);
  }

  private drawWordTemplates(
    context: CanvasRenderingContext2D,
    width: number,
    scale: number,
    showStartMarkers: boolean,
  ): void {
    const templates = [...this.target()]
      .map((char) => this.calligrafo.findTemplate(this.writingStyle(), char))
      .filter((template): template is Template => template !== undefined);
    if (templates.length === 0) return;
    const gap = 5;
    const widths = templates.map((template) => {
      const bounds = bbox(template.strokes.flat());
      return Math.max(1, bounds.maxX - bounds.minX);
    });
    const availableWidth = width / scale - gap * (templates.length - 1);
    const horizontalScale = Math.min(1, availableWidth / widths.reduce((sum, value) => sum + value, 0));
    const totalWidth =
      widths.reduce((sum, value) => sum + value * horizontalScale, 0) +
      gap * (templates.length - 1);
    let cursor = (width / scale - totalWidth) / 2;
    for (const [index, template] of templates.entries()) {
      const points = template.strokes.flat();
      if (points.length === 0) continue;
      const bounds = bbox(points);
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const scaledWidth = widths[index] * horizontalScale;
      const slotCenter = cursor + scaledWidth / 2;
      this.drawGhost(
        context,
        width,
        scale,
        {
          template,
          centerX,
          progress: template.strokes.length,
          offsetX: (slotCenter - width / (2 * scale)) * scale,
          scaleX: horizontalScale,
        },
        showStartMarkers,
      );
      cursor += scaledWidth + gap;
    }
  }

  private verifyWord(strokes: readonly Stroke[]) {
    const letters = [...this.target()];
    const rect = this.canvasRef?.nativeElement.getBoundingClientRect();
    const scale = rect && rect.height > 0 ? rect.height / EM_VIEW_HEIGHT : 1;
    const width = rect && scale > 0 ? rect.width / scale : 256;
    const gap = 5;
    const templates = letters.map((letter) =>
      this.calligrafo.findTemplate(this.writingStyle(), letter),
    );
    const widths = templates.map((template) => {
      if (!template) return 1;
      const bounds = bbox(template.strokes.flat());
      return Math.max(1, bounds.maxX - bounds.minX);
    });
    const availableWidth = width - gap * (letters.length - 1);
    const horizontalScale = Math.min(
      1,
      availableWidth / widths.reduce((sum, value) => sum + value, 0),
    );
    const totalWidth =
      widths.reduce((sum, value) => sum + value * horizontalScale, 0) +
      gap * (letters.length - 1);
    let cursor = (width - totalWidth) / 2;
    const results = letters.map((letter, index) => {
      const left = cursor;
      const right = left + widths[index] * horizontalScale;
      const letterStrokes = strokes
        .filter((stroke) => {
          const points = stroke.filter((point) => point.x >= left && point.x <= right);
          return points.length >= Math.max(1, Math.ceil(stroke.length / 2));
        })
        .map((stroke) =>
          stroke.map((point) => ({
            ...point,
            x: (point.x - left) / horizontalScale,
          })),
        );
      cursor = right + gap;
      return this.calligrafo.verify(
        { style: this.writingStyle(), char: letter },
        letterStrokes,
        { sizeTolerance: this.sizeTolerance() },
      );
    });
    const issues = results.flatMap((result) => result.issues);
    return {
      ok: results.every((result) => result.ok),
      score: results.reduce((sum, result) => sum + result.score, 0) / results.length,
      stars: results.every((result) => result.ok) ? (3 as const) : (1 as const),
      shapeScore: results.reduce((sum, result) => sum + result.shapeScore, 0) / results.length,
      sizeScore: null,
      issues,
      matched: null,
      ranking: [],
    };
  }

  private drawGuides(
    context: CanvasRenderingContext2D,
    width: number,
    _height: number,
    scale: number,
  ): void {
    context.save();
    context.lineWidth = 1.5;
    for (const emY of [0, 40, 120]) {
      const y = (emY + EM_TOP_MARGIN) * scale;
      context.setLineDash([8, 8]);
      context.strokeStyle = '#c7d9e0';
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    const baseline = (80 + EM_TOP_MARGIN) * scale;
    context.setLineDash([]);
    context.strokeStyle = '#e08aa0';
    context.beginPath();
    context.moveTo(0, baseline);
    context.lineTo(width, baseline);
    context.stroke();
    context.restore();
  }

  private drawStrokes(
    context: CanvasRenderingContext2D,
    scale: number,
    strokes: readonly Stroke[],
  ): void {
    context.save();
    context.lineWidth = Math.max(3, scale * 3.2);
    context.strokeStyle = INK_COLOR;
    context.fillStyle = INK_COLOR;
    context.lineCap = 'round';
    context.lineJoin = 'round';
    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        const point = stroke[0];
        context.beginPath();
        context.arc(
          point.x * scale,
          (point.y + EM_TOP_MARGIN) * scale,
          context.lineWidth / 2,
          0,
          Math.PI * 2,
        );
        context.fill();
        continue;
      }
      context.beginPath();
      stroke.forEach((point, index) => {
        const x = point.x * scale;
        const y = (point.y + EM_TOP_MARGIN) * scale;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();
    }
    context.restore();
  }

  private drawGhost(
    context: CanvasRenderingContext2D,
    width: number,
    scale: number,
    previewGhost: {
      template: Template;
      centerX: number;
      progress: number;
      offsetX?: number;
      scaleX?: number;
    } | null = this.ghost,
    showStartMarkers = true,
  ): void {
    const ghost = previewGhost;
    if (!ghost) return;
    const strokes = ghost.template.strokes;
    const progress = ghost.progress;
    const full = Math.floor(progress);
    const fraction = progress - full;

    context.save();
    context.lineWidth = Math.max(3, scale * 3.2);
    context.strokeStyle = 'rgba(36, 86, 106, 0.28)';
    context.lineCap = 'round';
    context.lineJoin = 'round';

    const project = (point: Point): Point => ({
      x:
        (point.x - ghost.centerX) * scale * (ghost.scaleX ?? 1) +
        width / 2 +
        (ghost.offsetX ?? 0),
      y: (point.y + EM_TOP_MARGIN) * scale,
    });

    for (let s = 0; s < strokes.length; s++) {
      const stroke = strokes[s];
      if (s > full || stroke.length === 0) continue;
      const limit = s < full ? stroke.length : Math.max(1, Math.ceil(stroke.length * fraction));
      context.beginPath();
      for (let i = 0; i < limit; i++) {
        const point = project(stroke[i]);
        if (i === 0) context.moveTo(point.x, point.y);
        else context.lineTo(point.x, point.y);
      }
      context.stroke();
    }

    if (!showStartMarkers) {
      context.restore();
      return;
    }

    context.fillStyle = 'rgba(36, 86, 106, 0.9)';
    context.font = `700 ${Math.max(12, scale * 7)}px 'Varela Round', sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    for (let s = 0; s <= Math.min(full, strokes.length - 1); s++) {
      const stroke = strokes[s];
      if (stroke.length === 0) continue;
      const start = project(stroke[0]);
      context.beginPath();
      context.arc(start.x, start.y, Math.max(9, scale * 4.5), 0, Math.PI * 2);
      context.fillStyle = '#ffffff';
      context.fill();
      context.lineWidth = 2;
      context.strokeStyle = 'rgba(36, 86, 106, 0.7)';
      context.stroke();
      context.fillStyle = INK_COLOR;
      context.fillText(String(s + 1), start.x, start.y + 1);
      context.fillStyle = 'rgba(36, 86, 106, 0.9)';
    }
    context.restore();
  }
}
