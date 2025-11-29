import { useEffect, useRef, useState } from "react";
import { collectAndSubmitBazaarListings, hasBrowserBazaarSource } from "../lib/bazaarCollector";

interface Options {
  intervalMs?: number;
}

export function useBazaarCollector(enabled: boolean, opts?: Options) {
  const { intervalMs = 60_000 } = opts || {};
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    if (!enabled || !hasBrowserBazaarSource()) {
      return undefined;
    }

    const tick = async () => {
      if (isRunningRef.current) return;
      isRunningRef.current = true;

      try {
        const processedCount = await collectAndSubmitBazaarListings();
        if (processedCount > 0) {
          setLastSync(new Date());
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        isRunningRef.current = false;
      }
    };

    timerRef.current = window.setInterval(tick, intervalMs);
    void tick();

    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, intervalMs]);

  return { lastSync, error, hasEndpoint: hasBrowserBazaarSource() };
}
