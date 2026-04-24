import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Link,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { useItems } from '../hooks/useItems'
import { useItemVolatility } from '../hooks/useItemVolatility'
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

const percentColor = (fraction: number | null): string => {
  if (fraction == null) return 'text.secondary'
  if (fraction > 0) return '#7bc57f'
  if (fraction < 0) return '#e88b7c'
  return 'text.secondary'
}

// Home-page widget: three columns of top movers from the pre-computed
// volatility stats table.
//   Active  = raw change count (changes_1d) — still the cheapest "this
//             item is trading right now" signal; the polling-ceiling
//             saturation is tracked as a follow-up in the Top Movers
//             review.
//   Risers  = highest positive z-scored move (window median vs 30d
//             baseline, scaled by per-item dispersion). Filtered to
//             |move| >= 10% AND |z| >= 1.0 in the API layer so low-
//             dispersion tiny moves don't flood the list.
//   Fallers = same, ascending.
const TopMovers = ({ limit = 5 }: TopMoversProps) => {
  const { itemsById } = useItems()

  const active = useItemVolatility({
    source: 'Torn',
    sort: 'changes_1d',
    limit,
  })
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

  const sections = [
    { title: 'Most active (24h)', ...active, showChanges: true },
    { title: 'Top risers (24h)', ...risers, showChanges: false },
    { title: 'Top fallers (24h)', ...fallers, showChanges: false },
  ] as const

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
                  No data yet — the volatility job hasn't run, or the change-log summaries are
                  still catching up.
                </Typography>
              )}
              <Stack spacing={1}>
                {section.data.map((row) => {
                  const item = itemsById[row.itemId]
                  const name = item?.name ?? `Item ${row.itemId}`
                  // Prefer the new window-median fields; fall back to the
                  // legacy single-bucket fields for items ranked before
                  // the redesign shipped (e.g. the Most active card,
                  // which doesn't require a completed window baseline).
                  const movePct = row.movePctWindow ?? row.priceChange1d
                  const displayPrice = row.windowPrice ?? row.currentPrice
                  return (
                    <Box
                      key={row.itemId}
                      sx={{
                        alignItems: 'center',
                        display: 'flex',
                        gap: 1,
                        justifyContent: 'space-between',
                      }}
                    >
                      <Link
                        component={RouterLink}
                        to={`/item/${row.itemId}`}
                        sx={{
                          color: 'text.primary',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </Link>
                      {section.showChanges ? (
                        <Chip
                          label={`${row.changes1d} chg`}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(200, 150, 12, 0.15)',
                            color: '#d4a24a',
                          }}
                        />
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            color: percentColor(movePct),
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
                      )}
                    </Box>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}

export default TopMovers
