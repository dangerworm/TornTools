import { Grid } from '@mui/material'
import { isItemProfitableInBazaar, isItemProfitableOnMarket, type Item } from '../types/items'

import InfoCard from './InfoCard'
import type { Weav3rMarketplaceListing } from '../types/weav3r'

interface ItemDetailsInfoCardsProps {
  item: Item,
  inlineView?: boolean
  firstBazaarListing?: Weav3rMarketplaceListing
}

const ItemDetailsInfoCards = ({ item, inlineView = false, firstBazaarListing }: ItemDetailsInfoCardsProps) => {
  const bazaarDataAvailable = firstBazaarListing !== undefined

  return (
    <Grid container spacing={2} sx={{ mt: inlineView ? 2 : 0 }}>
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
            value={firstBazaarListing!.price}
          />
        </Grid>
      )}

      <Grid size={{ xs: 6, md: bazaarDataAvailable ? 3 : 4 }}>
        <InfoCard
          heading="Market Price"
          isCurrency={true}
          isProfitable={isItemProfitableOnMarket(item)}
          value={item?.valueMarketPrice}
        />
      </Grid>
    </Grid>
  )
}

export default ItemDetailsInfoCards
