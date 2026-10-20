#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import opentype from 'opentype.js';

const STYLES = new Set([
  'stampatello-maiuscolo',
  'stampatello-minuscolo',
  'corsivo-maiuscolo',
  'corsivo-minuscolo',
]);
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

function usage() {
  console.log(`
Estrae tratti centrali di lettere da font TTF/OTF in mappe TypeScript o Template JSON.

Uso:
  npm run font:extract -- \\
    --font-url "https://fonts.gstatic.com/.../playwrite-it-trad.ttf" \\
    --style corsivo-minuscolo \\
    --output tmp/corsivo.ts

Opzioni:
  --font FILE          font locale TTF/OTF
  --font-url URL       asset TTF/OTF remoto
  --font-css-url URL   CSS Google Fonts; usa il primo asset TTF trovato
  --format ts|json     output TypeScript glifi (default) o Template JSON
  --mode centerline|outline
                       scheletro a linea centrale (default) o contorni originali
  --export-name NAME   nome della costante TypeScript
  --chars abc...       lettere da estrarre (default: alfabeto coerente con style)
  --height 80          altezza normalizzata in em (default: 80)
  --samples 12         campioni per curva (default: 12)
`);
}

function optionsFromArgs(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (!arg.startsWith('--')) throw new Error(`Argomento non riconosciuto: ${arg}`);
    const separator = arg.indexOf('=');
    if (separator >= 0) {
      options[arg.slice(2, separator)] = arg.slice(separator + 1);
    } else {
      const key = arg.slice(2);
      const value = args[index + 1];
      if (!value || value.startsWith('--')) throw new Error(`Valore mancante per --${key}`);
      options[key] = value;
      index += 1;
    }
  }
  return options;
}

function numberOption(options, key, fallback) {
  const value = options[key] === undefined ? fallback : Number(options[key]);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`--${key} deve essere un numero positivo`);
  }
  return value;
}

function sampleCubic(from, c1, c2, to, samples) {
  const points = [];
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples;
    const inverse = 1 - t;
    points.push({
      x:
        inverse ** 3 * from.x +
        3 * inverse ** 2 * t * c1.x +
        3 * inverse * t ** 2 * c2.x +
        t ** 3 * to.x,
      y:
        inverse ** 3 * from.y +
        3 * inverse ** 2 * t * c1.y +
        3 * inverse * t ** 2 * c2.y +
        t ** 3 * to.y,
    });
  }
  return points;
}

function sampleQuadratic(from, control, to, samples) {
  const points = [];
  for (let index = 1; index <= samples; index += 1) {
    const t = index / samples;
    const inverse = 1 - t;
    points.push({
      x: inverse ** 2 * from.x + 2 * inverse * t * control.x + t ** 2 * to.x,
      y: inverse ** 2 * from.y + 2 * inverse * t * control.y + t ** 2 * to.y,
    });
  }
  return points;
}

function extractContours(glyph, fontSize, samples) {
  const commands = glyph.getPath(0, 0, fontSize).commands;
  const contours = [];
  let contour = [];
  let current = null;
  let start = null;

  const finishContour = () => {
    if (contour.length > 1) contours.push(contour);
    contour = [];
    current = null;
    start = null;
  };

  for (const command of commands) {
    switch (command.type) {
      case 'M':
        finishContour();
        current = { x: command.x, y: command.y };
        start = current;
        contour.push(current);
        break;
      case 'L':
        current = { x: command.x, y: command.y };
        contour.push(current);
        break;
      case 'C': {
        if (!current) throw new Error('Contorno font non valido: curva senza punto iniziale');
        const end = { x: command.x, y: command.y };
        contour.push(...sampleCubic(current, { x: command.x1, y: command.y1 }, { x: command.x2, y: command.y2 }, end, samples));
        current = end;
        break;
      }
      case 'Q': {
        if (!current) throw new Error('Contorno font non valido: curva senza punto iniziale');
        const end = { x: command.x, y: command.y };
        contour.push(...sampleQuadratic(current, { x: command.x1, y: command.y1 }, end, samples));
        current = end;
        break;
      }
      case 'Z':
        if (current && start && (current.x !== start.x || current.y !== start.y)) {
          contour.push({ ...start });
        }
        finishContour();
        break;
      default:
        throw new Error(`Comando font non supportato: ${command.type}`);
    }
  }
  finishContour();
  return contours;
}

function normalizeContours(contours, height) {
  const points = contours.flat();
  if (points.length === 0) return [];
  const minX = Math.min(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const sourceHeight = maxY - minY;
  if (sourceHeight <= 0) return [];
  const scale = height / sourceHeight;
  return contours.map((contour) =>
    contour.map((point) => ({
      x: Math.round((point.x - minX) * scale * 100) / 100,
      y: Math.round((maxY - point.y) * scale * 100) / 100,
    })),
  );
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;
    if (intersects) inside = !inside;
  }
  return inside;
}

function rasterizeContours(contours, scale = 2) {
  const points = contours.flat();
  const maxX = Math.max(...points.map((point) => point.x));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.ceil(maxX * scale) + 4;
  const height = Math.ceil(maxY * scale) + 4;
  const pixels = Array.from({ length: height }, () => new Uint8Array(width));

  for (let row = 0; row < height; row++) {
    for (let column = 0; column < width; column++) {
      const point = { x: (column + 0.5) / scale, y: (row + 0.5) / scale };
      let inside = false;
      for (const contour of contours) {
        if (pointInPolygon(point, contour)) inside = !inside;
      }
      pixels[row][column] = inside ? 1 : 0;
    }
  }
  return { pixels, scale };
}

function skeletonNeighbors(pixels, row, column) {
  const neighbors = [];
  for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
    for (let columnOffset = -1; columnOffset <= 1; columnOffset++) {
      if (rowOffset === 0 && columnOffset === 0) continue;
      if (pixels[row + rowOffset]?.[column + columnOffset]) {
        neighbors.push([row + rowOffset, column + columnOffset]);
      }
    }
  }
  return neighbors;
}

function thin(pixels) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const phase of [0, 1]) {
      const remove = [];
      for (let row = 1; row < pixels.length - 1; row++) {
        for (let column = 1; column < pixels[row].length - 1; column++) {
          if (!pixels[row][column]) continue;
          const neighbors = [
            pixels[row - 1][column],
            pixels[row - 1][column + 1],
            pixels[row][column + 1],
            pixels[row + 1][column + 1],
            pixels[row + 1][column],
            pixels[row + 1][column - 1],
            pixels[row][column - 1],
            pixels[row - 1][column - 1],
          ];
          const count = neighbors.reduce((sum, value) => sum + value, 0);
          const transitions = neighbors.reduce(
            (sum, value, index) => sum + (!value && neighbors[(index + 1) % 8] ? 1 : 0),
            0,
          );
          const valid =
            phase === 0
              ? neighbors[0] * neighbors[2] * neighbors[4] === 0 &&
                neighbors[2] * neighbors[4] * neighbors[6] === 0
              : neighbors[0] * neighbors[2] * neighbors[6] === 0 &&
                neighbors[0] * neighbors[4] * neighbors[6] === 0;
          if (count >= 2 && count <= 6 && transitions === 1 && valid) {
            remove.push([row, column]);
          }
        }
      }
      for (const [row, column] of remove) pixels[row][column] = 0;
      changed ||= remove.length > 0;
    }
  }
  return pixels;
}

function simplify(points, tolerance = 0.8) {
  if (points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let furthest = 0;
  let distance = 0;
  const denominator = Math.hypot(last.x - first.x, last.y - first.y);
  for (let index = 1; index < points.length - 1; index++) {
    const numerator = Math.abs(
      (last.y - first.y) * points[index].x -
        (last.x - first.x) * points[index].y +
        last.x * first.y -
        last.y * first.x,
    );
    const currentDistance = denominator === 0 ? numerator : numerator / denominator;
    if (currentDistance > distance) {
      distance = currentDistance;
      furthest = index;
    }
  }
  if (distance <= tolerance) return [first, last];
  return [
    ...simplify(points.slice(0, furthest + 1), tolerance).slice(0, -1),
    ...simplify(points.slice(furthest), tolerance),
  ];
}

function isMeaningfulStroke(stroke) {
  if (stroke.length < 2) return false;
  let length = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let index = 0; index < stroke.length; index++) {
    const point = stroke[index];
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
    if (index > 0) {
      length += Math.hypot(point.x - stroke[index - 1].x, point.y - stroke[index - 1].y);
    }
  }
  return length >= 3 && (maxY - minY >= 4 || maxX - minX >= 6);
}

function skeletonToStrokes(pixels, scale) {
  const nodes = new Map();
  for (let row = 1; row < pixels.length - 1; row++) {
    for (let column = 1; column < pixels[row].length - 1; column++) {
      if (pixels[row][column]) nodes.set(`${row}:${column}`, [row, column]);
    }
  }
  const neighbors = (node) =>
    skeletonNeighbors(pixels, node[0], node[1]).filter(([row, column]) =>
      nodes.has(`${row}:${column}`),
    );
  const edgeKey = (from, to) => {
    const first = `${from[0]}:${from[1]}`;
    const second = `${to[0]}:${to[1]}`;
    return first < second ? `${first}|${second}` : `${second}|${first}`;
  };
  const visited = new Set();
  const strokes = [];
  const endpoints = [...nodes.values()].filter((node) => neighbors(node).length !== 2);

  const trace = (start, next) => {
    const points = [start, next];
    visited.add(edgeKey(start, next));
    let previous = start;
    let current = next;
    while (neighbors(current).length === 2) {
      const candidate = neighbors(current).find(
        (node) => node[0] !== previous[0] || node[1] !== previous[1],
      );
      if (!candidate || visited.has(edgeKey(current, candidate))) break;
      visited.add(edgeKey(current, candidate));
      points.push(candidate);
      previous = current;
      current = candidate;
    }
    return points.map(([row, column]) => ({ x: column / scale, y: row / scale }));
  };

  for (const start of endpoints) {
    for (const next of neighbors(start)) {
      if (!visited.has(edgeKey(start, next))) strokes.push(trace(start, next));
    }
  }
  for (const start of nodes.values()) {
    for (const next of neighbors(start)) {
      if (!visited.has(edgeKey(start, next))) strokes.push(trace(start, next));
    }
  }
  return strokes.map((stroke) => simplify(stroke)).filter((stroke) => stroke.length > 1);
}

function contoursToCenterline(contours) {
  if (contours.length === 0) return [];
  const { pixels, scale } = rasterizeContours(contours);
  const tracks = [];
  let active = [];

  for (let row = 0; row < pixels.length; row++) {
    const centers = [];
    let start = -1;
    for (let column = 0; column <= pixels[row].length; column++) {
      const filled = column < pixels[row].length && pixels[row][column] === 1;
      if (filled && start < 0) start = column;
      if ((!filled || column === pixels[row].length) && start >= 0) {
        if (column - start >= 2) centers.push((start + column - 1) / 2);
        start = -1;
      }
    }

    const nextActive = [];
    const used = new Set();
    for (const center of centers) {
      let bestIndex = -1;
      let bestDistance = Infinity;
      for (let index = 0; index < active.length; index++) {
        if (used.has(index)) continue;
        const distance = Math.abs(active[index].x - center);
        if (distance < bestDistance && distance <= scale * 5) {
          bestIndex = index;
          bestDistance = distance;
        }
      }
      if (bestIndex >= 0) {
        used.add(bestIndex);
        const track = active[bestIndex];
        track.points.push({ x: center / scale, y: row / scale });
        track.x = center;
        nextActive.push(track);
      } else {
        nextActive.push({
          x: center,
          points: [{ x: center / scale, y: row / scale }],
        });
      }
    }
    for (let index = 0; index < active.length; index++) {
      if (!used.has(index) && active[index].points.length > 2) tracks.push(active[index].points);
    }
    active = nextActive;
  }
  for (const track of active) {
    if (track.points.length > 2) tracks.push(track.points);
  }
  return tracks
    .map((stroke) => simplify(stroke, 1.2))
    .filter((stroke) => isMeaningfulStroke(stroke));
}

function numberText(value) {
  return Number(value.toFixed(2)).toString();
}

function contoursToDsl(contours) {
  return contours
    .map((contour) => {
      const [first, ...rest] = contour;
      if (!first) return '';
      const start = `M${numberText(first.x)} ${numberText(first.y)}`;
      if (rest.length === 0) return start;
      return `${start} S${rest
        .map((point) => ` ${numberText(point.x)} ${numberText(point.y)}`)
        .join('')}`;
    })
    .filter(Boolean)
    .join(' ; ');
}

function constantName(style) {
  return style.replaceAll('-', '_').toUpperCase();
}

function typescriptGlyphModule(glyphs, exportName, sourceFont) {
  const entries = glyphs
    .map(({ char, strokes }) => `  ${char.toLowerCase()}: '${contoursToDsl(strokes)}',`)
    .join('\n');
  return `/** Generato da ${sourceFont}. Verificare ordine e verso dei tratti. */\n\nexport const ${exportName}: Record<string, string> = {\n${entries}\n};\n`;
}

async function loadFontData(options) {
  const fontPath = options.font;
  const fontUrl = options['font-url'];
  const cssUrl = options['font-css-url'];
  if (!fontPath && !fontUrl && !cssUrl) {
    throw new Error('Specificare --font, --font-url oppure --font-css-url');
  }
  if (fontPath && (fontUrl || cssUrl)) {
    throw new Error('Usare una sola sorgente tra --font, --font-url e --font-css-url');
  }
  if (fontPath) return fs.readFileSync(fontPath);

  let assetUrl = fontUrl;
  if (!assetUrl) {
    const cssResponse = await fetch(cssUrl);
    if (!cssResponse.ok) throw new Error(`CSS font non raggiungibile: HTTP ${cssResponse.status}`);
    const css = await cssResponse.text();
    assetUrl = css.match(/url\((https:\/\/[^)]+\.ttf)\)/)?.[1];
    if (!assetUrl) throw new Error('CSS font non contiene un asset TTF');
  }

  const response = await fetch(assetUrl);
  if (!response.ok) throw new Error(`Font non raggiungibile: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

function sourceName(options) {
  if (options.font) return path.basename(options.font);
  const sourceUrl = options['font-url'] ?? options['font-css-url'];
  return path.basename(new URL(sourceUrl).pathname) || sourceUrl;
}

async function main() {
  const options = optionsFromArgs(process.argv.slice(2));
  const style = options.style;
  const output = options.output;
  if (!style) throw new Error('Parametro obbligatorio mancante: --style');
  if (!output) throw new Error('Parametro obbligatorio mancante: --output');
  if (!STYLES.has(style)) throw new Error(`Stile non valido: ${style}`);

  const height = numberOption(options, 'height', 80);
  const samples = Math.round(numberOption(options, 'samples', 12));
  const format = options.format ?? 'ts';
  if (format !== 'ts' && format !== 'json') {
    throw new Error('--format deve essere ts oppure json');
  }
  const mode = options.mode ?? 'centerline';
  if (mode !== 'centerline' && mode !== 'outline') {
    throw new Error('--mode deve essere centerline oppure outline');
  }
  const chars =
    options.chars ??
    (style.endsWith('maiuscolo') ? ALPHABET.toUpperCase() : ALPHABET);
  const fontData = await loadFontData(options);
  const fontBuffer = fontData.buffer.slice(
    fontData.byteOffset,
    fontData.byteOffset + fontData.byteLength,
  );
  const font = opentype.parse(fontBuffer);
  const glyphs = [];
  const warnings = [];

  for (const char of chars) {
    const glyph = font.charToGlyph(char);
    const contours = normalizeContours(extractContours(glyph, 1000, samples), height);
    const strokes = mode === 'centerline' ? contoursToCenterline(contours) : contours;
    if (strokes.length === 0) {
      warnings.push(`Nessun contorno estratto per "${char}"`);
      continue;
    }
    glyphs.push({ char, strokes });
  }

  if (format === 'ts') {
    const exportName = options['export-name'] ?? constantName(style);
    if (!/^[A-Z_$][A-Z0-9_$]*$/i.test(exportName)) {
      throw new Error('--export-name non è un identificatore TypeScript valido');
    }
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(
      output,
      typescriptGlyphModule(glyphs, exportName, sourceName(options)),
    );
    console.log(`Estratti ${glyphs.length}/${chars.length} glifi TypeScript in ${output}`);
  } else {
    const templates = glyphs.map(({ char, strokes }) => ({
      id: `font:${sourceName(options)}:${style}:${char}`,
      style,
      char,
      strokes,
      source: 'recorded',
    }));
    const document = {
      version: 1,
      templates,
      metadata: {
        sourceFont: sourceName(options),
        style,
        warning:
          mode === 'centerline'
            ? 'Scheletro ricavato automaticamente dal contorno: ordine dei tratti da verificare.'
            : 'Contorni font: ordine e verso dei tratti non rappresentano scrittura didattica.',
      },
    };
    fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
    fs.writeFileSync(output, `${JSON.stringify(document, null, 2)}\n`);
    console.log(`Estratti ${templates.length}/${chars.length} template JSON in ${output}`);
  }
  for (const warning of warnings) console.warn(`Warning: ${warning}`);
  console.warn('Nota: correggere manualmente ordine e verso tratti prima della verifica.');
}

try {
  await main();
} catch (error) {
  console.error(`Errore: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
}
