export type SortOrder = 'asc' | 'desc';

function compareValues(a: unknown, b: unknown): number {
  // Numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }

  // Strings
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b);
  }

  // Booleans (false < true)
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }

  // Dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }

  // Fallback: compare stringified values
  return String(a).localeCompare(String(b));
}

export function getComparator<T, TKey extends keyof T>(
  order: SortOrder,
  orderBy: TKey,
): (a: T, b: T) => number {
  return (a, b) => {
    const av = a[orderBy];
    const bv = b[orderBy];
    // Always push null/undefined to the bottom regardless of sort direction
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = compareValues(av, bv);
    return order === 'asc' ? cmp : -cmp;
  };
}

export function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number,
): T[] {
  // Modern JS engines have stable sort; this is fine for most apps.
  return [...array].sort(comparator);
}
