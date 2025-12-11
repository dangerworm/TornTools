import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { API_BASE_URL } from "../constants/apiConstants";
import { fetchItems } from "../lib/dotnetapi";
import { ItemsContext, type ItemsContextModel } from "../hooks/useItems";
import type { Item, ItemsMap } from "../types/items";

const LOCAL_STORAGE_KEY_ITEMS = "torntools:items:v1";
const LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED = "torntools:items:v1:ts";
const DEFAULT_TTL_MS = 60 * 60 * 1000;

const normalizeItems = (resp: Item[]): ItemsMap => {
  const map: ItemsMap = {};
  if (Array.isArray(resp)) {
    for (const item of resp!) {
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

type ItemsProviderProps = {
  children: ReactNode;
  ttlMs?: number;
};

export const ItemsProvider = ({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: ItemsProviderProps) => {
  const [itemsById, setItemsById] = useState<ItemsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (itemsById && Object.keys(itemsById).length > 0) {
      return;
    }

    const itemsMap = getCachedItems(ttlMs);
    if (itemsMap) {
      setItemsById(itemsMap);
      return;
    }

    void revalidate();
  }, [itemsById, ttlMs]);

  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );

  const now = useMemo(() => Date.now(), []);

  useEffect(() => {
    const timeServed = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED) ?? 0
    );
    const age = now - timeServed;

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    if (cached && age < ttlMs) {
      setItemsById(JSON.parse(cached));
    }
    void revalidate();
  }, [ttlMs, now]);

  const revalidate = async () => {
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const url = `${API_BASE_URL}/GetItems`;
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const payload = await fetchItems().then((data) => data);

      const map = normalizeItems(payload);
      setItemsById(map);
      persistItems(map);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unknown error");
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = useMemo(() => async () => revalidate(), []);

  const contextValue = useMemo(
    () =>
      ({
        items,
        itemsById,
        loading,
        error,
        refresh,
      } as ItemsContextModel),
    [items, itemsById, loading, error, refresh]
  );

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
