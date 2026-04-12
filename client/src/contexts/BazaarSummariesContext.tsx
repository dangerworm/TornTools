import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchBazaarSummaries } from "../lib/dotnetapi";
import { BazaarSummariesContext, type BazaarSummariesContextModel } from "../hooks/useBazaarSummaries";
import type { BazaarSummariesMap, BazaarSummary } from "../types/bazaarSummaries";

const LOCAL_STORAGE_KEY = "torntools:bazaar-summaries:v1";
const LOCAL_STORAGE_KEY_TS = "torntools:bazaar-summaries:v1:ts";
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCached = (ttlMs: number): BazaarSummariesMap | undefined => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    const cachedAt = Number(localStorage.getItem(LOCAL_STORAGE_KEY_TS) ?? 0);
    if (!cached || !cachedAt) return undefined;
    if (Date.now() - cachedAt > ttlMs) return undefined;
    return JSON.parse(cached) as BazaarSummariesMap;
  } catch {
    return undefined;
  }
};

const persist = (map: BazaarSummariesMap) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(map));
    localStorage.setItem(LOCAL_STORAGE_KEY_TS, String(Date.now()));
  } catch {
    // localStorage unavailable — skip
  }
};

type Props = { children: ReactNode; ttlMs?: number };

export const BazaarSummariesProvider = ({ children, ttlMs = DEFAULT_TTL_MS }: Props) => {
  const [summaries, setSummaries] = useState<BazaarSummariesMap>(() => getCached(ttlMs) ?? {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached(ttlMs);
    if (cached) {
      setSummaries(cached);
      return;
    }
    void load();
  }, [ttlMs]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchBazaarSummaries();
      const map: BazaarSummariesMap = {};
      for (const item of data as BazaarSummary[]) {
        map[item.itemId] = item;
      }
      setSummaries(map);
      persist(map);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load bazaar summaries");
    } finally {
      setLoading(false);
    }
  };

  const contextValue = useMemo<BazaarSummariesContextModel>(
    () => ({ summaries, loading, error }),
    [summaries, loading, error]
  );

  return (
    <BazaarSummariesContext.Provider value={contextValue}>
      {children}
    </BazaarSummariesContext.Provider>
  );
};
