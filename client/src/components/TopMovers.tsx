import { Box, Card, CardContent, Grid, Link, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useItems } from '../hooks/useItems'
import { useItemVolatility } from '../hooks/useItemVolatility'
import { useUnusualItems } from '../hooks/useUnusualItems'
import type { ItemVolatilityStats, UnusualItem } from '../lib/dotnetapi'
import { getFormattedText } from '../lib/textFormat'
import Loading from './Loading'

interface TopMoversProps {
  limit?: number
}

const formatPercent = (fraction: number | null): string => {
  if (fraction == null) return '—'
  const pct = fraction * 100
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

const directionColor = (direction: 'up' | 'down' | null | undefined): string => {
  if (direction === 'up') return '#7bc57f'
  if (direction === 'down') return '#e88b7c'
  return 'text.secondary'
}

// Pick the price to display for an Unusual row: prefer the dominant
// horizon's window price (so the user sees the value the row was
// flagged for), fall back through the others, then the baseline.
const pickUnusualDisplayPrice = (row: UnusualItem): number | null => {
  switch (row.dominantHorizon) {
    case '1h':
      return row.windowPrice1h ?? row.windowPrice6h ?? row.windowPrice24h ?? row.baselinePrice
    case '6h':
      return row.windowPrice6h ?? row.windowPrice24h ?? row.baselinePrice
    case '24h':
      return row.windowPrice24h ?? row.windowPrice7d ?? row.baselinePrice
    case '7d':
      return row.windowPrice7d ?? row.windowPrice24h ?? row.baselinePrice
    default:
      return row.windowPrice24h ?? row.baselinePrice
  }
}

// Home-page widget: three cards from the pre-computed stats tables.
//   Risers  = highest positive z-scored move (window median vs 30d
//             trimmed baseline, scaled by per-item dispersion). Sign-
//             gated and floored on |move| >= 10% AND |z| >= 1.5 in
//             the API layer.
//   Fallers = mirror image (negative).
//   Unusual = max |z| across (1h / 6h / 24h / 7d) horizons against the
//             same baseline. Catches both fast spikes and slow drifts;
//             complements the rise/fall framing for items the polling
//             ceiling can't otherwise rank reliably.
const TopMovers = ({ limit = 5 }: TopMoversProps) => {
  const { itemsById } = useItems()

  const risers = useItemVolatility({
    source: 'Torn',
    sort: 'move_z_score_1d',
    limit,
  })
  const fallers = useItemVolatility({
    source: 'Torn',
    sort: 'move_z_score_1d',
    limit,
    ascending: true,
  })
  const unusual = useUnusualItems({
    source: 'Torn',
    limit,
  })

  const sections = [
    { title: 'Top risers (24h)', kind: 'volatility' as const, ...risers },
    { title: 'Top fallers (24h)', kind: 'volatility' as const, ...fallers },
    { title: 'Unusual activity', kind: 'unusual' as const, ...unusual },
  ]

  const noData = sections.every((s) => !s.loading && s.data.length === 0)
  if (noData) return null

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {sections.map((section) => (
        <Grid key={section.title} size={{ xs: 12, md: 4 }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'primary.main', mb: 1.5 }}>
                {section.title}
              </Typography>
              {section.loading && section.data.length === 0 && <Loading message="Loading…" />}
              {!section.loading && section.data.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No data yet — the rebuild job hasn't run, or the change-log summaries are still
                  catching up.
                </Typography>
              )}
              <Stack spacing={1}>
                {section.kind === 'volatility'
                  ? (section.data as ItemVolatilityStats[]).map((row) => (
                      <VolatilityRow key={row.itemId} row={row} itemsById={itemsById} />
                    ))
                  : (section.data as UnusualItem[]).map((row) => (
                      <UnusualRow key={row.itemId} row={row} itemsById={itemsById} />
                    ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

interface RowProps<T> {
  row: T
  itemsById: ReturnType<typeof useItems>['itemsById']
}

const VolatilityRow = ({ row, itemsById }: RowProps<ItemVolatilityStats>) => {
  const item = itemsById[row.itemId]
  const name = item?.name ?? `Item ${row.itemId}`
  const movePct = row.movePctWindow ?? row.priceChange1d
  const displayPrice = row.windowPrice ?? row.currentPrice
  const direction = movePct == null ? null : movePct > 0 ? 'up' : movePct < 0 ? 'down' : null
  return (
    <RowLayout name={name} itemId={row.itemId}>
      <Typography
        variant="body2"
        sx={{
          color: directionColor(direction),
          fontWeight: 500,
          whiteSpace: 'nowrap',
        }}
      >
        {formatPercent(movePct)}
        {displayPrice != null && (
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary', ml: 0.75 }}
          >
            {getFormattedText('$', displayPrice, '')}
          </Typography>
        )}
      </Typography>
    </RowLayout>
  )
}

const UnusualRow = ({ row, itemsById }: RowProps<UnusualItem>) => {
  const item = itemsById[row.itemId]
  const name = item?.name ?? `Item ${row.itemId}`
  const displayPrice = pickUnusualDisplayPrice(row)
  return (
    <RowLayout name={name} itemId={row.itemId}>
      <Typography
        variant="body2"
        sx={{
          color: directionColor(row.direction),
          fontWeight: 500,
          whiteSpace: 'nowrap',
          textAlign: 'right',
        }}
      >
        {row.whyFlagged ?? '—'}
        {displayPrice != null && (
          <Typography
            component="span"
            variant="caption"
            sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}
          >
            {getFormattedText('$', displayPrice, '')}
          </Typography>
        )}
      </Typography>
    </RowLayout>
  )
}

interface RowLayoutProps {
  name: string
  itemId: number
  children: React.ReactNode
}

const RowLayout = ({ name, itemId, children }: RowLayoutProps) => (
  <Box
    sx={{
      alignItems: 'center',
      display: 'flex',
      gap: 1,
      justifyContent: 'space-between',
    }}
  >
    <Link
      component={RouterLink}
      to={`/item/${itemId}`}
      sx={{
        color: 'text.primary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {name}
    </Link>
    {children}
  </Box>
)

export default TopMovers
