import { Alert, AlertTitle, Box, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'
import FavouriteMarketsTable from '../components/FavouriteMarketsTable'
import Loading from '../components/Loading'
import LoginRequired from '../components/LoginRequired'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'

const FavouriteMarkets = () => {
  const { dotNetUserDetails } = useUser()
  const { itemsById } = useItems()

  const favouriteItems = useRef(dotNetUserDetails?.favouriteItems ?? [])

  useEffect(() => {
    if (favouriteItems.current.length === 0 && dotNetUserDetails?.favouriteItems) {
      favouriteItems.current = dotNetUserDetails.favouriteItems
    }
  }, [dotNetUserDetails?.favouriteItems])

  if (!dotNetUserDetails) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Favourites
        </Typography>
        <LoginRequired tool="Favourite Markets" requiredLevel="public" />
      </Box>
    )
  }

  if (!dotNetUserDetails) return <Loading message="Loading favourite markets..." />

  if (!dotNetUserDetails?.favouriteItems.length) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Favourites
        </Typography>
        <Alert severity="info">
          <AlertTitle>No favourite markets</AlertTitle>
          <Typography variant="body1" gutterBottom>
            You have not saved any favourite markets yet. Use the heart icon in the markets tables
            to add favourites.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Favourites
      </Typography>
      <Typography variant="body1" gutterBottom>
        Quickly jump back to the items you follow the most.
      </Typography>

      <FavouriteMarketsTable
        items={favouriteItems.current.map((id) => itemsById[id]).filter(Boolean)}
      />
    </Box>
  )
}

export default FavouriteMarkets
