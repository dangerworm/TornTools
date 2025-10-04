// src/contexts/TornItemsContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Item, ItemsCollection, ItemsMap } from "../types/items";

type ItemsState = {
  items: Item[];
  itemsById: ItemsMap;
  loading: boolean;
  error: string | null;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  refresh: () => Promise<void>;
};

const ItemsContext = createContext<ItemsState | null>(null);

const LS_KEY = "torn:items:v2";
const LS_KEY_TS = "torn:items:v2:ts";
const LS_KEY_API = "torn:apiKey";
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

function normalizeItems(resp: ItemsCollection): ItemsMap {
  const map: ItemsMap = {};
  if (Array.isArray((resp as ItemsCollection).items)) {
    for (const it of (resp as ItemsCollection).items) {
      const id = Number(it.id);
      if (Number.isFinite(id)) map[id] = { ...it };
    }
  } else {
    for (const [idStr, it] of Object.entries(resp.items)) {
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
  const [apiKey, setApiKeyState] = useState<string | null>(() =>
    localStorage.getItem(LS_KEY_API)
  );
  const abortRef = useRef<AbortController | null>(null);

  const items = useMemo(
    () => Object.values(itemsById).sort((a, b) => a.name.localeCompare(b.name)),
    [itemsById]
  );

  useEffect(() => {
    if (!apiKey) return;
    const ts = Number(localStorage.getItem(LS_KEY_TS) ?? 0);
    const age = Date.now() - ts;

    const cached = localStorage.getItem(LS_KEY);
    if (cached && age < ttlMs) {
      setItemsById(JSON.parse(cached));
    }
    void revalidate();
  }, [apiKey, ttlMs]);

  const revalidate = async () => {
    if (!apiKey) return;
    setLoading(true);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const url = `https://api.torn.com/v2/torn/items?sort=ASC&key=${encodeURIComponent(
        apiKey
      )}`;
      const res = await fetch(url, {
        headers: { accept: "application/json" },
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

      const json = await res.json();
      if (json.error) throw new Error(json.error.error ?? "Torn API error");

      const map = normalizeItems(json);
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

  const setApiKey = (key: string | null) => {
    const isNewKey = key && key !== apiKey;

    setApiKeyState(key);
    if (isNewKey) {
      localStorage.setItem(LS_KEY_API, key);
      void refresh();
    } else {
      localStorage.removeItem(LS_KEY_API);
      localStorage.removeItem(LS_KEY);
      localStorage.removeItem(LS_KEY_TS);
      setItemsById({});
    }
  };

  return (
    <ItemsContext.Provider
      value={{ items, itemsById, loading, error, apiKey, setApiKey, refresh }}
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
