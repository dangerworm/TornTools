import { useMemo } from "react";
import { useQuery } from "../lib/react-query";
import { fetchForeignStockItems } from "../lib/dotnetapi";
import type {
  ForeignStockItem,
  ForeignStockItemsMap,
} from "../types/foreignStockItems";

const LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS = "torntools:foreignStockItems:v1";
const LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED =
  "torntools:foreignStockItems:v1:ts";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeItems = (resp: ForeignStockItem[]): ForeignStockItemsMap => {
  const map: ForeignStockItemsMap = {};
  if (Array.isArray(resp)) {
    for (const item of resp) {
      const id = Number(item.itemId);
      if (Number.isFinite(id)) map[`${id}|${item.country}`] = { ...item };
    }
  } else {
    for (const [idStr, it] of Object.entries(resp)) {
      const item = it as ForeignStockItem;
      const id = Number(item.itemId ?? idStr);
      if (Number.isFinite(id)) map[`${id}|${item.country}`] = { ...item };
    }
  }
  return map;
};

const getCachedItems = (ttlMs: number): ForeignStockItemsMap | undefined => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS);
    const cachedAt = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED) ?? 0
    );
    if (!cached || !cachedAt) return undefined;
    if (Date.now() - cachedAt > ttlMs) return undefined;
    return JSON.parse(cached) as ForeignStockItemsMap;
  } catch {
    return undefined;
  }
};

const persistItems = (items: ForeignStockItemsMap) => {
  try {
    localStorage.setItem(
      LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS,
      JSON.stringify(items)
    );
    localStorage.setItem(
      LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED,
      String(Date.now())
    );
  } catch {
    // Ignore persistence issues
  }
};

export const FOREIGN_STOCK_ITEMS_QUERY_KEY = ["foreignStockItems"] as const;

export const useForeignStockItems = (ttlMs = DEFAULT_TTL_MS) => {
  const query = useQuery<ForeignStockItemsMap>({
    queryKey: FOREIGN_STOCK_ITEMS_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchForeignStockItems();
      const map = normalizeItems(payload);
      persistItems(map);
      return map;
    },
    staleTime: ttlMs,
    initialData: () => getCachedItems(ttlMs),
  });

  const itemsById = query.data ?? {};
  const items = useMemo(
    () =>
      Object.values(itemsById).sort((a, b) =>
        a.itemName.localeCompare(b.itemName)
      ),
    [itemsById]
  );

  const error = query.error
    ? query.error instanceof Error
      ? query.error.message
      : "Unknown error"
    : null;

  return {
    items,
    itemsById,
    loading: query.isLoading || (!query.data && query.isFetching),
    error,
    refresh: query.refetch,
  };
};
