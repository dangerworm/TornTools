import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchItemPriceHistory, fetchItemVelocityHistory } from '../lib/dotnetapi'

export type PriceTrend = 'climbing' | 'stable' | 'falling' | 'unknown'
export type ActivityLevel = 'high' | 'medium' | 'low' | 'unknown'

export interface MarketAdvice {
  priceTrend: PriceTrend
  activityLevel: ActivityLevel
  isSaturated: boolean
  currentPrice: number | null
  // ISO timestamp of the last scan that produced a non-zero price point
  // in the 1d window. Callers use this to show "x mins ago" next to
  // currentPrice when surfacing the latest market scan.
  currentPriceTimestamp: string | null
  weeklyAvgPrice: number | null
  changesLast24h: number | null
  dailyAvgChanges7d: number | null
  loading: boolean
  error: string | null
}

const TREND_THRESHOLD = 0.05
const HIGH_ACTIVITY_THRESHOLD = 30
const LOW_ACTIVITY_THRESHOLD = 5
const SATURATION_AVG_PER_HOUR = 2
const SATURATION_MIN_BUCKETS = 20

export function useItemMarketAdvice(itemId: number | undefined): MarketAdvice {
  const [state, setState] = useState<MarketAdvice>({
    priceTrend: 'unknown',
    activityLevel: 'unknown',
    isSaturated: false,
    currentPrice: null,
    currentPriceTimestamp: null,
    weeklyAvgPrice: null,
    changesLast24h: null,
    dailyAvgChanges7d: null,
    loading: false,
    error: null,
  })

  const generationRef = useRef(0)

  const load = useCallback(async () => {
    if (!itemId) return
    const generation = ++generationRef.current
    setState((prev) => ({ ...prev, loading: true, error: null }))

    try {
      const [price1d, price1w, velocity1d, velocity1w] = await Promise.all([
        fetchItemPriceHistory(itemId, '1d'),
        fetchItemPriceHistory(itemId, '1w'),
        fetchItemVelocityHistory(itemId, '1d'),
        fetchItemVelocityHistory(itemId, '1w'),
      ])

      const pricePoints1d = price1d.filter((p) => (p.price ?? 0) > 0)
      const latestPricePoint =
        pricePoints1d.length > 0 ? pricePoints1d[pricePoints1d.length - 1] : null
      const currentPrice = latestPricePoint?.price ?? null
      const currentPriceTimestamp = latestPricePoint?.timestamp ?? null

      const pricePoints1w = price1w.filter((p) => (p.price ?? 0) > 0)
      const weeklyAvgPrice =
        pricePoints1w.length > 0
          ? pricePoints1w.reduce((sum, p) => sum + p.price!, 0) / pricePoints1w.length
          : null

      const changesLast24h = velocity1d.reduce((sum, p) => sum + (p.velocity ?? 0), 0)
      const totalChanges7d = velocity1w.reduce((sum, p) => sum + (p.velocity ?? 0), 0)
      const dailyAvgChanges7d = totalChanges7d / 7

      const nonZeroBuckets = velocity1d.filter((p) => (p.velocity ?? 0) > 0).length
      const totalBuckets = velocity1d.length
      const avgChangesPerHour = changesLast24h / Math.max(totalBuckets, 1)
      const isSaturated =
        nonZeroBuckets === totalBuckets &&
        totalBuckets >= SATURATION_MIN_BUCKETS &&
        avgChangesPerHour >= SATURATION_AVG_PER_HOUR

      let priceTrend: PriceTrend = 'unknown'
      const referencePrice =
        weeklyAvgPrice ?? (pricePoints1d.length >= 4 ? pricePoints1d[0].price! : null)
      if (currentPrice !== null && referencePrice !== null && referencePrice > 0) {
        const ratio = currentPrice / referencePrice
        if (ratio > 1 + TREND_THRESHOLD) priceTrend = 'climbing'
        else if (ratio < 1 - TREND_THRESHOLD) priceTrend = 'falling'
        else priceTrend = 'stable'
      }

      let activityLevel: ActivityLevel = 'unknown'
      if (changesLast24h >= HIGH_ACTIVITY_THRESHOLD) activityLevel = 'high'
      else if (changesLast24h >= LOW_ACTIVITY_THRESHOLD) activityLevel = 'medium'
      else if (totalBuckets > 0) activityLevel = 'low'

      if (generationRef.current !== generation) return
      setState({
        priceTrend,
        activityLevel,
        isSaturated,
        currentPrice,
        currentPriceTimestamp,
        weeklyAvgPrice,
        changesLast24h,
        dailyAvgChanges7d,
        loading: false,
        error: null,
      })
    } catch (e) {
      if (generationRef.current !== generation) return
      setState((prev) => ({
        ...prev,
        loading: false,
        error: e instanceof Error ? e.message : 'Failed to load market overview',
      }))
    }
  }, [itemId])

  useEffect(() => {
    void load()
  }, [load])

  return state
}
