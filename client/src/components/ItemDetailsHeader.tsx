import Favorite from '@mui/icons-material/Favorite'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder'
import { Chip, Grid, Typography } from '@mui/material'
import { useUser } from '../hooks/useUser'
import { type Item } from '../types/items'

import { getFormattedText } from '../lib/textFormat'
import StatChip from './StatChip'

interface ItemDetailsHeaderProps {
  item: Item
  inlineView?: boolean
}

const ItemDetailsHeader = ({ item, inlineView = false }: ItemDetailsHeaderProps) => {
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  return (
    <Grid container spacing={0} sx={{ mt: inlineView ? 4 : 0 }}>
      <Grid size={{ xs: 12, md: 8 }}>
        <Grid container>
          <Grid sx={{ alignItems: 'center', width: 100 }}>
            <img
              alt={`Image for ${item.name}`}
              src={`https://www.torn.com/images/items/${item!.id}/large.png`}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </Grid>
          <Grid sx={{ width: 'calc(100% - 100px)' }}>
            <Typography component={'span'} variant="h5" sx={{ ml: 1 }} gutterBottom>
              {item?.name}
              {item?.type && !item?.subType && ` (${item.type})`}
              {item?.type && item?.subType && ` (${item.type} – ${item.subType})`}
            </Typography>
            {item?.circulation && (
              <Typography
                component={'p'}
                variant="body1"
                color="text.secondary"
                sx={{ mb: 1, ml: 1 }}
              >
                {getFormattedText('', item?.circulation, '')} in circulation
              </Typography>
            )}
          </Grid>
        </Grid>
      </Grid>
      <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
        <>
          {item?.isTradable && <StatChip chipVariant="tradable" label="Tradable" sx={{ mr: 1 }} />}

          {dotNetUserDetails && (
            <Chip
              label={
                dotNetUserDetails.favouriteItems?.includes(item.id) ? 'Favourited' : 'Favourite'
              }
              icon={
                dotNetUserDetails.favouriteItems?.includes(item.id) ? (
                  <Favorite sx={{ cursor: 'pointer', color: 'primary.main' }} />
                ) : (
                  <FavoriteBorder sx={{ cursor: 'pointer', color: 'text.secondary' }} />
                )
              }
              variant={dotNetUserDetails.favouriteItems?.includes(item.id) ? 'filled' : 'outlined'}
              onClick={() => toggleFavouriteItemAsync(item.id)}
              sx={{ pl: 0.5 }}
            />
          )}
        </>
      </Grid>
    </Grid>
  )
}

export default ItemDetailsHeader
