// Calligrafo — tipi pubblici della libreria di verifica della scrittura.
// Unità di misura: "em" (vedi geometria.ts). Coordinate indipendenti dai pixel.

export interface Point {
  x: number;
  y: number;
  /** Timestamp opzionale (ms) del momento di campionamento. */
  t?: number;
}

/** Un tratto: penna giù → penna su. */
export type Stroke = Point[];

export type Style =
  'stampatello-maiuscolo' | 'stampatello-minuscolo' | 'corsivo-maiuscolo' | 'corsivo-minuscolo';

export interface Template {
  id: string;
  style: Style;
  char: string;
  strokes: Stroke[];
  source: 'builtin' | 'recorded';
}

export type IssueCode =
  | 'empty'
  | 'wrong-letter'
  | 'bad-shape'
  | 'too-small'
  | 'too-large'
  | 'too-high'
  | 'too-low'
  | 'missing-part'
  | 'extra-part'
  | 'stroke-count'
  | 'stroke-order'
  | 'stroke-direction'
  | 'stroke-start';

export type IssueSeverity = 'error' | 'warning' | 'info';

export interface Issue {
  code: IssueCode;
  severity: IssueSeverity;
  message: string;
  /** Indice (0-based) del tratto utente a cui si riferisce l'issue, se applicabile. */
  stroke?: number;
  /** Lettera riconosciuta, per l'issue `wrong-letter`. */
  recognizedAs?: string;
}

/** Esito del confronto tra i tratti dell'utente e un modello. */
export interface Candidate {
  template: Template;
  /** Distanza di forma (0 = identico, cresce con la differenza). */
  d: number;
  /** Punteggio di forma in [0, 1]. */
  score: number;
  /** Indici dei tratti del modello risultati mancanti. */
  missing: number[];
  /** Frazione di punti utente "scoperti" (tratti in più). */
  extra: number;
}

export interface VerifyResult {
  ok: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  shapeScore: number;
  sizeScore: number | null;
  issues: Issue[];
  matched: Candidate | null;
  ranking: Candidate[];
}

export interface VerifyOptions {
  /** Soglia minima di forma per accettare la lettera. Default 0.5. */
  shapeThreshold?: number;
  /** Tolleranza verticale in em. `null` o `Infinity` disattivano il controllo. Default 16. */
  sizeTolerance?: number | null;
  /** Se true, ordine e verso dei tratti errati rendono la lettera non valida. Default false. */
  strictStrokes?: boolean;
  /** Testi personalizzati (i18n o messaggi dedicati). */
  messages?: Partial<Messages>;
}

/** Testi dei messaggi, uno per codice issue. */
export interface Messages {
  empty: string;
  'wrong-letter': string;
  'bad-shape': string;
  'too-small': string;
  'too-large': string;
  'too-high': string;
  'too-low': string;
  'missing-part': string;
  'extra-part': string;
  'stroke-count': string;
  'stroke-order': string;
  'stroke-direction': string;
  'stroke-start': string;
}

export interface LetterTarget {
  style: Style;
  char: string;
}
