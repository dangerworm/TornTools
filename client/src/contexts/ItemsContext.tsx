import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Item, ItemsMap } from "../types/items";
import type { TornItemsPayload } from "../lib/torn";
import { fetchItems } from "../lib/torn";

type ItemsState = {
  items: Item[];
  itemsById: ItemsMap;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ItemsContext = createContext<ItemsState | null>(null);

const LS_KEY = "torn:items:v2";
const LS_KEY_TS = "torn:items:v2:ts";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeItems(resp: TornItemsPayload): ItemsMap {
  const map: ItemsMap = {};
  if (Array.isArray((resp as TornItemsPayload).items) && (resp as TornItemsPayload).items) {
    for (const it of (resp as TornItemsPayload).items!) {
      const id = Number(it.id);
      if (Number.isFinite(id)) map[id] = { ...it };
    }
  } else {
    for (const [idStr, it] of Object.entries(resp.items!)) {
      const id = Number((it as Item).id ?? idStr);
      if (Number.isFinite(id)) map[id] = { ...(it as Item) };
    }
  }
  return map;
}

export const ItemsProvider: React.FC<{
  children: React.ReactNode;
  ttlMs?: number;
}> = ({ children, ttlMs = DEFAULT_TTL_MS }) => {
  const [itemsById, setItemsById] = useState<ItemsMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );

  useEffect(() => {
    const ts = Number(localStorage.getItem(LS_KEY_TS) ?? 0);
    const age = Date.now() - ts;

    const cached = localStorage.getItem(LS_KEY);
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
      const url = `https://localhost:7012/api/GetItems`;
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const payload = await fetchItems().then(p => p);

      const map = normalizeItems(payload);
      setItemsById(map);
      localStorage.setItem(LS_KEY, JSON.stringify(map));
      localStorage.setItem(LS_KEY_TS, String(Date.now()));
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

  const refresh = async () => revalidate();

  return (
    <ItemsContext.Provider
      value={{ items, itemsById, loading, error, refresh }}
    >
      {children}
    </ItemsContext.Provider>
  );
};

export function useItems() {
  const ctx = useContext(ItemsContext);
  if (!ctx) throw new Error("useItems must be used inside ItemsProvider");
  return ctx;
}
