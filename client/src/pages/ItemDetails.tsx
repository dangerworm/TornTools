import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Box, Chip, Grid, List, ListItem, Typography, useTheme } from '@mui/material'
import Favorite from '@mui/icons-material/Favorite'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import Loading from '../components/Loading'
import { useItemPriceHistory, useItemVelocityHistory } from '../hooks/useItemHistory'
import { useItems } from '../hooks/useItems'
import { isItemProfitableInBazaar, isItemProfitableOnMarket, type Item } from '../types/items'
import { useUser } from '../hooks/useUser'

import InfoCard from '../components/InfoCard'
import Chart from '../components/Chart'
import { useWeav3rMarketplaceQuery } from '../hooks/useWeav3rListings'
import Weav3rMarketTable from '../components/Weav3rListingTable'
import { getFormattedText } from '../lib/textFormat'

interface ItemDetailsProps {
  inputItem?: Item
  inlineView?: boolean
}

const ItemDetails = ({ inputItem, inlineView = false }: ItemDetailsProps) => {
  const { itemsById } = useItems()
  const { itemId: urlItemId } = useParams<{ itemId: string }>()
  const theme = useTheme()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const [item, setItem] = useState<Item | null>(null)
  const [itemId, setItemId] = useState<number | undefined>(
    inputItem ? inputItem.id : urlItemId ? parseInt(urlItemId, 10) : undefined,
  )

  const { data } = useWeav3rMarketplaceQuery(itemId)

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
      <Grid container spacing={2} sx={{ mb: 2, mt: inlineView ? 2 : 0 }}>
        {!inlineView && (
          <>
            <Grid sx={{ width: 80 }}>
              <img
                alt=""
                src={`https://www.torn.com/images/items/${item!.id}/large.png`}
                style={{ borderRadius: 4 }}
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                }}
              />
            </Grid>
            <Grid sx={{ flexGrow: 1 }}>
              <Typography component={'span'} variant="h4" sx={{ ml: 2, mt: 0.6 }} gutterBottom>
                {item?.name}
                {item?.type && !item?.subType && ` (${item.type})`}
                {item?.type && item?.subType && ` (${item.type} – ${item.subType})`}
              </Typography>
              {item?.circulation && (
                <Typography
                  component={'span'}
                  variant="body2"
                  color="text.secondary"
                  sx={{ ml: 2, mb: 1 }}
                >
                  {getFormattedText('', item?.circulation, '')} in circulation
                </Typography>
              )}
            </Grid>

            <Grid sx={{ flexGrow: 0, mt: 1, textAlign: 'right' }}>
              {item?.isTradable && <Chip label="Tradable" color="primary" />}
            </Grid>

            {dotNetUserDetails && (
              <Grid sx={{ flexGrow: 0, mt: 1, mr: 1, textAlign: 'right' }}>
                <Chip
                  label={
                    dotNetUserDetails.favouriteItems?.includes(item.id) ? 'Favourited' : 'Favourite'
                  }
                  icon={
                    dotNetUserDetails.favouriteItems?.includes(item.id) ? (
                      <Favorite sx={{ cursor: 'pointer', color: 'red' }} />
                    ) : (
                      <FavoriteBorder sx={{ cursor: 'pointer', color: 'gray' }} />
                    )
                  }
                  color={
                    dotNetUserDetails.favouriteItems?.includes(item.id) ? 'secondary' : 'default'
                  }
                  onClick={() => toggleFavouriteItemAsync(item.id)}
                  sx={{ pl: 0.5 }}
                />
              </Grid>
            )}
          </>
        )}

        <Grid size={{ xs: 12 }}>
          <Typography variant="body1" gutterBottom>
            <>{item?.description}</>
          </Typography>
          <Typography variant="body1" gutterBottom>
            {item?.valueVendorCountry && (
              <>
                {' '}
                Available from{' '}
                {item?.valueVendorName?.startsWith('the ')
                  ? item?.valueVendorName.substring(4)
                  : item?.valueVendorName}
                {' in '}
                {item?.valueVendorCountry === 'Torn' ? 'Torn City' : item?.valueVendorCountry}.
              </>
            )}
          </Typography>
          {item?.effect && (
            <>
              <Typography variant="body1" gutterBottom>
                Effect(s):
              </Typography>
              <List>
                {item.effect.split('\n').map((effect: string, index: number) => (
                  <ListItem key={index} sx={{ display: 'list-item', pl: 2, py: 0 }}>
                    {effect}
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {item?.requirement && (
            <Typography variant="body1" gutterBottom>
              Requirement: {item.requirement}
            </Typography>
          )}
        </Grid>

        <Grid size={{ xs: 6, md: data ? 3 : 4 }}>
          <InfoCard heading="Buy Price" isCurrency={true} value={item?.valueBuyPrice} />
        </Grid>

        <Grid size={{ xs: 6, md: data ? 3 : 4 }}>
          <InfoCard heading="Sell Price" isCurrency={true} value={item?.valueSellPrice} />
        </Grid>

        {data?.listings?.length && data.listings[0] && (
          <Grid size={{ xs: 6, md: 3 }}>
            <InfoCard
              heading="Bazaar Price"
              isCurrency={true}
              isProfitable={isItemProfitableInBazaar(item, data.listings[0])}
              value={data.listings[0]?.price}
            />
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <InfoCard
            heading="Market Price"
            isCurrency={true}
            isProfitable={isItemProfitableOnMarket(item)}
            value={item?.valueMarketPrice}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Typography variant="h5" sx={{ mt: 2 }}>
            Historical Data
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Chart
            chartType="area"
            dataColour={theme.palette.primary.main}
            dataFunction={useItemPriceHistory}
            itemId={itemId}
            title="Prices"
            valueLabel="Price"
            valuePrefix="$"
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Chart
            chartType="bar"
            dataColour={theme.palette.secondary.main}
            dataFunction={useItemVelocityHistory}
            itemId={itemId}
            title="Velocity"
            valueLabel="Changes"
            yAxisLabel="Number of changes"
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          {!data ? (
            <Loading message="Loading bazaar listings..." />
          ) : (
            <>
              <Typography variant="h5" sx={{ mt: 2 }}>
                Bazaar Listings
              </Typography>
              <Weav3rMarketTable payload={data} />
            </>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}

export default ItemDetails
