import {
  fetchItemPriceHistory,
  fetchItemVelocityHistory,
} from "../lib/dotnetapi";
import type { HistoryWindow, ItemHistoryPoint } from "../types/history";
import { useState, useCallback, useEffect } from "react";

export interface ItemHistoryState {
  data: ItemHistoryPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

interface HistoryResult {
  timestamp: string;
  price?: number;
  velocity?: number;
}

type HistoryFetcher = (
  itemId: number,
  window: HistoryWindow
) => Promise<HistoryResult[]>;

const getErrorMessage = (error: unknown) => {
  if (!error) return null;
  return error instanceof Error ? error.message : "Failed to load history";
};

const mapResult = (result: HistoryResult[], includeZeroValues: boolean): ItemHistoryPoint[] => {
  return result
    .filter(point => typeof point.price === 'number' || typeof point.velocity === 'number')
    .map((point) => ({
      timestamp: new Date(point.timestamp).getTime(),
      value: point.price ?? point.velocity ?? 0
    } as ItemHistoryPoint))
    .filter(point => includeZeroValues || point.value !== 0);
};

const useHistoryQuery = (
  fetcher: HistoryFetcher,
  itemId: number | undefined,
  window: HistoryWindow,
  includeZeroValues: boolean
): ItemHistoryState => {
  const [data, setData] = useState<ItemHistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!itemId) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(itemId, window);
      setData(mapResult(result, includeZeroValues));
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(getErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, itemId, window, includeZeroValues]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
};

export const useItemPriceHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemPriceHistory, itemId, window, false);

export const useItemVelocityHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemVelocityHistory, itemId, window, true);
