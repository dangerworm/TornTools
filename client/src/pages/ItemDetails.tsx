import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Grid,
  Typography,
  useTheme,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import Chart, { type ChartSeries } from '../components/Chart'
import ItemDetailsArmourStats from '../components/ItemDetailsArmourStats'
import ItemDetailsDescription from '../components/ItemDetailsDescription'
import ItemDetailsHeader from '../components/ItemDetailsHeader'
import ItemDetailsInfoCards from '../components/ItemDetailsInfoCards'
import ItemDetailsWeaponStats from '../components/ItemDetailsWeaponStats'
import ItemMarketAdvice from '../components/ItemMarketAdvice'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import Weav3rMarketTable from '../components/Weav3rListingTable'
import { useItemMarketAdvice } from '../hooks/useItemMarketAdvice'
import { useItemPriceHistory, useItemVelocityHistory } from '../hooks/useItemHistory'
import { useItems } from '../hooks/useItems'
import { useWeav3rMarketplaceQuery } from '../hooks/useWeav3rListings'
import type { HistoryWindow } from '../types/history'
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

  const [priceWindow, setPriceWindow] = useState<HistoryWindow>('1w')
  const [velocityWindow, setVelocityWindow] = useState<HistoryWindow>('1w')

  const { data } = useWeav3rMarketplaceQuery(itemId)
  const advice = useItemMarketAdvice(itemId)

  // Two price series: Torn market + Weav3r bazaar, overlaid on the same axes.
  const priceTorn = useItemPriceHistory(itemId, priceWindow, 'Torn')
  const priceBazaar = useItemPriceHistory(itemId, priceWindow, 'Weav3r')

  // Velocity is market-only — bazaar velocity is dominated by idle
  // re-scans rather than actual listing changes.
  const velocity = useItemVelocityHistory(itemId, velocityWindow, 'Torn')

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

  const priceSeries: ChartSeries[] = useMemo(
    () => [
      { name: 'Market', color: theme.palette.primary.main, data: priceTorn.data },
      {
        name: 'Bazaar',
        color: theme.palette.info?.main ?? '#6ab0de',
        data: priceBazaar.data,
      },
    ],
    [priceTorn.data, priceBazaar.data, theme],
  )

  const velocitySeries: ChartSeries[] = useMemo(
    () => [{ name: 'Changes', color: theme.palette.secondary.main, data: velocity.data }],
    [velocity.data, theme],
  )

  if (!itemsById || !item) return <Loading message="Loading items..." />

  return (
    <Box>
      {!inlineView && (
        <>
          <ItemDetailsHeader item={item} inlineView={inlineView} />

          {item.type === 'Weapon' && <ItemDetailsWeaponStats item={item} />}
          {item.type === 'Armor' && <ItemDetailsArmourStats item={item} />}

          <ItemDetailsDescription item={item} />
        </>
      )}

      <ItemDetailsInfoCards
        item={item}
        inlineView={inlineView}
        firstBazaarListing={bazaarDataAvailable ? data.listings[0] : undefined}
        advice={advice}
      />

      <ItemMarketAdvice itemId={itemId} defaultExpanded={!inlineView} advice={advice} />

      <Accordion defaultExpanded={!inlineView} variant="outlined" sx={{ my: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SectionHeader variant="h5" hairline={false} sx={{ mb: 0 }}>
            Historical Data
          </SectionHeader>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="h6" sx={{ mt: -1 }}>
                Prices Over Time
              </Typography>

              <Chart
                chartType="area"
                series={priceSeries}
                loading={priceTorn.loading || priceBazaar.loading}
                error={priceTorn.error ?? priceBazaar.error}
                timeWindow={priceWindow}
                onTimeWindowChange={setPriceWindow}
                valueLabel="Price"
                valuePrefix="$"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }} sx={{ mt: { xs: 4, sm: 0 } }}>
              <Typography variant="h6" sx={{ mt: -1 }}>
                Changes Over Time
              </Typography>

              <Chart
                chartType="bar"
                series={velocitySeries}
                loading={velocity.loading}
                error={velocity.error}
                timeWindow={velocityWindow}
                onTimeWindowChange={setVelocityWindow}
                valueLabel="Changes"
                yAxisLabel="Number of changes"
              />
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      <Accordion defaultExpanded={!inlineView} variant="outlined" sx={{ my: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <SectionHeader variant="h5" hairline={false} sx={{ mb: 0 }}>
            Bazaar Listings
          </SectionHeader>
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
