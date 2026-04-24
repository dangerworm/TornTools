import { Box, Fade } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import type { HistorySource } from '../lib/dotnetapi'
import PriceSparkline from './PriceSparkline'

interface LazySparklineProps {
  itemId: number | undefined
  width?: number
  height?: number
  source?: HistorySource
}

// Renders PriceSparkline only once the row scrolls into view, so the
// Favourites table doesn't kick off N price-history fetches on mount.
// Fades in over ~2s after the history resolves, per Drew's request.
const LazySparkline = ({
  itemId,
  width = 90,
  height = 28,
  source = 'Torn',
}: LazySparklineProps) => {
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
    <Box
      ref={ref}
      sx={{
        alignItems: 'center',
        display: 'flex',
        height,
        justifyContent: 'center',
        width,
      }}
    >
      <Fade in={inView} timeout={2000}>
        <Box sx={{ display: 'flex' }}>
          {inView ? (
            <PriceSparkline itemId={itemId} width={width} height={height} source={source} />
          ) : null}
        </Box>
      </Fade>
    </Box>
  )
}

export default LazySparkline
