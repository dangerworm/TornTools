import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchForeignStockItems } from "../lib/dotnetapi";
import { API_BASE_URL } from "../constants/ApiConstants";
import { ForeignStockItemsContext } from "../hooks/useForeignStockItems";
import type { ForeignStockItem, ForeignStockItemsMap } from "../types/foreignStockItems";

const LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS = "torntools:foreignStockItems:v1";
const LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED = "torntools:foreignStockItems:v1:ts";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

const normalizeItems = (resp: ForeignStockItem[]): ForeignStockItemsMap => {
  const map: ForeignStockItemsMap = {};
  if (Array.isArray(resp)) {
    for (const item of resp!) {
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
}

type ItemsProviderProps = {
  children: ReactNode;
  ttlMs?: number;
};

export const ForeignStockItemsProvider = ({
  children,
  ttlMs = DEFAULT_TTL_MS,
}: ItemsProviderProps) => {
  const [itemsById, setItemsById] = useState<ForeignStockItemsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.itemName.localeCompare(b.itemName)),
    [itemsById]
  );

  useEffect(() => {
    const timeServed = Number(
      localStorage.getItem(LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED) ?? 0
    );
    const age = Date.now() - timeServed;

    const cached = localStorage.getItem(LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS);
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
      const url = `${API_BASE_URL}/GetForeignStockItems`;
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const payload = await fetchForeignStockItems().then((p) => p);

      const map = normalizeItems(payload);
      setItemsById(map);
      localStorage.setItem(LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS, JSON.stringify(map));
      localStorage.setItem(
        LOCAL_STORAGE_KEY_FOREIGN_STOCK_ITEMS_TIME_SERVED,
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
    <ForeignStockItemsContext.Provider value={contextValue}>
      {children}
    </ForeignStockItemsContext.Provider>
  );
};
