// In-memory TTL cache (per item_id)
type Entry<T> = { at: number; data: T };
export function createTtlCache<T>(ttlMs: number) {
  const map = new Map<number, Entry<T>>();
  return {
    get(id: number): T | null {
      const e = map.get(id);
      if (!e) return null;
      if (Date.now() - e.at > ttlMs) return null;
      return e.data;
    },
    set(id: number, data: T) {
      map.set(id, { at: Date.now(), data });
    }
  };
}
