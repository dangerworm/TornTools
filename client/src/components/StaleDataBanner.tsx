import { Alert, AlertTitle, Collapse, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useEffect, useMemo, useState } from 'react'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'

// Minutes past which we consider the scan pipeline unhealthy. Picked to
// be generous relative to the default 5-minute BazaarSummaries TTL; a
// genuinely fresh pipeline should always have at least one item within
// 10 minutes of now.
const STALE_THRESHOLD_MINUTES = 15

interface StaleDataBannerProps {
  // How fresh the data should be. Defaults to 15 minutes.
  thresholdMinutes?: number
  // Supplemental hint for the surface the banner appears on (e.g. "market
  // prices" or "bazaar listings"). Kept short — MUI AlertTitle style.
  surface?: string
}

const formatRelative = (ms: number): string => {
  const mins = Math.floor(ms / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? '' : 's'} ago`
  return `${Math.floor(hrs / 24)} day${hrs < 48 ? '' : 's'} ago`
}

// Shows a dismissible warning when the backend scan pipeline hasn't
// produced a recent bazaar summary — a reasonable proxy for "the scan
// jobs aren't running". Uses the newest lastUpdated across all summary
// rows so a single fresh item keeps the banner hidden.
const StaleDataBanner = ({
  thresholdMinutes = STALE_THRESHOLD_MINUTES,
  surface,
}: StaleDataBannerProps) => {
  const { summaries, loading } = useBazaarSummaries()
  const [dismissed, setDismissed] = useState(false)
  // Re-evaluate staleness every minute without re-fetching — the newest
  // timestamp drifts further from "now" the longer the pipeline is down.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const newestAt = useMemo(() => {
    let latest = 0
    for (const key in summaries) {
      const ts = new Date(summaries[key].lastUpdated).getTime()
      if (ts > latest) latest = ts
    }
    return latest || null
  }, [summaries])

  if (loading && !newestAt) return null
  if (!newestAt) return null

  const ageMs = now - newestAt
  const stale = ageMs > thresholdMinutes * 60_000

  return (
    <Collapse in={stale && !dismissed}>
      <Alert
        severity="warning"
        sx={{ mb: 2 }}
        action={
          <IconButton
            aria-label="dismiss"
            color="inherit"
            size="small"
            onClick={() => setDismissed(true)}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <AlertTitle>Data may be stale</AlertTitle>
        <Typography variant="body2">
          The most recent {surface ?? 'scan'} landed {formatRelative(ageMs)}. The backend scan jobs
          may be lagging or down; values shown here could be out of date.
        </Typography>
      </Alert>
    </Collapse>
  )
}

export default StaleDataBanner
