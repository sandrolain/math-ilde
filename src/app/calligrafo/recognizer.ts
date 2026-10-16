import { bbox, centroid, clamp, dedupe, percentile, resample, strokeLength } from './geometry';
import type { Candidate, Point, Stroke, Template } from './types';

/** Numero di punti della "nuvola" usata per confrontare le forme. */
export const CLOUD_POINTS = 64;
/** Peso (numero di punti) dato a ogni puntino di i/j. */
export const DOT_WEIGHT = 6;
/** Distanza oltre la quale un punto è considerato "scoperto". */
export const FAR = 0.16;
/** Lunghezza (em) sotto la quale un tratto è un puntino. */
export const DOT_THRESHOLD = 3;
/** Fattore di conversione distanza → punteggio (0.2 ⇒ punteggio 0 alla distanza 0.2). */
export const DISTANCE_SCALE = 0.2;

export interface PreparedShape {
  /** Tratti ripuliti, in coordinate em originali. */
  strokes: Stroke[];
  /** Tratti in coordinate normalizzate (baricentro nell'origine, scala uniforme). */
  normStrokes: Stroke[];
  /** Nuvola di punti normalizzata. */
  cloud: Point[];
  /** Intervallo [da, a) della nuvola per ogni tratto. */
  ranges: Array<[number, number]>;
  /** True se il tratto è un puntino (punto di i/j). */
  isDot: boolean[];
  /** Estensione verticale robusta in em (percentili 3% e 97%). */
  top: number;
  bottom: number;
  /** Baricentro e scala usati per la normalizzazione. */
  cx: number;
  cy: number;
  scale: number;
}

export interface PreparedTemplate extends PreparedShape {
  template: Template;
}

export interface ShapeDistance {
  d: number;
  /** Distanza minima di ogni punto del modello (b) dall'utente (a). */
  coverage: number[];
  /** Frazione di punti dell'utente non coperti dal modello. */
  extra: number;
  /** Frazione di punti del modello non coperti dall'utente. */
  uncovered: number;
}

/** Estrae la rappresentazione normalizzata dei tratti dell'utente. */
export function prepare(strokes: readonly Stroke[]): PreparedShape | null {
  const cleaned: Stroke[] = [];
  for (const stroke of strokes) {
    const deduped = dedupe(stroke);
    if (deduped.length > 0) cleaned.push(deduped);
  }
  if (cleaned.length === 0) return null;

  const lengths = cleaned.map(strokeLength);
  const isDot = lengths.map((length) => length < DOT_THRESHOLD);

  const cloud: Point[] = [];
  const ranges: Array<[number, number]> = [];

  const otherIndices: number[] = [];
  let dotCount = 0;
  isDot.forEach((dot, index) => {
    if (dot) dotCount++;
    else otherIndices.push(index);
  });

  const rest = Math.max(32, CLOUD_POINTS - DOT_WEIGHT * dotCount);
  const counts = new Array<number>(cleaned.length).fill(0);
  if (otherIndices.length > 0) {
    const budget = Math.max(rest, 2 * otherIndices.length);
    const totalLength = otherIndices.reduce(
      (sum, index) => sum + Math.max(lengths[index], 1e-6),
      0,
    );
    for (const index of otherIndices) {
      counts[index] = Math.max(
        2,
        Math.round((budget * Math.max(lengths[index], 1e-6)) / totalLength),
      );
    }
  }

  cleaned.forEach((stroke, index) => {
    const from = cloud.length;
    if (isDot[index]) {
      for (let k = 0; k < DOT_WEIGHT; k++) cloud.push({ ...stroke[0] });
    } else {
      for (const point of resample(stroke, Math.max(2, counts[index]))) cloud.push(point);
    }
    ranges.push([from, cloud.length]);
  });

  const ys = cloud.map((point) => point.y);
  const top = percentile(ys, 3);
  const bottom = percentile(ys, 97);

  const center = centroid(cloud);
  const box = bbox(cloud);
  const scale = Math.max(box.width, box.height) || 1;

  const normCloud = cloud.map((point) => ({
    x: (point.x - center.x) / scale,
    y: (point.y - center.y) / scale,
  }));
  const normStrokes = cleaned.map((stroke) =>
    stroke.map((point) => ({ x: (point.x - center.x) / scale, y: (point.y - center.y) / scale })),
  );

  return {
    strokes: cleaned,
    normStrokes,
    cloud: normCloud,
    ranges,
    isDot,
    top,
    bottom,
    cx: center.x,
    cy: center.y,
    scale,
  };
}

export function nearestDistance(point: Point, cloud: readonly Point[]): number {
  let best = Infinity;
  for (const other of cloud) {
    const dx = point.x - other.x;
    const dy = point.y - other.y;
    const distance = dx * dx + dy * dy;
    if (distance < best) best = distance;
  }
  return Math.sqrt(best);
}

/**
 * Chamfer simmetrico tra due nuvole di punti: indipendente da ordine, verso
 * e numero di tratti. Valori piccoli = forme simili.
 */
export function shapeDistance(a: readonly Point[], b: readonly Point[]): ShapeDistance {
  if (a.length === 0 || b.length === 0) {
    return { d: 1, coverage: b.map(() => 1), extra: 1, uncovered: 1 };
  }

  const da = a.map((point) => nearestDistance(point, b));
  const db = b.map((point) => nearestDistance(point, a));

  let sumA = 0;
  let sumB = 0;
  let uncA = 0;
  let uncB = 0;
  for (const distance of da) {
    sumA += distance;
    if (distance > FAR) uncA++;
  }
  for (const distance of db) {
    sumB += distance;
    if (distance > FAR) uncB++;
  }

  const extra = uncA / a.length;
  const uncovered = uncB / b.length;
  const d = 0.5 * (sumA / a.length + sumB / b.length) + 0.25 * (extra + uncovered);
  return { d, coverage: db, extra, uncovered };
}

export function distanceToScore(d: number): number {
  return clamp(1 - d / DISTANCE_SCALE, 0, 1);
}

/** Confronta i tratti dell'utente con un modello. */
export function compare(user: PreparedShape, template: PreparedTemplate): Candidate {
  const shape = shapeDistance(user.cloud, template.cloud);

  // Copertura "ancorata": utente e modello vengono riportati in una cornice
  // comune (baricentri sovrapposti, scala condivisa) per individuare i pezzi
  // mancanti senza che il riadattamento di scala della forma li mascheri.
  const commonScale = Math.max(user.scale, template.scale) || 1;
  const scaleRatio = template.scale / commonScale;
  const anchoredCloud = template.cloud.map((point) => ({
    x: point.x * scaleRatio,
    y: point.y * scaleRatio,
  }));
  const anchoredUser: Point[] = [];
  for (const stroke of user.strokes) {
    for (const point of stroke) {
      anchoredUser.push({
        x: (point.x - user.cx) / commonScale,
        y: (point.y - user.cy) / commonScale,
      });
    }
  }
  const coverage = anchoredCloud.map((point) => nearestDistance(point, anchoredUser));

  const missing: number[] = [];
  template.ranges.forEach(([from, to], index) => {
    const length = to - from;
    if (length === 0) return;
    let uncovered = 0;
    for (let i = from; i < to; i++) {
      if (coverage[i] > FAR) uncovered++;
    }
    if (uncovered / length > 0.6) missing.push(index);
  });

  return {
    template: template.template,
    d: shape.d,
    score: distanceToScore(shape.d),
    missing,
    extra: shape.extra,
  };
}
