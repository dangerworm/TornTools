import { useCallback, useEffect, useState } from "react";
import {
  fetchItemPriceHistory,
  fetchItemVelocityHistory,
} from "../lib/dotnetapi";
import type { HistoryWindow, ItemHistoryPoint } from "../types/history";

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

const useHistoryFetcher = (
  fetcher: HistoryFetcher,
  itemId: number | undefined,
  window: HistoryWindow
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
        setError("Failed to load history");
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
) => useHistoryFetcher(fetchItemPriceHistory, itemId, window);

export const useItemVelocityHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryFetcher(fetchItemVelocityHistory, itemId, window);
