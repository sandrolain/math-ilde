import { Injectable } from '@angular/core';

const GRUPPI_INSEPARABILI = [
  'str',
  'spr',
  'scr',
  'spl',
  'squ',
  'psi',
  'gn',
  'gl',
  'ch',
  'gh',
  'sc',
  'tr',
  'br',
  'cr',
  'dr',
  'fr',
  'pr',
  'bl',
  'cl',
  'fl',
  'pl',
  'gr',
  'qu',
  'st',
];

const DITTONGHI = [
  'au',
  'ai',
  'ei',
  'oi',
  'ui',
  'ia',
  'ie',
  'io',
  'iu',
  'uo',
  'ue',
  'ea',
  'eo',
  'ao',
  'ae',
];

const VOCALI = 'aeiouàèéìòóù';

const CASI_SPECIALI: Record<string, string[]> = {
  andrea: ['An', 'dre', 'a'],
  Andrea: ['An', 'dre', 'a'],
};

function isVocale(char: string | undefined): boolean {
  return char !== undefined && VOCALI.includes(char.toLowerCase());
}

function syllabify(parola: string): string[] {
  if (CASI_SPECIALI[parola]) {
    return CASI_SPECIALI[parola];
  }

  const risultato: string[] = [];
  let i = 0;

  while (i < parola.length) {
    let sillaba = '';
    let gruppoTrovato = false;

    // 1. Cerca gruppi inseparabili (da più lungo a più corto)
    for (let len = 4; len >= 2; len--) {
      const substr = parola.slice(i, i + len).toLowerCase();
      if (GRUPPI_INSEPARABILI.includes(substr)) {
        sillaba = parola.slice(i, i + len);
        i += len;
        gruppoTrovato = true;
        break;
      }
    }

    // Se non è un gruppo inseparabile, prendi le consonanti singole
    if (!gruppoTrovato) {
      while (i < parola.length && !isVocale(parola[i])) {
        sillaba += parola[i];
        i++;
      }
    }

    // 2. Aggiungi vocali e dittonghi
    if (i < parola.length && isVocale(parola[i])) {
      const dittongo = DITTONGHI.find((d) => parola.slice(i, i + d.length).toLowerCase() === d);

      if (dittongo) {
        sillaba += parola.slice(i, i + dittongo.length);
        i += dittongo.length;
      } else {
        sillaba += parola[i];
        i++;
      }
    }

    // 3. Gestione consonanti finali
    if (i < parola.length && !isVocale(parola[i])) {
      let consonantiConsecutive = 0;
      let j = i;
      while (j < parola.length && !isVocale(parola[j])) {
        consonantiConsecutive++;
        j++;
      }

      if (j >= parola.length) {
        sillaba += parola.slice(i);
        i = parola.length;
      } else if (consonantiConsecutive === 1) {
        // Una sola consonante: va con la sillaba successiva
      } else if (consonantiConsecutive >= 2) {
        const prossimoDue = parola.slice(i, i + 2).toLowerCase();
        const prossimoTre = parola.slice(i, i + 3).toLowerCase();
        const prossimoQuattro = parola.slice(i, i + 4).toLowerCase();

        let gruppoSuccessivo = false;

        if (consonantiConsecutive >= 4 && GRUPPI_INSEPARABILI.includes(prossimoQuattro)) {
          gruppoSuccessivo = true;
        } else if (consonantiConsecutive >= 3 && GRUPPI_INSEPARABILI.includes(prossimoTre)) {
          gruppoSuccessivo = true;
        } else if (consonantiConsecutive >= 2 && GRUPPI_INSEPARABILI.includes(prossimoDue)) {
          gruppoSuccessivo = true;
        }

        if (!gruppoSuccessivo) {
          sillaba += parola[i];
          i++;
        }
      }
    }

    if (sillaba) {
      risultato.push(sillaba);
    }
  }

  return risultato;
}

@Injectable({ providedIn: 'root' })
export class SyllabificationService {
  syllabify(word: string): string[] {
    return syllabify(word);
  }

  splitWord(word: string): string[] {
    return syllabify(word);
  }

  splitSentence(sentence: string): string[][] {
    return sentence.split(' ').map((word) => syllabify(word));
  }
}
