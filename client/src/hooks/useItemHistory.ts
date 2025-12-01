import {
  fetchItemPriceHistory,
  fetchItemVelocityHistory,
} from "../lib/dotnetapi";
import type { HistoryWindow, ItemHistoryPoint } from "../types/history";
import { useState, useCallback, useEffect } from "react";

interface ItemHistoryState {
  data: ItemHistoryPoint[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

type HistoryFetcher = (
  itemId: number,
  window: HistoryWindow
) => Promise<ItemHistoryPoint[]>;

const getErrorMessage = (error: unknown) => {
  if (!error) return null;
  return error instanceof Error ? error.message : "Failed to load history";
};

const useHistoryQuery = (
  fetcher: HistoryFetcher,
  itemId: number | undefined,
  window: HistoryWindow,
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
      setData(result);
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(getErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, [fetcher, itemId, window]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
};

export const useItemPriceHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemPriceHistory, itemId, window);

export const useItemVelocityHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemVelocityHistory, itemId, window);
