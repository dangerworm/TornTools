import { useEffect, useRef, useState } from "react";
import { fetchForeignStockItems } from "../lib/dotnetapi";
import type { ForeignStockItem } from "../types/foreignStockItems";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface Options {
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

export function useForeignMarketsScan(
  opts?: Options
) {
  const { intervalMs = 60000 } = opts || {};

  const [rows, setRows] = useState<ForeignStockItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setError(null);

    const tick = async () => {
      fetchForeignStockItems()
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

  }, [intervalMs]);

  return { rows, error };
}