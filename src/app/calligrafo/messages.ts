import type { Messages } from './types';

/**
 * Messaggi predefiniti in italiano, adatti a una bambina della scuola primaria.
 * Possono essere sostituiti (anche parzialmente) tramite `VerifyOptions.messages`,
 * oppure localizzati in altre lingue.
 */
export const MESSAGES_IT: Messages = {
  empty: 'Il foglio è vuoto: scrivi la lettera prima di controllare.',
  'wrong-letter': 'Questa sembra un’altra lettera. Riguarda il modello e riprova.',
  'bad-shape': 'La forma non è ancora quella giusta. Riprova seguendo il tratteggio.',
  'too-small': 'La lettera è troppo piccola: falla arrivare fino alle righe giuste.',
  'too-large': 'La lettera è troppo grande: resta dentro le righe.',
  'too-high': 'La lettera è troppo in alto: appoggiala sulla riga rossa.',
  'too-low': 'La lettera è troppo in basso: appoggiala sulla riga rossa.',
  'missing-part': 'Manca una parte della lettera: guarda bene il modello.',
  'extra-part': 'C’è un tratto in più: prova a seguire solo il modello.',
  'stroke-count': 'Hai usato un numero di tratti diverso dal modello.',
  'stroke-order': 'L’ordine dei tratti è diverso: prova a seguirli in ordine.',
  'stroke-direction': 'Un tratto è nel verso sbagliato: parti dall’altro capo.',
  'stroke-start': 'Un tratto parte da un punto diverso dal modello.',
};

export const MESSAGES = MESSAGES_IT;
