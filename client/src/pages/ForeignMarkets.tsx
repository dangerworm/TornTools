import { Fragment, use, useEffect, useMemo, useState } from 'react'
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
import ForeignMarketItemsTable from '../components/ForeignMarketItemsTable'
import { useUser } from '../hooks/useUser'
import { useForeignMarketsScan } from '../hooks/useForeignMarketsScan'
import Loading from '../components/Loading'
import {
  prettyPrintFlightTime,
  travelDestinations,
  travelDestinationsByCountry,
  type TravelDestination,
} from '../lib/countries'

const itemTypesOfInterest = ['Drug', 'Flower', 'Plushie']

const ForeignMarkets = () => {
  const { rows, error } = useForeignMarketsScan({ intervalMs: 60000 })
  const { apiKey, tornUserProfile, fetchTornProfileAsync } = useUser()

  const [orderByFlightTime, setOrderByFlightTime] = useState(false)

  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(itemTypesOfInterest)

  const [searchTerm, setSearchTerm] = useState('')

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
        (selectedItemTypes.length === 0 || selectedItemTypes.includes(row.item.type!)) &&
        (row.itemName.toLowerCase().includes(lowerSearchTerm) ||
          row.item.type?.toLowerCase().includes(lowerSearchTerm) ||
          row.item.subType?.toLowerCase().includes(lowerSearchTerm)),
    )
  }, [rows, searchTerm, selectedItemTypes])

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
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <AlertTitle>Error</AlertTitle>
        <Typography variant="body2" gutterBottom>
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

      <FormGroup sx={{ mb: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={orderByFlightTime}
              onChange={() => setOrderByFlightTime(!orderByFlightTime)}
            />
          }
          label="Order by flight time"
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
                      ? '4px solid #0966c2'
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

      {sortedDestinations
        .filter(
          (destination) =>
            selectedCountries.length === 0 || selectedCountries.includes(destination.country || ''),
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
                  variant="body2"
                  sx={(theme) => ({ color: theme.palette.text.secondary, ml: 2 })}
                >
                  Flight time:{' '}
                  {destination.flightTimesMinutes.standard
                    ? `${prettyPrintFlightTime(destination.flightTimesMinutes.standard)} (standard)`
                    : 'N/A'}
                </Typography>

                <ForeignMarketItemsTable
                  items={filteredItems.filter((i) => i.country === destination.country)}
                />
              </Box>
            )}
          </Fragment>
        ))}
    </Box>
  )
}

export default ForeignMarkets
