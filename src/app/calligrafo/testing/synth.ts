import { centroid, resample } from '../geometry';
import type { Point, Stroke } from '../types';

/** RNG deterministico (mulberry32) per test riproducibili. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SynthOptions {
  seed?: number;
  /** Ampiezza della scala (± frazione). Default 0.07. */
  scaleJitter?: number;
  /** Rotazione massima in gradi. Default 3. */
  rotationDeg?: number;
  /** Traslazione verticale massima in em. Default 3. */
  verticalJitter?: number;
  /** Rumore per punto in em. Default 0.6. */
  noise?: number;
  /** Ampiezza dell'ondulazione a bassa frequenza in em. Default 0.5. */
  wobble?: number;
}

/**
 * Trasforma i tratti di un modello in una "scrittura da bambina": ondulazione,
 * rumore, piccole variazioni di scala/rotazione, traslazione orizzontale e
 * campionamento irregolare.
 */
export function synthesize(strokes: readonly Stroke[], options: SynthOptions = {}): Stroke[] {
  const {
    seed = 1,
    scaleJitter = 0.07,
    rotationDeg = 3,
    verticalJitter = 3,
    noise = 0.6,
    wobble = 0.5,
  } = options;

  const rng = mulberry32(seed);
  const all = strokes.flat();
  const center = centroid(all);
  const scale = 1 + (rng() * 2 - 1) * scaleJitter;
  const angle = ((rng() * 2 - 1) * rotationDeg * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const shiftX = 20 + rng() * 40;
  const shiftY = (rng() * 2 - 1) * verticalJitter;

  return strokes.map((stroke) => {
    const count = 10 + Math.floor(rng() * 41);
    const resampled = resample(stroke, count);
    const phase = rng() * Math.PI * 2;
    return resampled.map((point, index) => {
      const x = (point.x - center.x) * scale;
      const y = (point.y - center.y) * scale;
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      const wobbleX = Math.sin(index * 0.6 + phase) * wobble;
      const wobbleY = Math.cos(index * 0.5 + phase) * wobble;
      return {
        x: rx + center.x + shiftX + wobbleX + (rng() * 2 - 1) * noise,
        y: ry + center.y + shiftY + wobbleY + (rng() * 2 - 1) * noise,
      };
    });
  });
}

export function translate(strokes: readonly Stroke[], dx: number, dy: number): Stroke[] {
  return strokes.map((stroke) => stroke.map((point) => ({ x: point.x + dx, y: point.y + dy })));
}

export function scaleStrokes(strokes: readonly Stroke[], factor: number): Stroke[] {
  const all = strokes.flat();
  const center = centroid(all);
  return strokes.map((stroke) =>
    stroke.map((point) => ({
      x: center.x + (point.x - center.x) * factor,
      y: center.y + (point.y - center.y) * factor,
    })),
  );
}

export function reverseStroke(stroke: Stroke): Stroke {
  return [...stroke].reverse().map((point) => ({ ...point }));
}

export function asPoint(x: number, y: number): Point {
  return { x, y };
}
