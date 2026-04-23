import {
  Alert,
  AlertTitle,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  TextField,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, useEffect, useMemo, useState } from 'react'
import ForeignMarketItemsTable from '../components/ForeignMarketItemsTable'
import Loading from '../components/Loading'
import LoginRequired from '../components/LoginRequired'
import { menuItems } from '../components/Menu'
import OptionGroup from '../components/OptionGroup'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useForeignMarketsScan } from '../hooks/useForeignMarketsScan'
import { useUser } from '../hooks/useUser'
import {
  prettyPrintFlightTime,
  travelDestinations,
  travelDestinationsByCountry,
  type TravelDestination,
} from '../lib/countries'
import { saleOutletOptions } from '../types/common'
import { isForeignStockItemProfitable } from '../types/foreignStockItems'
import type { SaleOutlet } from '../types/markets'

const itemTypesOfInterest = ['Drug', 'Flower', 'Plushie']

const VALID_FM_SALE_OUTLETS: SaleOutlet[] = ['bazaar', 'market', 'anonymousMarket']

const ForeignMarkets = () => {
  const theme = useTheme()
  const { rows, error } = useForeignMarketsScan({ intervalMs: 60000 })
  const { dotNetUserDetails } = useUser()

  const { apiKey, tornUserProfile, fetchTornProfileAsync } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [orderByFlightTime, setOrderByFlightTime] = useState(
    () => localStorage.getItem('torntools:foreign-markets:order-by-flight-time:v1') === 'true',
  )

  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(itemTypesOfInterest)
  const [saleOutlet, setSaleOutlet] = useState<SaleOutlet>(() => {
    const stored = localStorage.getItem(
      'torntools:foreign-markets:sale-outlet:v1',
    ) as SaleOutlet | null
    return stored && VALID_FM_SALE_OUTLETS.includes(stored) ? stored : 'market'
  })
  const [showProfitableOnly, setShowProfitableOnly] = useState(
    () => localStorage.getItem('torntools:foreign-markets:show-profitable-only:v1') !== 'false',
  )
  const [hideOutOfStock, setHideOutOfStock] = useState(
    () => localStorage.getItem('torntools:foreign-markets:hide-out-of-stock:v1') !== 'false',
  )
  const [showAllCountries, setShowAllCountries] = useState(
    () => localStorage.getItem('torntools:foreign-markets:show-all-countries:v1') === 'true',
  )

  const [searchTerm, setSearchTerm] = useState('')

  const foreignSaleOutletOptions = saleOutletOptions.filter((o) => o.value !== 'city')

  const handleSaleOutletChange = (_: React.MouseEvent<HTMLElement>, newOutlet: string | number) => {
    const outlet = newOutlet as SaleOutlet
    setSaleOutlet(outlet)
    localStorage.setItem('torntools:foreign-markets:sale-outlet:v1', outlet)
  }

  useEffect(() => {
    if (!apiKey) {
      return
    }

    // Fetch the latest Torn profile data on component mount
    fetchTornProfileAsync(apiKey)
  }, [apiKey, fetchTornProfileAsync])

  useEffect(() => {
    // Reset selected countries if user logs out
    if (!tornUserProfile) {
      return
    }

    if (
      tornUserProfile.status.state === 'Traveling' &&
      !tornUserProfile.status.description.startsWith('Returning to')
    ) {
      const destination = tornUserProfile.status.description.replace('Traveling to ', '')
      setSelectedCountries([destination])
    } else if (tornUserProfile.status.state === 'Abroad') {
      setSelectedCountries([tornUserProfile.status.description.substring(3)])
    }
  }, [tornUserProfile])

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    return rows.filter(
      (row) =>
        (!hideOutOfStock || row.quantity > 0) &&
        (!showProfitableOnly ||
          isForeignStockItemProfitable(row, saleOutlet, bazaarSummaries[row.itemId]?.minPrice)) &&
        (selectedItemTypes.length === 0 || selectedItemTypes.includes(row.item.type!)) &&
        (row.itemName.toLowerCase().includes(lowerSearchTerm) ||
          row.item.type?.toLowerCase().includes(lowerSearchTerm) ||
          row.item.subType?.toLowerCase().includes(lowerSearchTerm)),
    )
  }, [
    rows,
    searchTerm,
    selectedItemTypes,
    showProfitableOnly,
    hideOutOfStock,
    saleOutlet,
    bazaarSummaries,
  ])

  const sortedDestinations = useMemo(() => {
    if (orderByFlightTime) {
      return travelDestinations
        .map(({ country, flightTimesMinutes }) => ({
          country,
          flightTime: flightTimesMinutes.standard,
        }))
        .sort((a, b) => {
          if (a.flightTime === b.flightTime) {
            return a!.country!.localeCompare(b!.country!)
          }
          if (!a?.flightTime || !b?.flightTime) {
            return a ? -1 : 1
          }
          return a.flightTime - b.flightTime
        })
        .map((td) => travelDestinationsByCountry[td.country!])
    }

    return travelDestinations.sort((a, b) => a.country.localeCompare(b.country))
  }, [orderByFlightTime])

  const itemTypes = useMemo(() => {
    if (!rows) return []
    return Array.from(
      new Set(rows.map((i) => i.item.type).filter((type) => type)),
    ).sort() as string[]
  }, [rows])

  const handleCountryFilterChange = (country: string) => {
    setSelectedCountries((prevSelected) => {
      if (prevSelected.includes(country)) {
        return prevSelected.filter((c) => c !== country)
      } else {
        return [...prevSelected, country]
      }
    })
  }

  if (!rows) return <Loading message="Loading foreign markets..." />

  if (
    menuItems.length > 0 &&
    menuItems.find((item) => item.address === '/foreign-markets')?.requiresLogin &&
    !dotNetUserDetails
  ) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Foreign Markets
        </Typography>

        <LoginRequired tool="Foreign Markets" requiredLevel="public" />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        <Typography variant="body1" gutterBottom>
          {error}
        </Typography>
      </Alert>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Foreign Markets
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <FormGroup row sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={orderByFlightTime}
              onChange={() => {
                const next = !orderByFlightTime
                setOrderByFlightTime(next)
                localStorage.setItem(
                  'torntools:foreign-markets:order-by-flight-time:v1',
                  String(next),
                )
              }}
            />
          }
          label="Order by flight time"
          sx={{ mr: 3 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={showAllCountries}
              onChange={() => {
                const next = !showAllCountries
                setShowAllCountries(next)
                localStorage.setItem(
                  'torntools:foreign-markets:show-all-countries:v1',
                  String(next),
                )
              }}
            />
          }
          label="Show all countries in one table"
        />
      </FormGroup>

      <Box>
        <Grid container spacing={2}>
          {sortedDestinations.map((destination: TravelDestination) => (
            <Grid key={destination.country} size="auto">
              <Box
                key={destination.country}
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  minWidth: '4em',
                  mr: 2,
                  textAlign: 'center',
                }}
              >
                <img
                  src={`/${destination.country?.toLowerCase().replace(' ', '-')}.svg`}
                  alt={`Flag of ${destination.country}`}
                  style={{
                    border: selectedCountries.includes(destination.country || '')
                      ? `4px solid ${theme.palette.primary.main}`
                      : '2px solid transparent',
                    borderRadius: '3em',
                    cursor: 'pointer',
                    maxWidth: '3em',
                    height: '3em',
                    objectFit: 'cover',
                  }}
                  onClick={() => handleCountryFilterChange(destination.country || '')}
                />
                <Typography
                  variant="caption"
                  sx={{ mt: 0.5, fontWeight: 'bold', cursor: 'pointer' }}
                  onClick={() => handleCountryFilterChange(destination.country || '')}
                >
                  {destination.countryDisplayName || destination.country}
                </Typography>
                <Typography
                  variant="caption"
                  sx={(theme) => ({ color: theme.palette.text.secondary, mt: 0.5 })}
                >
                  {destination.flightTimesMinutes.standard
                    ? prettyPrintFlightTime(destination.flightTimesMinutes.standard)
                    : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>

      <Box sx={{ mt: 3 }}>
        <Chip
          label="All Item Types"
          variant={selectedItemTypes.length === 0 ? 'filled' : 'outlined'}
          onClick={() => setSelectedItemTypes((prev) => (prev.length === 0 ? [...itemTypes] : []))}
          sx={{ mb: 1, mr: 1 }}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            color={'primary'}
            variant={selectedItemTypes.includes(type!) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!type) return
              setSelectedItemTypes((prev) =>
                prev.includes(type!) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }}
            sx={{ mb: 1, mr: 1 }}
          />
        ))}
      </Box>

      <Divider sx={{ mt: 1, mb: 2 }} />

      <Typography variant="h6" gutterBottom>
        Options
      </Typography>

      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 'auto' }} sx={{ minWidth: '22em' }}>
          <OptionGroup
            options={foreignSaleOutletOptions}
            selectedOption={saleOutlet}
            title={'Sell via'}
            titleInline={true}
            handleOptionChange={handleSaleOutletChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} sx={{ mt: '-2px' }}>
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showProfitableOnly}
                  onChange={() => {
                    const next = !showProfitableOnly
                    setShowProfitableOnly(next)
                    localStorage.setItem(
                      'torntools:foreign-markets:show-profitable-only:v1',
                      String(next),
                    )
                  }}
                />
              }
              label="Show Profitable Items Only"
              sx={{ mr: 3 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideOutOfStock}
                  onChange={() => {
                    const next = !hideOutOfStock
                    setHideOutOfStock(next)
                    localStorage.setItem(
                      'torntools:foreign-markets:hide-out-of-stock:v1',
                      String(next),
                    )
                  }}
                />
              }
              label="Hide Out of Stock"
            />
          </FormGroup>
        </Grid>
      </Grid>

      {saleOutlet === 'bazaar' ? (
        <Typography variant="body1" sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
          Note: bazaar sell prices show the current cheapest listing from the most recent Weav3r
          scan. Items with no scan data show no sell price.
        </Typography>
      ) : (
        <Typography variant="body1" sx={{ mt: 1, mb: 2, color: 'text.secondary' }}>
          Note: sell prices are based on Torn's daily average market price, not the most recent
          market scan.
        </Typography>
      )}

      <Box sx={{ my: 2 }}>
        <FormGroup>
          <FormLabel sx={{ mb: 1 }}>Search items:</FormLabel>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 1, minWidth: 400 }}
          />
        </FormGroup>
      </Box>

      {showAllCountries
        ? (() => {
            const visibleItems = filteredItems.filter(
              (i) => selectedCountries.length === 0 || selectedCountries.includes(i.country),
            )
            return visibleItems.length > 0 ? (
              <Box sx={{ mb: 4 }}>
                <Divider sx={{ mt: 2, mb: 4 }} />
                <ForeignMarketItemsTable items={visibleItems} saleOutlet={saleOutlet} showCountry />
              </Box>
            ) : null
          })()
        : sortedDestinations
            .filter(
              (destination) =>
                selectedCountries.length === 0 ||
                selectedCountries.includes(destination.country || ''),
            )
            .map((destination) => (
              <Fragment key={destination.country}>
                {filteredItems.filter((i) => i.country === destination.country).length > 0 && (
                  <Box key={destination.country} sx={{ mb: 4 }}>
                    <Divider sx={{ mt: 2, mb: 4 }} />
                    <Typography component={'span'} variant="h5" gutterBottom>
                      <img
                        src={`/${destination.country?.toLowerCase().replace(' ', '-')}.svg`}
                        alt={`Flag of ${destination.country}`}
                        style={{
                          maxWidth: '1em',
                          height: 'auto',
                          marginRight: 8,
                          top: 3,
                          position: 'relative',
                        }}
                      />
                      {destination.country}
                    </Typography>
                    <Typography
                      component={'span'}
                      variant="body1"
                      sx={(theme) => ({ color: theme.palette.text.secondary, ml: 2 })}
                    >
                      Flight time:{' '}
                      {destination.flightTimesMinutes.standard
                        ? `${prettyPrintFlightTime(destination.flightTimesMinutes.standard)} (standard)`
                        : 'N/A'}
                    </Typography>

                    <ForeignMarketItemsTable
                      items={filteredItems.filter((i) => i.country === destination.country)}
                      saleOutlet={saleOutlet}
                    />
                  </Box>
                )}
              </Fragment>
            ))}
    </Box>
  )
}

export default ForeignMarkets
