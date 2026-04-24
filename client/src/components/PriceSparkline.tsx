import { useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import { useItemPriceHistory } from '../hooks/useItemHistory'
import type { HistorySource } from '../lib/dotnetapi'
import type { ItemHistoryPoint } from '../types/history'

interface PriceSparklineProps {
  itemId: number | undefined
  width?: number
  height?: number
  source?: HistorySource
}

function buildPolylinePoints(data: ItemHistoryPoint[], width: number, height: number): string {
  const values = data.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pad = 2
  return data
    .map((p, i) => {
      const x = pad + (i / (data.length - 1)) * (width - 2 * pad)
      const y = height - pad - ((p.value - min) / range) * (height - 2 * pad)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function PriceSparkline({
  itemId,
  width = 80,
  height = 28,
  source = 'Torn',
}: PriceSparklineProps) {
  const { data, loading } = useItemPriceHistory(itemId, '1w', source)

  const { points, strokeColor } = useMemo(() => {
    if (data.length < 2) return { points: '', strokeColor: '' }
    const first = data[0].value
    const last = data[data.length - 1].value
    const color = last > first ? '#4caf50' : last < first ? '#f44336' : '#9e9e9e'
    return { points: buildPolylinePoints(data, width, height), strokeColor: color }
  }, [data, width, height])

  if (loading) return <Box sx={{ width, height }} />

  if (data.length < 2) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        —
      </Typography>
    )
  }

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
