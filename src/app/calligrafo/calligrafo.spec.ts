import { Calligrafo } from './calligrafo';
import { parsePath } from './path';
import { prepare } from './recognizer';
import { TemplateStore, alphabet, builtinTemplates } from './templates';
import { ITALIAN_STYLE_LABELS, STYLES } from './templates';
import type { Style } from './types';
import { reverseStroke, scaleStrokes, synthesize, translate } from './testing/synth';

function templateFor(style: Style, char: string) {
  const template = builtinTemplates().find((item) => item.style === style && item.char === char);
  if (!template) throw new Error(`modello mancante per ${style} ${char}`);
  return template;
}

describe('parsePath', () => {
  it('accetta comandi attaccati ai numeri (M0 80)', () => {
    const strokes = parsePath('M0 80 L25 0 L50 80');
    expect(strokes).toHaveLength(1);
    expect(strokes[0].length).toBeGreaterThan(2);
  });

  it('separa i tratti con il punto e virgola', () => {
    const strokes = parsePath('M18 40 L18 80 ; M18 22 L18 23');
    expect(strokes).toHaveLength(2);
  });

  it('applica l’inclinazione mantenendo ferma la linea di base', () => {
    const [stroke] = parsePath('M0 80 L0 0', 10, 80);
    const bottom = stroke[0];
    const top = stroke[stroke.length - 1];
    expect(bottom.x).toBeCloseTo(0, 5);
    expect(top.x).toBeGreaterThan(0);
  });
});

describe('modelli predefiniti', () => {
  it('genera 4 stili × 26 lettere con tratti non vuoti', () => {
    const templates = builtinTemplates();
    expect(templates).toHaveLength(4 * 26);
    for (const template of templates) {
      expect(template.style.length).toBeGreaterThan(0);
      expect(template.strokes.length).toBeGreaterThan(0);
      expect(prepare(template.strokes)).not.toBeNull();
    }
  });

  it('espone etichette italiane per tutti gli stili', () => {
    for (const style of STYLES) {
      expect(ITALIAN_STYLE_LABELS[style]).toBeTruthy();
    }
    expect(alphabet()).toHaveLength(26);
  });
});

describe('TemplateStore', () => {
  it('aggiunge, sostituisce, rimuove e fa round-trip JSON', () => {
    const store = new TemplateStore();
    const recorded = {
      id: 'x',
      style: 'corsivo-minuscolo' as Style,
      char: 'a',
      strokes: [[{ x: 1, y: 2 }]],
      source: 'recorded' as const,
    };
    store.add(recorded);
    expect(store.size).toBe(1);
    expect(store.forLetter('corsivo-minuscolo', 'a')).toHaveLength(1);

    const json = JSON.parse(JSON.stringify(store.toJSON()));
    const restored = TemplateStore.fromJSON(json);
    expect(restored.all()).toHaveLength(1);
    expect(restored.all()[0].strokes[0][0]).toEqual({ x: 1, y: 2 });

    store.remove('x');
    expect(store.size).toBe(0);
  });
});

describe('Calligrafo.verify — flusso base', () => {
  const cal = new Calligrafo();

  it('segnala il foglio vuoto', () => {
    const result = cal.verify({ style: 'stampatello-maiuscolo', char: 'A' }, []);
    expect(result.ok).toBe(false);
    expect(result.issues[0].code).toBe('empty');
  });

  it('accetta il modello stesso con tutte le stelle', () => {
    for (const style of STYLES) {
      const template = templateFor(style, style.endsWith('maiuscolo') ? 'A' : 'a');
      const result = cal.verify({ style, char: template.char }, template.strokes, {
        sizeTolerance: null,
      });
      expect(result.ok, `${style} ${template.char}: ${JSON.stringify(result.issues)}`).toBe(true);
      expect(result.stars).toBe(3);
    }
  });

  it('lancia se non esiste alcun modello per la lettera', () => {
    const empty = new Calligrafo({ builtin: false });
    expect(() =>
      empty.verify({ style: 'corsivo-minuscolo', char: 'a' }, [[{ x: 0, y: 0 }]]),
    ).toThrow();
  });
});

describe('Calligrafo — riconoscimento e accettazione su scrittura sintetica', () => {
  const cal = new Calligrafo();

  it('accetta ≥ 90% delle lettere scritte "da bambina"', () => {
    let total = 0;
    let accepted = 0;
    for (const style of STYLES) {
      const upper = style.endsWith('maiuscolo');
      for (const letter of alphabet()) {
        const char = upper ? letter.toUpperCase() : letter;
        const template = templateFor(style, char);
        for (let seed = 1; seed <= 3; seed++) {
          const strokes = synthesize(template.strokes, {
            seed: seed + letter.length * 7 + (upper ? 100 : 0),
          });
          const result = cal.verify({ style, char }, strokes);
          total++;
          if (result.ok) accepted++;
        }
      }
    }
    const rate = accepted / total;
    expect(rate, `accettate ${accepted}/${total}`).toBeGreaterThanOrEqual(0.9);
  });

  it('riconosce la lettera giusta nei primi 3 in ≥ 92% dei casi', () => {
    let total = 0;
    let top3 = 0;
    let top1 = 0;
    for (const style of STYLES) {
      const upper = style.endsWith('maiuscolo');
      for (const letter of alphabet()) {
        const char = upper ? letter.toUpperCase() : letter;
        const template = templateFor(style, char);
        const strokes = synthesize(template.strokes, {
          seed: 42 + letter.length + (upper ? 100 : 0),
        });
        const ranking = cal.recognize(strokes, style, 3);
        total++;
        const index = ranking.findIndex((item) => item.template.char === char);
        if (index >= 0) top3++;
        if (index === 0) top1++;
      }
    }
    expect(top3 / total, `top3 ${top3}/${total}, top1 ${top1}`).toBeGreaterThanOrEqual(0.92);
    expect(top1 / total).toBeGreaterThanOrEqual(0.8);
  });
});

describe('Calligrafo — controlli puntuali', () => {
  const cal = new Calligrafo();

  it('maiuscola scritta come minuscola segnala too-small', () => {
    const lower = templateFor('stampatello-minuscolo', 'o');
    const result = cal.verify({ style: 'stampatello-maiuscolo', char: 'O' }, lower.strokes);
    expect(result.ok).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain('too-small');
  });

  it('lettera spostata in alto segnala too-high', () => {
    const template = templateFor('stampatello-minuscolo', 'o');
    const result = cal.verify(
      { style: 'stampatello-minuscolo', char: 'o' },
      translate(template.strokes, 0, -30),
    );
    expect(result.issues.map((i) => i.code)).toContain('too-high');
  });

  it('lettera spostata in basso segnala too-low', () => {
    const template = templateFor('stampatello-minuscolo', 'o');
    const result = cal.verify(
      { style: 'stampatello-minuscolo', char: 'o' },
      translate(template.strokes, 0, 30),
    );
    expect(result.issues.map((i) => i.code)).toContain('too-low');
  });

  it('sizeTolerance null accetta qualunque scala', () => {
    const template = templateFor('stampatello-maiuscolo', 'A');
    const small = scaleStrokes(template.strokes, 0.4);
    expect(
      cal.verify({ style: 'stampatello-maiuscolo', char: 'A' }, small, { sizeTolerance: null }).ok,
    ).toBe(true);
  });

  it('la i senza puntino segnala missing-part', () => {
    const template = templateFor('stampatello-minuscolo', 'i');
    const result = cal.verify(
      { style: 'stampatello-minuscolo', char: 'i' },
      [template.strokes[0]],
      { sizeTolerance: null },
    );
    expect(result.issues.map((i) => i.code)).toContain('missing-part');
  });

  it('la H con un tratto invertito è warning ma accettata; con strictStrokes è respinta', () => {
    const template = templateFor('stampatello-maiuscolo', 'H');
    const strokes = [template.strokes[0], reverseStroke(template.strokes[1]), template.strokes[2]];
    const soft = cal.verify({ style: 'stampatello-maiuscolo', char: 'H' }, strokes, {
      sizeTolerance: null,
    });
    expect(soft.ok).toBe(true);
    expect(soft.issues.map((i) => i.code)).toContain('stroke-direction');

    const hard = cal.verify({ style: 'stampatello-maiuscolo', char: 'H' }, strokes, {
      sizeTolerance: null,
      strictStrokes: true,
    });
    expect(hard.ok).toBe(false);
  });

  it('tratti in ordine inverso segnalano stroke-order', () => {
    const template = templateFor('stampatello-maiuscolo', 'H');
    const reversed = [...template.strokes].reverse();
    const result = cal.verify({ style: 'stampatello-maiuscolo', char: 'H' }, reversed, {
      sizeTolerance: null,
    });
    expect(result.issues.map((i) => i.code)).toContain('stroke-order');
  });

  it('una lettera diversa viene respinta', () => {
    const template = templateFor('stampatello-maiuscolo', 'B');
    const result = cal.verify({ style: 'stampatello-maiuscolo', char: 'A' }, template.strokes, {
      sizeTolerance: null,
    });
    expect(result.ok).toBe(false);
  });

  it('la E senza barra centrale segnala extra-part o bad-shape', () => {
    const template = templateFor('stampatello-maiuscolo', 'E');
    const result = cal.verify(
      { style: 'stampatello-maiuscolo', char: 'E' },
      [template.strokes[0]],
      { sizeTolerance: null },
    );
    expect(result.ok).toBe(false);
  });

  it('respinge ≥ 90% delle lettere scritte al posto di un’altra', () => {
    let total = 0;
    let rejected = 0;
    for (const style of STYLES) {
      const upper = style.endsWith('maiuscolo');
      for (const letter of alphabet()) {
        const char = upper ? letter.toUpperCase() : letter;
        const other = alphabet()[(letter.length + 3) % 26];
        const otherChar = upper ? other.toUpperCase() : other;
        if (otherChar === char) continue;
        const template = templateFor(style, otherChar);
        const strokes = synthesize(template.strokes, {
          seed: 7 + letter.length + (upper ? 100 : 0),
        });
        const result = cal.verify({ style, char }, strokes);
        total++;
        if (!result.ok) rejected++;
      }
    }
    expect(rejected / total, `respinte ${rejected}/${total}`).toBeGreaterThanOrEqual(0.9);
  });

  it('usa lo store registrato quando i predefiniti sono disattivati', () => {
    const store = new TemplateStore();
    const empty = new Calligrafo({ store, builtin: false });
    const template = templateFor('stampatello-maiuscolo', 'A');
    expect(() =>
      empty.verify({ style: 'stampatello-maiuscolo', char: 'A' }, template.strokes),
    ).toThrow();

    store.add({
      id: 'rec-a',
      style: 'stampatello-maiuscolo',
      char: 'A',
      strokes: template.strokes,
      source: 'recorded',
    });
    empty.sync();
    const result = empty.verify({ style: 'stampatello-maiuscolo', char: 'A' }, template.strokes, {
      sizeTolerance: null,
    });
    expect(result.ok).toBe(true);
  });
});
