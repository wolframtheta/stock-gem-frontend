/** Mou l'element `from` a la posició `to`; retorna una còpia (índexs fora de rang → sense canvis). */
export function moveVariant<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  if (
    from === to ||
    from < 0 ||
    to < 0 ||
    from >= copy.length ||
    to >= copy.length
  ) {
    return copy;
  }
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/** Assigna `sortOrder` 0..N-1 segons l'ordre de la llista. */
export function withSortOrder<T extends object>(
  list: readonly T[],
): (T & { sortOrder: number })[] {
  return list.map((item, index) => ({ ...item, sortOrder: index }));
}
