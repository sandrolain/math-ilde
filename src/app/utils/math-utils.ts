/** Numero intero casuale inclusivo in [min, max] */
export function rnd(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Fisher-Yates shuffle (restituisce una nuova copia) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Elemento casuale da un array */
export function randomFrom<T>(arr: T[]): T {
  return arr[rnd(0, arr.length - 1)];
}
