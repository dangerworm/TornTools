import {
  Alert,
  AlertTitle,
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Typography,
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Fragment, useEffect, useMemo, useState } from 'react'
import FilterDrawer from '../components/FilterDrawer'
import ForeignMarketItemsTable from '../components/ForeignMarketItemsTable'
import Loading from '../components/Loading'
import LoginRequired from '../components/LoginRequired'
import MarketToolbar from '../components/MarketToolbar'
import SectionHeader from '../components/SectionHeader'
import StaleDataBanner from '../components/StaleDataBanner'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useForeignMarketsScan } from '../hooks/useForeignMarketsScan'
import { useRequiresLogin } from '../hooks/useRequiresLogin'
import { useUser } from '../hooks/useUser'
import { loadStringArray, saveStringArray } from '../lib/persistence'
import {
  prettyPrintFlightTime,
  travelDestinations,
  travelDestinationsByCountry,
  type TravelDestination,
} from '../lib/countries'
import { isForeignStockItemProfitable } from '../types/foreignStockItems'
import type { SaleOutlet } from '../types/markets'

const itemTypesOfInterest = ['Drug', 'Flower', 'Plushie']
const VALID_FM_SALE_OUTLETS: SaleOutlet[] = ['bazaar', 'market', 'anonymousMarket']

const ForeignMarkets = () => {
  const theme = useTheme()
  const { rows, error } = useForeignMarketsScan({ intervalMs: 60000 })
  const loginRequired = useRequiresLogin('/foreign-markets')

  const { tornUserProfile } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [orderByFlightTime, setOrderByFlightTime] = useState(
    () => localStorage.getItem('torntools:foreign-markets:order-by-flight-time:v1') === 'true',
  )

  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(() => {
    const stored = localStorage.getItem('torntools:foreign-markets:selected-item-types:v1')
    if (stored === null) return itemTypesOfInterest
    return loadStringArray('torntools:foreign-markets:selected-item-types:v1')
  })
  const [saleOutlet, setSaleOutlet] = useState<SaleOutlet>(() => {
    const stored = localStorage.getItem(
      'torntools:foreign-markets:sale-outlet:v1',
    ) as SaleOutlet | null
    return stored && VALID_FM_SALE_OUTLETS.includes(stored) ? stored : 'market'
  })
  const [showProfitableOnly, setShowProfitableOnly] = useState(
    () => localStorage.getItem('torntools:foreign-markets:show-profitable-only:v1') === 'true',
  )
  const [hideOutOfStock, setHideOutOfStock] = useState(
    () => localStorage.getItem('torntools:foreign-markets:hide-out-of-stock:v1') === 'true',
  )
  const [showAllCountries, setShowAllCountries] = useState(
    () => localStorage.getItem('torntools:foreign-markets:show-all-countries:v1') === 'true',
  )

  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    saveStringArray('torntools:foreign-markets:selected-item-types:v1', selectedItemTypes)
  }, [selectedItemTypes])

  const handleSaleOutletChange = (_: React.MouseEvent<HTMLElement>, newOutlet: string | number) => {
    const outlet = newOutlet as SaleOutlet
    setSaleOutlet(outlet)
    localStorage.setItem('torntools:foreign-markets:sale-outlet:v1', outlet)
  }

  const handleShowProfitableOnlyChange = (next: boolean) => {
    setShowProfitableOnly(next)
    localStorage.setItem('torntools:foreign-markets:show-profitable-only:v1', String(next))
  }

  useEffect(() => {
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

  if (loginRequired) {
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

  const saleOutletHint =
    saleOutlet === 'bazaar'
      ? 'Bazaar sell prices show the cheapest listing from the most recent Weav3r scan. Items with no scan data show no sell price.'
      : "Sell prices are based on Torn's daily average market price, not the most recent market scan."

  const activeCount =
    (selectedItemTypes.length > 0 && selectedItemTypes.length !== itemTypes.length ? 1 : 0) +
    (showProfitableOnly ? 1 : 0) +
    (hideOutOfStock ? 1 : 0) +
    (searchTerm.trim().length > 0 ? 1 : 0)

  const mainContent = (
    <Box>
      <Typography variant="h4" gutterBottom>
        Foreign Markets
      </Typography>

      <StaleDataBanner surface="foreign scan" />

      <Box>
        <Grid container spacing={0.5} sx={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
          {sortedDestinations.map((destination: TravelDestination) => (
            <Grid key={destination.country} size="auto">
              <Box
                sx={{
                  alignItems: 'center',
                  display: 'inline-flex',
                  flexDirection: 'column',
                  minWidth: '3.4em',
                  mr: 0.5,
                  textAlign: 'center',
                }}
              >
                <img
                  src={`/${destination.country?.toLowerCase().replace(' ', '-')}.svg`}
                  alt={`Flag of ${destination.country}`}
                  style={{
                    border: selectedCountries.includes(destination.country || '')
                      ? `3px solid ${theme.palette.primary.main}`
                      : '2px solid transparent',
                    borderRadius: '2.5em',
                    cursor: 'pointer',
                    maxWidth: '2.5em',
                    height: '2.5em',
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
                  sx={(theme) => ({ color: theme.palette.text.secondary })}
                >
                  {destination.flightTimesMinutes.standard
                    ? prettyPrintFlightTime(destination.flightTimesMinutes.standard)
                    : 'N/A'}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              size="small"
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
        />
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

  const filterPanel = (
    <>
      <MarketToolbar
        saleOutlet={saleOutlet}
        onSaleOutletChange={handleSaleOutletChange}
        showProfitableOnly={showProfitableOnly}
        onShowProfitableOnlyChange={handleShowProfitableOnlyChange}
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        saleOutletHint={saleOutletHint}
      />

      <Divider sx={{ my: 2 }} />

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={hideOutOfStock}
              onChange={() => {
                const next = !hideOutOfStock
                setHideOutOfStock(next)
                localStorage.setItem('torntools:foreign-markets:hide-out-of-stock:v1', String(next))
              }}
            />
          }
          label="Hide out of stock"
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
          label="Single table"
        />
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      <SectionHeader variant="subtitle2" hairline={false}>
        Item types
      </SectionHeader>
      <Box>
        <Chip
          label="All"
          size="small"
          variant={
            selectedItemTypes.length === 0 || selectedItemTypes.length === itemTypes.length
              ? 'filled'
              : 'outlined'
          }
          onClick={() =>
            setSelectedItemTypes((prev) => (prev.length === itemTypes.length ? [] : [...itemTypes]))
          }
          sx={{ mb: 0.5, mr: 0.5 }}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            color="primary"
            variant={selectedItemTypes.includes(type!) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!type) return
              setSelectedItemTypes((prev) =>
                prev.includes(type!) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }}
            sx={{ mb: 0.5, mr: 0.5 }}
          />
        ))}
      </Box>
    </>
  )

  return (
    <FilterDrawer activeCount={activeCount} main={mainContent}>
      {filterPanel}
    </FilterDrawer>
  )
}

export default ForeignMarkets
