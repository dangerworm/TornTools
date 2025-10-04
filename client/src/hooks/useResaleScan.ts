// src/hooks/useMarketScan.ts
import { useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "../types/items";
import { createRateLimiter } from "../lib/rateLimiter";
import { createTtlCache } from "../lib/cache";
import { fetchItemMarket, type TornItemMarketPayload } from "../lib/torn";

export type RowStatus = "queued" | "fetching" | "cached" | "done" | "error";

export interface ScanRow {
  id: number;
  name: string;
  sell_price: number;
  status: RowStatus;
  best_price?: number;
  best_amount?: number;
  profit_each?: number;
  interesting: boolean; // price <= sell - margin & amount >= minAmount
  error?: string;
}

interface Options {
  maxItems?: number;
  minSellPrice?: number;
  margin?: number;
  minAmount?: number;
  limitPerCall?: number;
  ttlSeconds?: number;
  intervalMs?: number; // one call per interval (keeps us <100/min by default)
  pinInterestingFirst?: boolean;
}

export function useResaleScan(
  apiKey: string | null,
  items: Item[] | null,
  opts?: Options
) {
  const {
    maxItems = 200,
    minSellPrice = 3000,
    margin = Number(import.meta.env.VITE_TORN_MARGIN ?? 500),
    minAmount = 1,
    limitPerCall = 20,
    ttlSeconds = 60,
    intervalMs = 750,             // ~80/min -> under Torn’s 100/min
    pinInterestingFirst = true,
  } = opts || {};

  const [rows, setRows] = useState<ScanRow[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const limiter = useMemo(() => createRateLimiter(intervalMs), [intervalMs]);
  const cache = useRef(createTtlCache<unknown>(ttlSeconds * 1000));
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    setError(null);

    if (!apiKey || !items || items.length === 0) {
      setRows([]);
      setStatus("idle");
      return;
    }

    const candidates = [...items]
      .filter(i => (i.value?.sell_price ?? 0) >= minSellPrice)
      .sort((a, b) => (b.value?.sell_price ?? 0) - (a.value?.sell_price ?? 0))
      .slice(0, maxItems);

    // Prepopulate the table so the user sees everything immediately
    const seed: ScanRow[] = candidates.map(i => ({
      id: i.id,
      name: i.name,
      sell_price: i.value?.sell_price ?? 0,
      status: "queued",
      interesting: false,
    }));
    setRows(seed);
    setStatus("running");

    const run = async () => {
      try {
        const tasks = candidates.map((it) => {
          const sellPrice = it.value?.sell_price ?? 0;
          const targetMax = sellPrice - margin;

          return limiter.enqueue(async () => {
            if (cancelled.current) return;

            // mark fetching
            setRows(prev => {
              const copy = [...prev];
              const pos = copy.findIndex(r => r.id === it.id);
              if (pos >= 0) copy[pos] = { ...copy[pos], status: "fetching" };
              return copy;
            });

            // cache
            const cached = cache.current.get(it.id) as TornItemMarketPayload | null;
            if (cached) {
              setRows(prev => {
                const copy = [...prev];
                const pos = copy.findIndex(r => r.id === it.id);
                if (pos >= 0) copy[pos] = { ...copy[pos], status: "cached" };
                return copy;
              });
            }

            const payload = cached
              ? cached
              : await fetchItemMarket(apiKey, it.id, limitPerCall, 0).then(p => {
                  cache.current.set(it.id, p);
                  return p;
                });

            const listings = payload?.itemmarket?.listings ?? [];
            const interesting = listings.filter(l => l.amount >= minAmount && l.price <= targetMax);
            let nextRowPatch: Partial<ScanRow> = { status: "done" };

            if (interesting.length) {
              const best = interesting.reduce((m, l) => (l.price < m.price ? l : m), interesting[0]);
              const profit = sellPrice - best.price;
              nextRowPatch = {
                ...nextRowPatch,
                interesting: true,
                best_price: best.price,
                best_amount: best.amount,
                profit_each: profit,
              };
            }

            setRows(prev => {
              const copy = [...prev];
              const pos = copy.findIndex(r => r.id === it.id);
              if (pos >= 0) copy[pos] = { ...copy[pos], ...nextRowPatch };
              // pin interesting rows to the top as they appear
              if (pinInterestingFirst) {
                copy.sort((a, b) => {
                  if (a.interesting !== b.interesting) return a.interesting ? -1 : 1;
                  // within interesting: sort by profit desc
                  if (a.interesting && b.interesting) {
                    return (b.profit_each ?? 0) - (a.profit_each ?? 0);
                  }
                  // otherwise keep higher sell_price first
                  return b.sell_price - a.sell_price;
                });
              }
              return copy;
            });
          }).catch((e: unknown) => {
            if (cancelled.current) return;
            setRows(prev => {
              const copy = [...prev];
              const pos = copy.findIndex(r => r.id === it.id);
              if (pos >= 0) copy[pos] = { ...copy[pos], status: "error", error: String(e) };
              return copy;
            });
          });
        });

        await Promise.all(tasks);
        if (!cancelled.current) setStatus("done");
      } catch (e: unknown) {
        if (!cancelled.current) {
          setStatus("error");
          setError(String(e));
        }
      }
    };

    void run();

    return () => {
      cancelled.current = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, items, maxItems, minSellPrice, margin, minAmount, limitPerCall, ttlSeconds, intervalMs, pinInterestingFirst]);

  return { rows, status, error };
}
