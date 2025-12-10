import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography,
  useTheme,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Loading from '../components/Loading'
import { useItemPriceHistory, useItemVelocityHistory } from '../hooks/useItemHistory'
import { useItems } from '../hooks/useItems'
import { useWeav3rMarketplaceQuery } from '../hooks/useWeav3rListings'
import Chart from '../components/Chart'
import ItemDetailsHeader from '../components/ItemDetailsHeader'
import ItemDetailsWeaponStats from '../components/ItemDetailsWeaponStats'
import ItemDetailsDescription from '../components/ItemDetailsDescription'
import ItemDetailsInfoCards from '../components/ItemDetailsInfoCards'
import Weav3rMarketTable from '../components/Weav3rListingTable'
import { type Item } from '../types/items'

interface ItemDetailsProps {
  inputItem?: Item
  inlineView?: boolean
}

const ItemDetails = ({ inputItem, inlineView = false }: ItemDetailsProps) => {
  const { itemsById } = useItems()
  const { itemId: urlItemId } = useParams<{ itemId: string }>()
  const theme = useTheme()

  const [item, setItem] = useState<Item | null>(null)
  const [itemId, setItemId] = useState<number | undefined>(
    inputItem ? inputItem.id : urlItemId ? parseInt(urlItemId, 10) : undefined,
  )

  const { data } = useWeav3rMarketplaceQuery(itemId)

  const bazaarDataAvailable = data?.listings && data.listings.length > 0 && data.listings[0]

  useEffect(() => {
    if (urlItemId) {
      const parsedId = parseInt(urlItemId, 10)
      setItemId((prev) => (prev !== parsedId ? parsedId : prev))
    }
  }, [urlItemId, itemId])

  useEffect(() => {
    if (inputItem?.id) {
      setItemId((prev) => (prev !== inputItem.id ? inputItem.id : prev))
    }
  }, [inputItem, itemId])

  useEffect(() => {
    if (itemId && itemsById[itemId]) {
      setItem(itemsById[itemId])
    }
  }, [itemId, itemsById])

  if (!itemsById || !item) return <Loading message="Loading items..." />

  return (
    <Box>
      <ItemDetailsHeader item={item} inlineView={inlineView} />
      <ItemDetailsWeaponStats item={item} />
      <ItemDetailsDescription item={item} />

      <ItemDetailsInfoCards
        item={item}
        firstBazaarListing={bazaarDataAvailable ? data.listings[0] : undefined}
      />

      <Accordion defaultExpanded={!inlineView} variant="outlined" sx={{ my: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Historical Data</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" sx={{ mt: -1 }}>
                Prices Over Time
              </Typography>

              <Chart
                chartType="area"
                dataColour={theme.palette.primary.main}
                dataFunction={useItemPriceHistory}
                itemId={itemId}
                valueLabel="Price"
                valuePrefix="$"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" sx={{ mt: -1 }}>
                Changes Over Time
              </Typography>

              <Chart
                chartType="bar"
                dataColour={theme.palette.secondary.main}
                dataFunction={useItemVelocityHistory}
                itemId={itemId}
                valueLabel="Changes"
                yAxisLabel="Number of changes"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={!inlineView} variant="outlined" sx={{ my: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">Bazaar Listings</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {!data ? (
            <Loading message="Loading bazaar listings..." />
          ) : (
            <Weav3rMarketTable payload={data} />
          )}
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default ItemDetails
