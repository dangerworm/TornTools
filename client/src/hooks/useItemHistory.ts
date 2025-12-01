import { useQuery } from "./useQuery";
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

const HISTORY_STALE_TIME_MS = 5 * 60 * 1000;

const getErrorMessage = (error: unknown) => {
  if (!error) return null;
  return error instanceof Error ? error.message : "Failed to load history";
};

const useHistoryQuery = (
  fetcher: HistoryFetcher,
  itemId: number | undefined,
  window: HistoryWindow,
  keySuffix: string
): ItemHistoryState => {
  const query = useQuery<ItemHistoryPoint[]>({
    queryKey: ["itemHistory", keySuffix, itemId, window],
    queryFn: () => fetcher(itemId!, window),
    enabled: !!itemId,
    staleTime: HISTORY_STALE_TIME_MS,
    initialData: undefined
  });

  return {
    data: query.data ?? [],
    loading: query.isLoading,
    error: getErrorMessage(query.error),
    refresh: async () => {
      if (!itemId) return;
      await query.refetch();
    },
  };
};

export const useItemPriceHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemPriceHistory, itemId, window, "price");

export const useItemVelocityHistory = (
  itemId: number | undefined,
  window: HistoryWindow
) => useHistoryQuery(fetchItemVelocityHistory, itemId, window, "velocity");
