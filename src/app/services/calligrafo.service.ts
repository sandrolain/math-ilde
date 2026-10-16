import { Injectable } from '@angular/core';
import {
  Calligrafo,
  TemplateStore,
  builtinTemplates,
  type Candidate,
  type LetterTarget,
  type Stroke,
  type Style,
  type Template,
  type VerifyOptions,
  type VerifyResult,
} from '../calligrafo';

/**
 * Servizio condiviso che espone il motore Calligrafo e lo store dei modelli
 * registrati. I modelli predefiniti vengono preparati una sola volta.
 */
@Injectable({ providedIn: 'root' })
export class CalligrafoService {
  readonly store = new TemplateStore();
  private readonly engine: Calligrafo;

  constructor() {
    this.store.loadLocal();
    this.engine = new Calligrafo({ store: this.store });
  }

  verify(target: LetterTarget, strokes: readonly Stroke[], options?: VerifyOptions): VerifyResult {
    return this.engine.verify(target, strokes, options);
  }

  recognize(strokes: readonly Stroke[], style: Style, limit = 5): Candidate[] {
    return this.engine.recognize(strokes, style, limit);
  }

  findTemplate(style: Style, char: string): Template | undefined {
    return this.engine.templatesFor(style, char)[0] ?? this.builtinTemplate(style, char);
  }

  /** Registra un modello scritto a mano e lo rende subito disponibile. */
  addTemplate(template: Template): Template {
    const stored = this.store.add(template);
    this.engine.sync();
    this.store.saveLocal();
    return stored;
  }

  removeTemplate(id: string): void {
    this.store.remove(id);
    this.engine.sync();
    this.store.saveLocal();
  }

  exportedTemplates(): string {
    return JSON.stringify(this.store.toJSON(), null, 2);
  }

  private builtinTemplate(style: Style, char: string): Template | undefined {
    const wanted = style.endsWith('maiuscolo') ? char.toUpperCase() : char.toLowerCase();
    return builtinTemplates().find((item) => item.style === style && item.char === wanted);
  }
}
