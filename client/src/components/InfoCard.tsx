import { Box, Card, Typography } from '@mui/material'
import type { ReactNode } from 'react'
import { getFormattedText } from '../lib/textFormat'
import StatChip from './StatChip'

interface InfoCardProps {
  heading: string
  isCurrency?: boolean
  // When true, the card renders a green StatChip wrapping the price to
  // signal a profit opportunity. Callers decide the rule — typically
  // "this outlet's sell price (post-tax) exceeds the city buy price".
  isProfitable?: boolean
  // After-tax percentage applied to `value` when isCurrency && isProfitable.
  // Surfaces as "$X after N% tax" next to the primary price. See
  // PriceWithTax for the standalone site-wide pattern.
  taxType?: number
  value?: number | null
  // Optional small line beneath the primary value — e.g. "Latest scan: $612"
  // on the Market Price card to show the most recent scanned value next
  // to Torn's daily average.
  subtitle?: ReactNode
}

const InfoCard = ({
  heading,
  isCurrency,
  isProfitable = false,
  subtitle,
  taxType = 0,
  value,
}: InfoCardProps) => {
  const formatted = value != null ? getFormattedText(isCurrency ? '$' : '', value, '') : null

  return (
    <Card
      elevation={2}
      sx={{
        backgroundColor: 'background.paper',
        p: 2,
        textAlign: 'center',
      }}
    >
      <Typography gutterBottom sx={{ fontWeight: 'bold', fontSize: '1.1em' }}>
        {heading}
      </Typography>

      {value == null && (
        <Typography sx={{ fontSize: '1.4em' }}>
          <span>&mdash;</span>
        </Typography>
      )}

      {value != null && (
        <>
          {isProfitable ? (
            <Box
              sx={{
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <StatChip
                chipVariant="profit"
                label={formatted}
                size="medium"
                sx={{ fontSize: '1.2em', fontWeight: 500, px: 1 }}
              />
              {isCurrency && taxType > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {getFormattedText('$', value * (1 - taxType), '')} after{' '}
                  {Math.round(taxType * 100)}% tax
                </Typography>
              )}
            </Box>
          ) : (
            <Typography sx={{ fontSize: '1.4em', mb: 0.5 }}>{formatted}</Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </>
      )}
    </Card>
  )
}

export default InfoCard
