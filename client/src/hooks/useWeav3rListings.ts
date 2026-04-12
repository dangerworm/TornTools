import { fetchMarketplace } from "../lib/weav3rapi";
import { postWeav3rListings } from "../lib/dotnetapi";
import type { Weav3rMarketplacePayload } from "../types/weav3r";
import { useState, useCallback, useEffect } from "react";

interface Weav3rMarketplaceState {
  data: Weav3rMarketplacePayload | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const getErrorMessage = (error: unknown) => {
  if (!error) return null;
  return error instanceof Error ? error.message : "Failed to load history";
};

const useMarketplaceQuery = (
  itemId: number | undefined,
): Weav3rMarketplaceState => {
  const [data, setData] = useState<Weav3rMarketplacePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!itemId) {
      setData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchMarketplace(itemId);
      setData(result);

      if (result?.listings?.length) {
        postWeav3rListings(
          itemId,
          result.listings.map((l) => ({
            playerId: l.player_id,
            quantity: l.quantity,
            price: l.price,
          })),
        ).catch(() => { /* silent — don't affect UX if relay fails */ })
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError(getErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
};

export const useWeav3rMarketplaceQuery = (
  itemId: number | undefined,
) => useMarketplaceQuery(itemId);