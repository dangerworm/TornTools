import { useState } from 'react'
import { Link } from 'react-router'
import { Alert, AlertTitle, Box, Grid, Typography } from '@mui/material'
import Loading from '../components/Loading'
import ResaleItemsTable from '../components/ResaleItemsTable'
import SteppedSlider from '../components/SteppedSlider'
import { menuItems } from '../constants/Menu'
import { useResaleScan } from '../hooks/useResaleScan'
import { useUser } from '../hooks/useUser'

const Resale = () => {
  const { rows, error } = useResaleScan({ intervalMs: 1000 })
  const { dotNetUserDetails } = useUser()

  const minuteRangeValues = [1, 2, 3, 5, 10, 30, 60, 120]

  const priceRangeValues = [
    1, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000,
    50000000, 100000000, 500000000, 1000000000,
  ]

  const initialMinProfitIndex = 3 // 100
  const initialMaxBuyPriceIndex = 17 // 1,000,000,000
  const initialMaxTimeSinceLastUpdateIndex = 4 // 10 minutes

  const [minProfit, setMinProfit] = useState(priceRangeValues[initialMinProfitIndex])
  const [maxBuyPrice, setMaxBuyPrice] = useState(priceRangeValues[initialMaxBuyPriceIndex])
  const [maxTimeSinceLastUpdate, setMaxTimeSinceLastUpdate] = useState(
    minuteRangeValues[initialMaxTimeSinceLastUpdateIndex],
  )

  const handleMinProfitSliderValueChange = (newValue: number) => {
    setMinProfit(newValue)
  }

  const handleMaxBuyPriceSliderValueChange = (newValue: number) => {
    setMaxBuyPrice(newValue)
  }

  const handleMaxTimeSinceLastUpdateSliderValueChange = (newValue: number) => {
    setMaxTimeSinceLastUpdate(newValue)
  }

  if (!rows) return <Loading message="Loading resale opportunities..." />

  if (
    menuItems.length > 0 &&
    menuItems.find((item) => item.address === '/resale')?.requiresLogin &&
    !dotNetUserDetails
  ) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Resale Opportunities
        </Typography>
        
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>Login required</AlertTitle>
          <Typography variant="body2" gutterBottom>
            You must be logged in to access the resale opportunities tool.{' '}
            <Link to="/signin">Sign in here</Link>.
          </Typography>
        </Alert>
        <Alert severity="info">
          <AlertTitle>Why is login required?</AlertTitle>
          <Typography variant="body2" gutterBottom>
            This tool requires access to Torn's market data, and to get that I have to scan the
            markets periodically. This uses up the limited number of API calls available per user,
            and the more users there are, the faster those calls get used up.
          </Typography>
          <Typography variant="body2" gutterBottom>
            Since this page uses that scanned data, it's only fair that it's only made available to
            those users who have contributed their API key to the pool. This way, the number of
            calls made per user is reduced, which is more fair for everyone.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resale Opportunities
      </Typography>

      <Typography variant="body1" gutterBottom>
        This tool scans the market for profitable resale listings. It looks for items being sold
        below the sell price in the city, allowing you to buy low and sell high.
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <SteppedSlider
          label="Minimum Profit"
          prefixUnit="$"
          suffixUnit=""
          sliderValues={priceRangeValues}
          initialValueIndex={initialMinProfitIndex}
          onValueChange={handleMinProfitSliderValueChange}
        />
        <SteppedSlider
          label="Max Buy Price"
          prefixUnit="$"
          suffixUnit=""
          sliderValues={priceRangeValues}
          initialValueIndex={initialMaxBuyPriceIndex}
          onValueChange={handleMaxBuyPriceSliderValueChange}
        />
        <SteppedSlider
          label="Max Updated Time"
          prefixUnit=""
          suffixUnit="minute"
          sliderValues={minuteRangeValues}
          initialValueIndex={initialMaxTimeSinceLastUpdateIndex}
          onValueChange={handleMaxTimeSinceLastUpdateSliderValueChange}
        />
      </Grid>

      <ResaleItemsTable
        rows={rows}
        minProfit={minProfit}
        maxBuyPrice={maxBuyPrice}
        maxTimeSinceLastUpdate={maxTimeSinceLastUpdate}
        error={error}
      />
    </Box>
  )
}

export default Resale
