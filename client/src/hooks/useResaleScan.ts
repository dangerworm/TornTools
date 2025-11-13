// src/hooks/useMarketScan.ts
import { useEffect, useState } from "react";
import type { Item } from "../types/items";
import { fetchProfitableListings } from "../lib/api";
import type { ProfitableListing } from "../types/profitableListings";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

interface Options {
  minProfit?: number;
  maxBuyPrice?: number;
  margin?: number;
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
}

let timer: number | null = null;

export function useResaleScan(
  items: Item[] | null,
  opts?: Options
) {
  const {
    minProfit = 1000,
    maxBuyPrice = 50000,
    margin = Number(import.meta.env.VITE_TORN_MARGIN ?? 500),
    intervalMs = 1000,
  } = opts || {};

  const [rows, setRows] = useState<ProfitableListing[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    setError(null);

    if (!items || items.length === 0) {
      setRows([]);
      return;
    }

    if (timer === null) {
      timer = window.setInterval(tick, intervalMs);
      void tick(); // kick immediately so first task doesn't wait
    }

  }, [items, minProfit, maxBuyPrice, margin, intervalMs]);

  return { rows, error };
}