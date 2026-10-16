import { clamp, dist, resample } from './geometry';
import { MESSAGES_IT } from './messages';
import { compare, prepare, type PreparedShape, type PreparedTemplate } from './recognizer';
import { builtinTemplates, TemplateStore } from './templates';
import type {
  Candidate,
  Issue,
  IssueCode,
  IssueSeverity,
  LetterTarget,
  Messages,
  Stroke,
  Style,
  Template,
  VerifyOptions,
  VerifyResult,
} from './types';

const DEFAULT_SHAPE_THRESHOLD = 0.5;
const DEFAULT_SIZE_TOLERANCE = 16;
const MAX_PERMUTED_STROKES = 6;
const STROKE_SAMPLES = 16;
const REVERSED_MARGIN = 0.05;
const START_MARGIN = 0.3;
const ORDER_MARGIN_PER_STROKE = 0.04;
const EXTRA_PART_THRESHOLD = 0.2;

export interface CalligrafoOptions {
  /** Store dei modelli registrati dall'utente. */
  store?: TemplateStore;
  /** Se true (default) i modelli predefiniti vengono inclusi. */
  builtin?: boolean;
  /** Modelli aggiuntivi non presenti nello store. */
  templates?: readonly Template[];
}

export function normalizeChar(style: Style, char: string): string {
  return style.endsWith('maiuscolo') ? char.toUpperCase() : char.toLowerCase();
}

/**
 * Verifica e riconosce lettere scritte a mano. Si conosce sempre la lettera
 * richiesta: il compito principale è verificarla; `recognize` serve solo per il
 * feedback "questa sembra una X".
 */
export class Calligrafo {
  private readonly store: TemplateStore | undefined;
  private readonly includeBuiltin: boolean;
  private readonly extraTemplates: Template[];
  private templates: PreparedTemplate[] = [];

  constructor(options: CalligrafoOptions = {}) {
    this.store = options.store;
    this.includeBuiltin = options.builtin ?? true;
    this.extraTemplates = [...(options.templates ?? [])];
    this.sync();
  }

  /** Ricostruisce i modelli preparati (da chiamare dopo modifiche allo store). */
  sync(): void {
    const list: Template[] = [];
    if (this.includeBuiltin) list.push(...builtinTemplates());
    list.push(...this.extraTemplates);
    if (this.store) list.push(...this.store.all());

    const prepared: PreparedTemplate[] = [];
    for (const template of list) {
      const shape = prepare(template.strokes);
      if (shape) prepared.push({ ...shape, template });
    }
    this.templates = prepared;
  }

  /** Modelli disponibili per una lettera in uno stile. */
  templatesFor(style: Style, char: string): Template[] {
    const wanted = normalizeChar(style, char);
    return this.templates
      .filter((item) => item.template.style === style && item.template.char === wanted)
      .map((item) => item.template);
  }

  /** Riconosce la lettera tra quelle dello stesso stile (migliore modello per lettera). */
  recognize(strokes: readonly Stroke[], style: Style, limit = 5): Candidate[] {
    const user = prepare(strokes);
    if (!user) return [];
    return this.rankLetters(user, style, limit);
  }

  verify(
    target: LetterTarget,
    strokes: readonly Stroke[],
    options: VerifyOptions = {},
  ): VerifyResult {
    const messages: Messages = { ...MESSAGES_IT, ...(options.messages ?? {}) };
    const shapeThreshold = options.shapeThreshold ?? DEFAULT_SHAPE_THRESHOLD;
    const sizeTolerance =
      options.sizeTolerance === undefined ? DEFAULT_SIZE_TOLERANCE : options.sizeTolerance;
    const strict = options.strictStrokes ?? false;

    const issues: Issue[] = [];
    const char = normalizeChar(target.style, target.char);

    const user = prepare(strokes);
    if (!user) {
      issues.push(makeIssue('empty', 'error', messages.empty));
      return emptyResult(issues);
    }

    const candidates = this.templates.filter(
      (item) => item.template.style === target.style && item.template.char === char,
    );
    if (candidates.length === 0) {
      throw new Error(
        `Calligrafo: nessun modello per lo stile "${target.style}" e la lettera "${char}"`,
      );
    }

    let matched: Candidate | null = null;
    let matchedTemplate: PreparedTemplate | null = null;
    for (const template of candidates) {
      const candidate = compare(user, template);
      if (!matched || candidate.score > matched.score) {
        matched = candidate;
        matchedTemplate = template;
      }
    }

    // `matched` e `matchedTemplate` sono sempre valorizzati: `candidates` non è vuoto.
    const best = matched as Candidate;
    const bestTemplate = matchedTemplate as PreparedTemplate;
    const ranking = this.rankLetters(user, target.style, 5);
    const shapeScore = best.score;

    let ok = true;

    // 1. Forma
    if (shapeScore < shapeThreshold) {
      ok = false;
      const top = ranking[0];
      if (
        top &&
        top.template.char !== char &&
        top.score >= shapeThreshold &&
        top.score > shapeScore + 0.1
      ) {
        issues.push(
          makeIssue(
            'wrong-letter',
            'error',
            messages['wrong-letter'],
            undefined,
            top.template.char,
          ),
        );
      } else {
        issues.push(makeIssue('bad-shape', 'error', messages['bad-shape']));
      }
    } else {
      if (best.missing.length > 0) {
        ok = false;
        issues.push(makeIssue('missing-part', 'error', messages['missing-part'], best.missing[0]));
      }
      if (best.extra > EXTRA_PART_THRESHOLD) {
        ok = false;
        issues.push(makeIssue('extra-part', 'error', messages['extra-part']));
      }
    }

    // 2. Dimensione e posizione
    let sizeScore: number | null = null;
    if (sizeTolerance !== null && Number.isFinite(sizeTolerance)) {
      const dTop = user.top - bestTemplate.top;
      const dBottom = user.bottom - bestTemplate.bottom;
      const worst = Math.max(Math.abs(dTop), Math.abs(dBottom));
      sizeScore = clamp(1 - Math.max(0, worst - sizeTolerance / 2) / (sizeTolerance * 1.5), 0, 1);

      if (worst > sizeTolerance) {
        ok = false;
        const userHeight = user.bottom - user.top;
        const templateHeight = bestTemplate.bottom - bestTemplate.top;
        const heightDiff = userHeight - templateHeight;
        if (Math.abs(heightDiff) > sizeTolerance) {
          issues.push(
            makeIssue(
              heightDiff < 0 ? 'too-small' : 'too-large',
              'error',
              heightDiff < 0 ? messages['too-small'] : messages['too-large'],
            ),
          );
        } else {
          const averageShift = (dTop + dBottom) / 2;
          issues.push(
            makeIssue(
              averageShift < 0 ? 'too-high' : 'too-low',
              'error',
              averageShift < 0 ? messages['too-high'] : messages['too-low'],
            ),
          );
        }
      }
    }

    // 3. Ordine, verso e punto di partenza dei tratti
    if (user.strokes.length === bestTemplate.strokes.length) {
      const strokeIssues = this.analyseStrokes(user, bestTemplate, messages, strict);
      issues.push(...strokeIssues);
      if (strokeIssues.some((issue) => issue.severity === 'error')) ok = false;
    } else {
      issues.push(makeIssue('stroke-count', 'info', messages['stroke-count']));
    }

    const score = sizeScore === null ? shapeScore : shapeScore * (0.6 + 0.4 * sizeScore);
    const hasWarning = issues.some((issue) => issue.severity === 'warning');
    let stars: 0 | 1 | 2 | 3;
    if (!ok && score <= 0.4) stars = 0;
    else if (!ok) stars = 1;
    else if (hasWarning || score < 0.7) stars = 2;
    else stars = 3;

    return {
      ok,
      score,
      stars,
      shapeScore,
      sizeScore,
      issues,
      matched: best,
      ranking,
    };
  }

  private rankLetters(user: PreparedShape, style: Style, limit: number): Candidate[] {
    const bestByChar = new Map<string, Candidate>();
    for (const template of this.templates) {
      if (template.template.style !== style) continue;
      const candidate = compare(user, template);
      const current = bestByChar.get(template.template.char);
      if (!current || candidate.score > current.score) {
        bestByChar.set(template.template.char, candidate);
      }
    }
    return [...bestByChar.values()].sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private analyseStrokes(
    user: PreparedShape,
    template: PreparedTemplate,
    messages: Messages,
    strict: boolean,
  ): Issue[] {
    const severity: IssueSeverity = strict ? 'error' : 'warning';
    const issues: Issue[] = [];

    const userStrokes = user.normStrokes.map((stroke) => resample(stroke, STROKE_SAMPLES));
    const templateStrokes = template.normStrokes.map((stroke) => resample(stroke, STROKE_SAMPLES));

    const count = userStrokes.length;
    if (count === 0) return issues;

    const pairCost = (i: number, j: number): number => {
      const direct = meanDistance(userStrokes[i], templateStrokes[j]);
      const reversed = meanDistance(userStrokes[i], [...templateStrokes[j]].reverse());
      return Math.min(direct, reversed);
    };

    const identityCost = sumRange(count, (i) => pairCost(i, i));

    let bestPermutation: number[] | null = null;
    let bestCost = Infinity;
    if (count <= MAX_PERMUTED_STROKES) {
      for (const permutation of permutations(count)) {
        let cost = 0;
        for (let i = 0; i < count; i++) cost += pairCost(i, permutation[i]);
        if (cost < bestCost) {
          bestCost = cost;
          bestPermutation = permutation;
        }
      }
    }

    const orderWrong =
      bestPermutation !== null &&
      !isIdentity(bestPermutation) &&
      identityCost - bestCost > ORDER_MARGIN_PER_STROKE * count;
    if (orderWrong) {
      issues.push(makeIssue('stroke-order', severity, messages['stroke-order']));
    }

    const mapping = bestPermutation ?? identityRange(count);
    for (let i = 0; i < count; i++) {
      const j = mapping[i];
      if (user.isDot[i] || template.isDot[j]) continue;
      const direct = meanDistance(userStrokes[i], templateStrokes[j]);
      const reversed = meanDistance(userStrokes[i], [...templateStrokes[j]].reverse());
      if (reversed < direct - REVERSED_MARGIN) {
        issues.push(makeIssue('stroke-direction', severity, messages['stroke-direction'], i));
      } else if (dist(userStrokes[i][0], templateStrokes[j][0]) > START_MARGIN) {
        issues.push(makeIssue('stroke-start', severity, messages['stroke-start'], i));
      }
    }

    return issues;
  }
}

function emptyResult(issues: Issue[]): VerifyResult {
  return {
    ok: false,
    score: 0,
    stars: 0,
    shapeScore: 0,
    sizeScore: null,
    issues,
    matched: null,
    ranking: [],
  };
}

function makeIssue(
  code: IssueCode,
  severity: IssueSeverity,
  message: string,
  stroke?: number,
  recognizedAs?: string,
): Issue {
  const issue: Issue = { code, severity, message };
  if (stroke !== undefined) issue.stroke = stroke;
  if (recognizedAs !== undefined) issue.recognizedAs = recognizedAs;
  return issue;
}

function meanDistance(
  a: readonly { x: number; y: number }[],
  b: readonly { x: number; y: number }[],
): number {
  if (a.length === 0 || b.length === 0) return Infinity;
  let total = 0;
  for (let i = 0; i < a.length; i++) {
    total += dist(a[i], b[i]);
  }
  return total / a.length;
}

function sumRange(count: number, fn: (index: number) => number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += fn(i);
  return total;
}

function identityRange(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

function isIdentity(permutation: readonly number[]): boolean {
  return permutation.every((value, index) => value === index);
}

function* permutations(count: number): Generator<number[]> {
  const items = identityRange(count);
  yield* permute(items, 0);
}

function* permute(items: number[], start: number): Generator<number[]> {
  if (start >= items.length - 1) {
    yield [...items];
    return;
  }
  for (let i = start; i < items.length; i++) {
    [items[start], items[i]] = [items[i], items[start]];
    yield* permute(items, start + 1);
    [items[start], items[i]] = [items[i], items[start]];
  }
}
