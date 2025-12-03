export type SortOrder = 'asc' | 'desc';

function compareValues(a: unknown, b: unknown): number {
  // Handle null/undefined first
  if (!a && !b) return 0;

  // Push undefined values to the bottom
  if (!a) return 1;   
  if (!b) return -1;

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

function descendingComparator<T, TKey extends keyof T>(
  a: T,
  b: T,
  orderByKey: TKey,
): number {
  return compareValues(a[orderByKey], b[orderByKey]);
}

export function getComparator<T, TKey extends keyof T>(
  order: SortOrder,
  orderBy: TKey,
): (a: T, b: T) => number {
  return order === 'asc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number,
): T[] {
  // Modern JS engines have stable sort; this is fine for most apps.
  return [...array].sort(comparator);
}
