import { Box, Fade, Tooltip, Typography } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useItemPriceHistory } from '../hooks/useItemHistory'
import { getFormattedText } from '../lib/textFormat'

interface LazyLatestMarketPriceProps {
  itemId: number | undefined
}

const formatRelative = (ms: number): string => {
  if (Number.isNaN(ms)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

// Inner component — only mounts when the row is near the viewport, to
// avoid kicking off N price-history fetches for every favourite up front.
const LatestMarketPriceInner = ({ itemId }: { itemId: number | undefined }) => {
  const { data, loading } = useItemPriceHistory(itemId, '1d')
  const latest = useMemo(() => {
    if (!data.length) return null
    return data.reduce((acc, p) => (p.timestamp > acc.timestamp ? p : acc), data[0])
  }, [data])

  if (loading && !latest) {
    return null
  }

  if (!latest) {
    return (
      <Typography variant="body2" color="text.disabled">
        &mdash;
      </Typography>
    )
  }

  return (
    <Tooltip title={`Latest scan: ${formatRelative(latest.timestamp)}`} placement="left">
      <span>{getFormattedText('$', latest.value, '')}</span>
    </Tooltip>
  )
}

const LazyLatestMarketPrice = ({ itemId }: LazyLatestMarketPriceProps) => {
  const ref = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (inView || !ref.current) return
    const el = ref.current
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView])

  return (
    <Box ref={ref} sx={{ display: 'inline-block', minWidth: 60 }}>
      <Fade in={inView} timeout={2000}>
        <Box sx={{ display: 'inline-block' }}>
          {inView ? <LatestMarketPriceInner itemId={itemId} /> : null}
        </Box>
      </Fade>
    </Box>
  )
}

export default LazyLatestMarketPrice
