import { BASELINE, dist, strokeLength } from './geometry';
import type { Point, Stroke } from './types';

/**
 * Mini-DSL per descrivere lo scheletro di un glifo in coordinate em.
 *
 *   M x y                 nuovo punto di partenza
 *   L x y [x y ...]       segmenti
 *   C x1 y1 x2 y2 x y     cubica di Bézier (16 campioni)
 *   S x y x y ...         spline Catmull-Rom attraverso i punti (10 campioni/segmento)
 *   A cx cy rx ry a0 a1   arco di ellisse; angoli in gradi, 0 = destra, 90 = giù
 *
 * Più tratti sono separati da `;`. L'ordine e il verso dei punti rispettano
 * la scrittura (servono per il controllo ordine/verso dei tratti).
 */
export function parsePath(d: string, slantDeg = 0, baseline = BASELINE): Stroke[] {
  const strokes: Stroke[] = [];

  for (const part of d.split(';')) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const tokens = trimmed
      .replace(/([MLCSA])/g, ' $1 ')
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);

    const stroke: Stroke = [];
    let current: Point | null = null;
    let index = 0;

    const read = (): number => {
      const value = Number(tokens[index]);
      index++;
      return value;
    };

    while (index < tokens.length) {
      const command = tokens[index];
      index++;

      switch (command) {
        case 'M': {
          const point = { x: read(), y: read() };
          stroke.push(point);
          current = point;
          break;
        }
        case 'L': {
          while (index < tokens.length && !isCommand(tokens[index])) {
            const point = { x: read(), y: read() };
            stroke.push(point);
            current = point;
          }
          break;
        }
        case 'C': {
          if (!current) throw new Error('parsePath: comando C senza punto corrente');
          while (index < tokens.length && !isCommand(tokens[index])) {
            const c1 = { x: read(), y: read() };
            const c2 = { x: read(), y: read() };
            const end = { x: read(), y: read() };
            stroke.push(...sampleCubic(current, c1, c2, end, 16));
            current = end;
          }
          break;
        }
        case 'S': {
          if (!current) throw new Error('parsePath: comando S senza punto corrente');
          const points: Point[] = [current];
          while (index < tokens.length && !isCommand(tokens[index])) {
            points.push({ x: read(), y: read() });
          }
          stroke.push(...sampleCatmullRom(points, 10));
          current = points[points.length - 1];
          break;
        }
        case 'A': {
          const cx = read();
          const cy = read();
          const rx = read();
          const ry = read();
          const a0 = read();
          const a1 = read();
          stroke.push(...sampleArc(cx, cy, rx, ry, a0, a1));
          current = stroke[stroke.length - 1];
          break;
        }
        default:
          throw new Error(`parsePath: comando sconosciuto "${command}"`);
      }
    }

    if (stroke.length > 0) strokes.push(stroke);
  }

  if (slantDeg !== 0) {
    const factor = Math.tan((slantDeg * Math.PI) / 180);
    for (const stroke of strokes) {
      for (const point of stroke) {
        point.x += (baseline - point.y) * factor;
      }
    }
  }

  return strokes;
}

function isCommand(token: string | undefined): boolean {
  return token === 'M' || token === 'L' || token === 'C' || token === 'S' || token === 'A';
}

function sampleCubic(p0: Point, c1: Point, c2: Point, p1: Point, samples: number): Point[] {
  const out: Point[] = [];
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const a = mt * mt * mt;
    const b = 3 * mt * mt * t;
    const c = 3 * mt * t * t;
    const d = t * t * t;
    out.push({
      x: a * p0.x + b * c1.x + c * c2.x + d * p1.x,
      y: a * p0.y + b * c1.y + c * c2.y + d * p1.y,
    });
  }
  return out;
}

function sampleCatmullRom(points: readonly Point[], samplesPerSegment: number): Point[] {
  if (points.length < 2) return points.map((p) => ({ ...p }));
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? points[i + 1];
    for (let j = 0; j < samplesPerSegment; j++) {
      out.push(catmullRomPoint(p0, p1, p2, p3, j / samplesPerSegment));
    }
  }
  out.push({ ...points[points.length - 1] });
  return out;
}

function catmullRomPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function sampleArc(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0deg: number,
  a1deg: number,
): Point[] {
  const a0 = (a0deg * Math.PI) / 180;
  const a1 = (a1deg * Math.PI) / 180;
  const span = a1 - a0;
  const samples = Math.max(8, Math.ceil(Math.abs(span) / (Math.PI / 12)));
  const out: Point[] = [];
  for (let i = 0; i <= samples; i++) {
    const angle = a0 + (span * i) / samples;
    out.push({ x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) });
  }
  return out;
}

/** True se il tratto è troppo corto per essere una linea (puntino di i/j). */
export function isDot(stroke: Stroke, threshold = 3): boolean {
  return strokeLength(stroke) < threshold;
}

export { dist };
