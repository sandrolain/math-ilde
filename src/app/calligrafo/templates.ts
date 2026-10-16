import { parsePath } from './path';
import { CORSIVO_MAIUSCOLO, CORSIVO_MINUSCOLO, CORSIVO_SLANT } from './glyphs/corsivo';
import { STAMPATELLO_MAIUSCOLO, STAMPATELLO_MINUSCOLO } from './glyphs/stampatello';
import type { Stroke, Style, Template } from './types';

export const TEMPLATES_STORAGE_KEY = 'calligrafo.templates';
const STORAGE_VERSION = 1;

/** Inclinazione applicata a ciascuno stile (gradi). */
export const STYLE_SLANT: Record<Style, number> = {
  'stampatello-maiuscolo': 0,
  'stampatello-minuscolo': 0,
  'corsivo-maiuscolo': CORSIVO_SLANT,
  'corsivo-minuscolo': CORSIVO_SLANT,
};

const STYLE_GLYPHS: Record<Style, Record<string, string>> = {
  'stampatello-maiuscolo': STAMPATELLO_MAIUSCOLO,
  'stampatello-minuscolo': STAMPATELLO_MINUSCOLO,
  'corsivo-maiuscolo': CORSIVO_MAIUSCOLO,
  'corsivo-minuscolo': CORSIVO_MINUSCOLO,
};

export const STYLES: readonly Style[] = [
  'stampatello-maiuscolo',
  'stampatello-minuscolo',
  'corsivo-maiuscolo',
  'corsivo-minuscolo',
];

export const ITALIAN_STYLE_LABELS: Record<Style, string> = {
  'stampatello-maiuscolo': 'Stampatello maiuscolo',
  'stampatello-minuscolo': 'Stampatello minuscolo',
  'corsivo-maiuscolo': 'Corsivo maiuscolo',
  'corsivo-minuscolo': 'Corsivo minuscolo',
};

export const ALPHABET: readonly string[] = 'abcdefghijklmnopqrstuvwxyz'.split('');

export function alphabet(): string[] {
  return [...ALPHABET];
}

let builtinCache: Template[] | null = null;

/** Modelli predefiniti per tutti e 4 gli stili e le 26 lettere. */
export function builtinTemplates(): Template[] {
  if (builtinCache) return builtinCache;
  const templates: Template[] = [];
  for (const style of STYLES) {
    const glyphs = STYLE_GLYPHS[style];
    const isUppercase = style.endsWith('maiuscolo');
    for (const [letter, d] of Object.entries(glyphs)) {
      const char = isUppercase ? letter.toUpperCase() : letter;
      templates.push({
        id: `${style}:${char}`,
        style,
        char,
        strokes: parsePath(d, STYLE_SLANT[style]),
        source: 'builtin',
      });
    }
  }
  builtinCache = templates;
  return templates;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function cloneStrokes(strokes: readonly Stroke[]): Stroke[] {
  return strokes.map((stroke) => stroke.map((point) => ({ ...point })));
}

function cloneTemplate(template: Template): Template {
  return { ...template, strokes: cloneStrokes(template.strokes) };
}

export interface TemplatesJSON {
  version: number;
  templates: Template[];
}

/**
 * Raccolta di modelli registrati dall'utente (o importati). I modelli predefiniti
 * non vengono salvati: `Calligrafo` li aggiunge automaticamente.
 */
export class TemplateStore {
  private items: Template[];

  constructor(templates: readonly Template[] = []) {
    this.items = templates.map(cloneTemplate);
  }

  get size(): number {
    return this.items.length;
  }

  all(): Template[] {
    return this.items.map(cloneTemplate);
  }

  add(template: Template): Template {
    const stored: Template = {
      ...cloneTemplate(template),
      source: 'recorded',
      id: template.id || `recorded:${template.style}:${template.char}:${Date.now()}`,
    };
    const existing = this.items.findIndex((item) => item.id === stored.id);
    if (existing >= 0) this.items[existing] = stored;
    else this.items.push(stored);
    return cloneTemplate(stored);
  }

  remove(id: string): boolean {
    const index = this.items.findIndex((item) => item.id === id);
    if (index < 0) return false;
    this.items.splice(index, 1);
    return true;
  }

  forLetter(style: Style, char: string): Template[] {
    const wanted = style.endsWith('maiuscolo') ? char.toUpperCase() : char.toLowerCase();
    return this.items
      .filter((item) => item.style === style && item.char === wanted)
      .map(cloneTemplate);
  }

  clear(): void {
    this.items = [];
  }

  toJSON(): TemplatesJSON {
    return {
      version: STORAGE_VERSION,
      templates: this.items.map((template) => ({
        ...template,
        strokes: template.strokes.map((stroke) =>
          stroke.map((point) => ({ x: round2(point.x), y: round2(point.y) })),
        ),
      })),
    };
  }

  static fromJSON(data: unknown): TemplateStore {
    const store = new TemplateStore();
    if (!data || typeof data !== 'object') return store;
    const candidate = data as { templates?: unknown };
    if (!Array.isArray(candidate.templates)) return store;
    for (const raw of candidate.templates) {
      const template = sanitizeTemplate(raw);
      if (template) store.add(template);
    }
    return store;
  }

  saveLocal(storage: Storage | undefined = safeLocalStorage()): void {
    if (!storage) return;
    try {
      storage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(this.toJSON()));
    } catch {
      // storage pieno o non disponibile: si ignora, i modelli restano in memoria.
    }
  }

  loadLocal(storage: Storage | undefined = safeLocalStorage()): void {
    if (!storage) return;
    try {
      const raw = storage.getItem(TEMPLATES_STORAGE_KEY);
      if (!raw) return;
      const parsed = TemplateStore.fromJSON(JSON.parse(raw));
      this.items = parsed.all();
    } catch {
      // JSON corrotto: si mantiene lo stato attuale.
    }
  }
}

function safeLocalStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function sanitizeTemplate(raw: unknown): Template | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<Template> & { strokes?: unknown };
  if (typeof candidate.style !== 'string' || typeof candidate.char !== 'string') return null;
  if (!STYLES.includes(candidate.style as Style)) return null;
  if (!Array.isArray(candidate.strokes)) return null;

  const strokes: Stroke[] = [];
  for (const stroke of candidate.strokes) {
    if (!Array.isArray(stroke)) return null;
    const points: Stroke = [];
    for (const point of stroke) {
      if (
        point &&
        typeof point === 'object' &&
        typeof (point as { x?: unknown }).x === 'number' &&
        typeof (point as { y?: unknown }).y === 'number'
      ) {
        points.push({ x: (point as { x: number }).x, y: (point as { y: number }).y });
      }
    }
    if (points.length === 0) return null;
    strokes.push(points);
  }
  if (strokes.length === 0) return null;

  return {
    id:
      typeof candidate.id === 'string'
        ? candidate.id
        : `recorded:${candidate.style}:${candidate.char}`,
    style: candidate.style as Style,
    char: candidate.char,
    strokes,
    source: 'recorded',
  };
}
