// src/hooks/useMarketScan.ts
import { useEffect, useRef, useState } from "react";
import type { Item } from "../types/items";
import { fetchProfitableListings } from "../lib/dotnetapi";
import type { ProfitableListing } from "../types/profitableListings";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface Options {
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

export function useResaleScan(
  items: Item[] | null,
  opts?: Options
) {
  const { intervalMs = 1000 } = opts || {};

  const [rows, setRows] = useState<ProfitableListing[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);



  useEffect(() => {
    setError(null);

    if (!items || items.length === 0) {
      setRows([]);
      return;
    }

    const tick = async () => {
      fetchProfitableListings()
        .then(data => {
          setRows(data)
        })
        .catch(err => {
          setError(err.message);
          setRows([]);
        });
    };

    // Start interval
    timerRef.current = window.setInterval(tick, intervalMs);
    void tick();

    // Cleanup on unmount or when deps change
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

  }, [items, intervalMs]);

  return { rows, error };
}