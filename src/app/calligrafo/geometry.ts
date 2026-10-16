import type { Point, Stroke } from './types';

/** Linea di base e righe guida nello spazio "em". */
export const BASELINE = 80;
/** Altezza totale dell'area di scrittura visibile in em (margine sopra + 4 righe). */
export const EM_VIEW_HEIGHT = 160;
/** Margine in em sopra il rigo alto (y = 0). */
export const EM_TOP_MARGIN = 20;

export function dist(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function strokeLength(stroke: Stroke): number {
  let total = 0;
  for (let i = 1; i < stroke.length; i++) {
    total += dist(stroke[i - 1], stroke[i]);
  }
  return total;
}

/** Rimuove i punti troppo vicini tra loro; utile contro il rumore dei puntatori. */
export function dedupe(stroke: Stroke, minDistance = 0.6): Stroke {
  const out: Stroke = [];
  for (const point of stroke) {
    const last = out[out.length - 1];
    if (!last || dist(last, point) >= minDistance) {
      out.push({ ...point });
    }
  }
  return out;
}

/** Ricampiona un tratto in `count` punti equidistanti per lunghezza d'arco. */
export function resample(stroke: Stroke, count: number): Stroke {
  if (count <= 0 || stroke.length === 0) return [];
  if (count === 1) return [{ ...stroke[0] }];
  if (stroke.length === 1) {
    return Array.from({ length: count }, () => ({ ...stroke[0] }));
  }

  const total = strokeLength(stroke);
  if (total === 0) {
    return Array.from({ length: count }, () => ({ ...stroke[0] }));
  }

  const step = total / (count - 1);
  const out: Stroke = [{ ...stroke[0] }];
  let segment = 1;
  let prev = stroke[0];
  let next = stroke[1];
  let segmentLength = dist(prev, next);
  let accumulated = 0;

  while (out.length < count - 1) {
    const target = out.length * step;
    while (accumulated + segmentLength < target && segment < stroke.length - 1) {
      accumulated += segmentLength;
      segment++;
      prev = stroke[segment - 1];
      next = stroke[segment];
      segmentLength = dist(prev, next);
    }
    const ratio = segmentLength === 0 ? 0 : (target - accumulated) / segmentLength;
    out.push({
      x: prev.x + (next.x - prev.x) * ratio,
      y: prev.y + (next.y - prev.y) * ratio,
    });
  }

  out.push({ ...stroke[stroke.length - 1] });
  return out;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export function bbox(points: readonly Point[]): BoundingBox {
  if (points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    if (point.x < minX) minX = point.x;
    if (point.y < minY) minY = point.y;
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function centroid(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  let sumX = 0;
  let sumY = 0;
  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }
  return { x: sumX / points.length, y: sumY / points.length };
}

/** Percentile (0..100) con interpolazione lineare su un vettore di valori. */
export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const clamped = Math.min(100, Math.max(0, p));
  const rank = (clamped / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  const ratio = rank - low;
  return sorted[low] * (1 - ratio) + sorted[high] * ratio;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
