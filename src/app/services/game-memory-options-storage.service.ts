import { Injectable } from '@angular/core';
import type { MemoryOptions } from '../types/exercise.types';

const STORAGE_KEY = 'game-memory-options';

const DEFAULT: MemoryOptions = {
  section: 'game-memory',
  operationType: 'addition',
  gridSize: '4x3',
};

@Injectable({ providedIn: 'root' })
export class GameMemoryOptionsStorageService {
  loadOptions(): MemoryOptions {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT };
      const parsed = JSON.parse(raw) as Partial<MemoryOptions>;
      return { ...DEFAULT, ...parsed };
    } catch {
      return { ...DEFAULT };
    }
  }

  saveOptions(opts: MemoryOptions): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    } catch {
      // ignore
    }
  }
}
