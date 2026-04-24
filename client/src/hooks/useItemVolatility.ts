import { useCallback, useEffect, useState } from 'react'
import {
  fetchTopVolatileItems,
  type ItemVolatilityStats,
  type VolatilitySortKey,
} from '../lib/dotnetapi'

interface Params {
  source?: 'Torn' | 'Weav3r'
  sort?: VolatilitySortKey
  limit?: number
  ascending?: boolean
}

export interface UseItemVolatilityResult {
  data: ItemVolatilityStats[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Thin wrapper around the /items/volatility endpoint. Parent components
// decide which "flavour" of top movers they want — most active, biggest
// risers, biggest fallers — by varying (sort, ascending).
export function useItemVolatility(params: Params): UseItemVolatilityResult {
  const [data, setData] = useState<ItemVolatilityStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchTopVolatileItems(params)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load volatility stats')
    } finally {
      setLoading(false)
    }
    // params is a value-stable dependency — the caller passes a stable shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.source, params.sort, params.limit, params.ascending])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refresh: load }
}
