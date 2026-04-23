import { Box, Grid, Typography } from '@mui/material'
import { isItemProfitableInBazaar, isItemProfitableOnMarket, type Item } from '../types/items'

import type { MarketAdvice } from '../hooks/useItemMarketAdvice'
import { SALE_TAX } from '../lib/profitCalculations'
import { getFormattedText } from '../lib/textFormat'
import type { Weav3rMarketplaceListing } from '../types/weav3r'
import InfoCard from './InfoCard'

interface ItemDetailsInfoCardsProps {
  item: Item
  inlineView?: boolean
  firstBazaarListing?: Weav3rMarketplaceListing
  advice?: MarketAdvice
}

// Produces a human "3 mins ago" style relative label for an ISO timestamp.
const formatRelative = (iso: string): string => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

// Profit chip rules (kept here so the legend below matches what the
// code actually does):
//   • City Buy / City Sell — static catalogue data; no chip.
//   • Bazaar Price (latest Weav3r listing) — green when listing.price >
//     valueBuyPrice. The bazaar has no outlet tax.
//   • Market Price (Torn's daily average) — green when
//     valueMarketPrice * (1 - SALE_TAX.market) > valueBuyPrice, i.e.
//     you net a profit after the 5% market fee.

const ItemDetailsInfoCards = ({
  advice,
  firstBazaarListing,
  inlineView = false,
  item,
}: ItemDetailsInfoCardsProps) => {
  const bazaarDataAvailable = firstBazaarListing !== undefined

  const latestMarketSubtitle =
    advice && advice.currentPrice != null ? (
      <>
        Latest scan: {getFormattedText('$', advice.currentPrice, '')}
        {advice.currentPriceTimestamp ? ` · ${formatRelative(advice.currentPriceTimestamp)}` : ''}
      </>
    ) : null

  const bazaarSubtitle =
    firstBazaarListing && firstBazaarListing.last_checked_relative
      ? `Latest scan: ${firstBazaarListing.last_checked_relative}`
      : null

  return (
    <Box sx={{ mt: inlineView ? 2 : 0 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: bazaarDataAvailable ? 3 : 4 }}>
          <InfoCard heading="City Buy Price" isCurrency={true} value={item?.valueBuyPrice} />
        </Grid>

        <Grid size={{ xs: 6, md: bazaarDataAvailable ? 3 : 4 }}>
          <InfoCard heading="City Sell Price" isCurrency={true} value={item?.valueSellPrice} />
        </Grid>

        {bazaarDataAvailable && (
          <Grid size={{ xs: 6, md: 3 }}>
            <InfoCard
              heading="Bazaar Price"
              isCurrency={true}
              isProfitable={isItemProfitableInBazaar(item, firstBazaarListing!)}
              subtitle={bazaarSubtitle}
              value={firstBazaarListing!.price}
            />
          </Grid>
        )}

        <Grid size={{ xs: 6, md: bazaarDataAvailable ? 3 : 4 }}>
          <InfoCard
            heading="Market Price (avg)"
            isCurrency={true}
            isProfitable={isItemProfitableOnMarket(item, 'market')}
            taxType={SALE_TAX['market']}
            subtitle={latestMarketSubtitle}
            value={item?.valueMarketPrice}
          />
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        Green chip = selling at this outlet (after tax) pays more than the City Buy Price — a profit
        opportunity. City Buy/Sell are catalogue values and never show a chip.
      </Typography>
    </Box>
  )
}

export default ItemDetailsInfoCards
