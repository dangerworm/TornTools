import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Item, ItemsMap } from "../types/items";
import { fetchItems } from "../lib/dotnetapi";
import { API_BASE_URL } from "../constants/ApiConstants";
import { ItemsContext } from "../hooks/useItems";

const LOCAL_STORAGE_KEY_ITEMS = "torntools:items:v1";
const LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED = "torntools:items:v1:ts";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

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
}

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

  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );

  useEffect(() => {
    const timeServed = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED) ?? 0
    );
    const age = Date.now() - timeServed;

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_ITEMS);
    if (cached && age < ttlMs) {
      setItemsById(JSON.parse(cached));
    }
    void revalidate();
  }, [ttlMs]);

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

      const payload = await fetchItems().then((p) => p);

      const map = normalizeItems(payload);
      setItemsById(map);
      localStorage.setItem(LOCAL_STORAGE_KEY_ITEMS, JSON.stringify(map));
      localStorage.setItem(
        LOCAL_STORAGE_KEY_ITEMS_TIME_SERVED,
        String(Date.now())
      );
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
    () => ({
      items,
      itemsById,
      loading,
      error,
      refresh,
    }),
    [items, itemsById, loading, error, refresh]
  );

  return (
    <ItemsContext.Provider value={contextValue}>
      {children}
    </ItemsContext.Provider>
  );
};
