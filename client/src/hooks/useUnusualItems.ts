import { useCallback, useEffect, useState } from 'react'
import { fetchUnusualItems, type UnusualItem } from '../lib/dotnetapi'

interface Params {
  source?: 'Torn' | 'Weav3r'
  limit?: number
  minScore?: number
}

export interface UseUnusualItemsResult {
  data: UnusualItem[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

// Thin wrapper around /api/items/unusual. Returns items ranked by their
// max |z-score| across (1h / 6h / 24h / 7d) horizons against a 30-day
// baseline. The widget displays one row per item with the server's
// pre-formatted "why flagged" string.
export function useUnusualItems(params: Params): UseUnusualItemsResult {
  const [data, setData] = useState<UnusualItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchUnusualItems(params)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load unusual items')
    } finally {
      setLoading(false)
    }
    // params is value-stable; the caller passes a stable shape.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.source, params.limit, params.minScore])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refresh: load }
}
