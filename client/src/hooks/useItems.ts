import { useMemo } from "react";
import { useQuery } from "../lib/react-query";
import { fetchItems } from "../lib/dotnetapi";
import type { Item, ItemsMap } from "../types/items";

const LOCAL_STORAGE_KEY_ITEMS = "torntools:items:v1";
const LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED = "torntools:items:v1:ts";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeItems = (resp: Item[]): ItemsMap => {
  const map: ItemsMap = {};
  if (Array.isArray(resp)) {
    for (const item of resp) {
      const id = Number(item.id);
      if (Number.isFinite(id)) map[id] = { ...item };
    }
  } else {
    for (const [idStr, it] of Object.entries(resp)) {
      const id = Number((it as Item).id ?? idStr);
      if (Number.isFinite(id)) map[id] = { ...(it as Item) };
    }
  }
  return map;
};

const getCachedItems = (ttlMs: number): ItemsMap | undefined => {
  try {
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    const cachedAt = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED) ?? 0
    );
    if (!cached || !cachedAt) return undefined;
    if (Date.now() - cachedAt > ttlMs) return undefined;
    return JSON.parse(cached) as ItemsMap;
  } catch {
    return undefined;
  }
};

const persistItems = (items: ItemsMap) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(items));
    localStorage.setItem(
      LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED,
      String(Date.now())
    );
  } catch {
    // If localStorage is unavailable, skip persistence
  }
};

export const ITEMS_QUERY_KEY = ["items"] as const;

export const useItems = (ttlMs = DEFAULT_TTL_MS) => {
  const query = useQuery<ItemsMap>({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: async () => {
      const payload = await fetchItems();
      const map = normalizeItems(payload);
      persistItems(map);
      return map;
    },
    staleTime: ttlMs,
    initialData: () => getCachedItems(ttlMs),
  });

  const itemsById = query.data ?? {};
  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
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
