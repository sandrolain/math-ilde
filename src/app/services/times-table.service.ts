import { Injectable } from '@angular/core';
import type { TimesTableRow, TimesTableLength } from '../types/exercise.types';

@Injectable({ providedIn: 'root' })
export class TimesTableService {
  generateTable(multiplier: number, length: TimesTableLength): TimesTableRow[] {
    const rows: TimesTableRow[] = [];
    for (let factor = 1; factor <= length; factor++) {
      rows.push({ multiplier, factor, result: multiplier * factor });
    }
    return rows;
  }

  shuffleResults(rows: TimesTableRow[]): number[] {
    const results = rows.map((r) => r.result);
    // Fisher-Yates shuffle
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }
    return results;
  }

  checkPositions(rows: TimesTableRow[], current: number[]): boolean[] {
    return rows.map((row, i) => current[i] === row.result);
  }

  isCompleted(rows: TimesTableRow[], current: number[]): boolean {
    return rows.every((row, i) => current[i] === row.result);
  }
}
