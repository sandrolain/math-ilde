# Calligrafo (integrato in Math-ilde)

Libreria TypeScript **zero dipendenze** per verificare lettere scritte a mano su
canvas, usata dalla modalità **✍️ Scrivi** della sezione Sillabe.

Copre quattro stili:

- `stampatello-maiuscolo`
- `stampatello-minuscolo`
- `corsivo-maiuscolo`
- `corsivo-minuscolo`

## Sistema di coordinate "em"

I tratti sono indipendenti dai pixel. Riferimenti verticali:

```
y = 0     rigo alto (ascendenti, maiuscole)
y = 40    rigo del corpo (minuscole senza ascendenti)
y = 80    linea di base (riga rossa)
y = 120   rigo inferiore (discendenti: g j p q y)
```

La componente converte i pixel con `scala = altezzaCanvas / 160` e
`em.y = py.y / scala − 20` (margine di 20 em sopra il rigo alto).

## Moduli

| File | Ruolo |
|---|---|
| `types.ts` | Tipi pubblici (`Stroke`, `Template`, `VerifyResult`, …) |
| `geometry.ts` | Distanze, ricampionamento, bbox, percentili |
| `path.ts` | DSL dei glifi → `Stroke[]` |
| `glyphs/*.ts` | Scheletri dei glifi in stampatello e corsivo |
| `templates.ts` | `builtinTemplates()`, `TemplateStore` (localStorage) |
| `recognizer.ts` | `prepare`, `shapeDistance`, `compare` |
| `calligrafo.ts` | `Calligrafo.verify/recognize`, analisi dei tratti |
| `messages.ts` | `MESSAGES_IT` |

## Verifica rapida

```ts
import { Calligrafo } from './calligrafo';

const cal = new Calligrafo();
const result = cal.verify(
  { style: 'stampatello-minuscolo', char: 'a' },
  strokes, // Stroke[] in unità em
  { shapeThreshold: 0.5, sizeTolerance: 16 },
);

result.ok;      // accettata?
result.stars;   // 0..3
result.issues;  // messaggi in italiano (forma, dimensione, tratti)
```

## Integrazione Angular

- `CalligrafoService` (in `src/app/services`) tiene un'unica istanza del motore e
  dello store dei modelli registrati.
- `HandwritingCanvasComponent` disegna le righe guida, cattura i tratti con i
  Pointer Events, anima il modello ("Mostra") e mostra stelline e messaggi.

## Note e limiti

- I glifi del corsivo incorporati sono modificabili in
  `glyphs/corsivo.ts`. Ogni lettera è una stringa DSL in coordinate em:

  ```ts
  // Un tratto: M = partenza, S = curva attraverso punti, ; = nuovo tratto
  a: 'M32 44 S 20 40 10 48 5 60 10 74 22 80 31 70'
  ```

  Per una grafia italiana verificata conviene registrare tratti reali invece
  di disegnare a mano la stringa DSL. I tratti devono rispettare:

  1. un array per ogni alzata di penna;
  2. coordinate em (`y=0` rigo alto, `y=80` base, `y=120` discendenti);
  3. ordine e verso usati nella didattica della lettera;
  4. stile e carattere corretti (`corsivo-maiuscolo`, `A`, ecc.).

  Esempio di modello registrato:

  ```ts
  calligrafoService.addTemplate({
    id: 'italiano:corsivo-maiuscolo:A',
    style: 'corsivo-maiuscolo',
    char: 'A',
    source: 'recorded',
    strokes: [
      [{ x: 8, y: 80 }, { x: 24, y: 4 }, { x: 44, y: 80 }],
      [{ x: 14, y: 48 }, { x: 37, y: 48 }],
    ],
  });
  ```

  `addTemplate` sovrascrive il modello con lo stesso `id`, aggiorna subito
  verifica e anteprima, poi salva in `localStorage`. Per distribuire una
  raccolta completa, usare `exportedTemplates()` e importare il JSON tramite
  `TemplateStore.fromJSON`.
- Le soglie (`shapeThreshold`, `sizeTolerance`, `FAR`, peso dei puntini) sono
  valori iniziali calibrati sui test sintetici, non ancora sulla grafia reale.
