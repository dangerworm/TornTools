import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ScienceIcon from '@mui/icons-material/Science'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Typography,
} from '@mui/material'
import SectionHeader from './SectionHeader'
import StatChip from './StatChip'
import {
  useItemMarketAdvice,
  type ActivityLevel,
  type MarketAdvice,
  type PriceTrend,
} from '../hooks/useItemMarketAdvice'
import Loading from './Loading'

interface ItemMarketAdviceProps {
  itemId: number | undefined
  defaultExpanded?: boolean
  // Optional pre-fetched advice. When provided, the component skips its
  // own hook call so the parent can share a single fetch between this
  // component and the info cards.
  advice?: MarketAdvice
}

const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`

const trendLabel: Record<PriceTrend, string> = {
  climbing: 'Climbing',
  stable: 'Stable',
  falling: 'Falling',
  unknown: 'Unknown',
}

const activityLabel: Record<ActivityLevel, string> = {
  high: 'high',
  medium: 'moderate',
  low: 'low',
  unknown: 'unknown',
}

function buildAdviceSentence(trend: PriceTrend, activity: ActivityLevel): string | null {
  if (trend === 'unknown' || activity === 'unknown') return null

  const sentences: Record<
    Exclude<PriceTrend, 'unknown'>,
    Record<Exclude<ActivityLevel, 'unknown'>, string>
  > = {
    climbing: {
      high: "Prices are climbing in a highly active market, suggesting strong demand. Expect to pay a premium; a good time to list if you're selling.",
      medium:
        'Prices are rising with moderate activity — demand may be outpacing supply. Could be a good time to list.',
      low: 'Prices are creeping up in a quiet market, possibly a temporary shortage. Worth watching, but no particular urgency.',
    },
    stable: {
      high: 'A liquid, competitive market with stable prices — supply and demand are balanced. A fair time to buy or sell.',
      medium: 'Steady market with regular turnover. No strong signals either way.',
      low: 'A quiet market with stable prices. No pressure to act quickly.',
    },
    falling: {
      high: 'Prices are falling despite high activity, suggesting heavy supply. A good time to buy; tough to get full value when selling.',
      medium: 'Prices are softening with moderate activity. Buyers have some leverage.',
      low: 'Prices are drifting lower in a thin market. Sellers may need to be patient.',
    },
  }

  return sentences[trend][activity]
}

const ItemMarketAdvice = ({
  advice: externalAdvice,
  defaultExpanded = true,
  itemId,
}: ItemMarketAdviceProps) => {
  const internalAdvice = useItemMarketAdvice(externalAdvice ? undefined : itemId)
  const advice = externalAdvice ?? internalAdvice

  return (
    <Accordion defaultExpanded={defaultExpanded} variant="outlined" sx={{ my: 2 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SectionHeader variant="h5" hairline={false} sx={{ mb: 0, justifyContent: 'flex-start' }}>
            Market Overview
          </SectionHeader>
          <StatChip
            chipVariant="experimental"
            icon={<ScienceIcon sx={{ fontSize: '0.85rem' }} />}
            label="Experimental"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        {advice.loading && <Loading message="Analysing market data…" />}

        {!advice.loading && advice.error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {advice.error}
          </Alert>
        )}

        {!advice.loading && !advice.error && (
          <>
            <Box component="ul" sx={{ mt: 0, mb: 2, pl: 2.5 }}>
              <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                <strong>Current price:</strong>{' '}
                {advice.currentPrice !== null ? fmt(advice.currentPrice) : 'No recent data'}
                {advice.weeklyAvgPrice !== null && advice.currentPrice !== null && (
                  <> (7-day average: {fmt(advice.weeklyAvgPrice)})</>
                )}
              </Typography>

              <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                <strong>Price trend:</strong>{' '}
                {advice.priceTrend === 'unknown'
                  ? 'Not enough data to determine a trend'
                  : trendLabel[advice.priceTrend]}
              </Typography>

              <Typography component="li" variant="body1" sx={{ mb: 0.5 }}>
                <strong>Market activity:</strong>{' '}
                {advice.changesLast24h !== null ? (
                  <>
                    {advice.changesLast24h} detected change
                    {advice.changesLast24h !== 1 ? 's' : ''} in the last 24 hours
                    {advice.dailyAvgChanges7d !== null && advice.dailyAvgChanges7d > 0 && (
                      <> ({Math.round(advice.dailyAvgChanges7d)}/day over the past week)</>
                    )}
                    {' — '}
                    {activityLabel[advice.activityLevel]} activity
                  </>
                ) : (
                  'No activity data'
                )}
              </Typography>

              {advice.isSaturated && (
                <Typography component="li" variant="body1" sx={{ mb: 0.5, color: 'warning.main' }}>
                  <strong>Note:</strong> This market changed every hour we measured — actual
                  activity is likely higher than our poll rate can capture.
                </Typography>
              )}
            </Box>

            {buildAdviceSentence(advice.priceTrend, advice.activityLevel) && (
              <Alert severity="info" sx={{ mb: 2 }}>
                {buildAdviceSentence(advice.priceTrend, advice.activityLevel)}
              </Alert>
            )}

            <Alert severity="warning" icon={<ScienceIcon fontSize="inherit" />}>
              <Typography variant="caption">
                <strong>Experimental feature.</strong> This analysis only covers the cheapest item
                market listings visible to our scanner (up to 50 at a time). It does not account for
                bazaar supply, trades at higher price points, or activity between polls. Treat it as
                a rough directional signal, not a precise measurement.
              </Typography>
            </Alert>
          </>
        )}
      </AccordionDetails>
    </Accordion>
  )
}

export default ItemMarketAdvice
