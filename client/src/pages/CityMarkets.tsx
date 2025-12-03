import { Fragment, useEffect, useMemo, useState } from 'react'
import { useItems } from '../hooks/useItems'
import {
  Box,
  Checkbox,
  Chip,
  Divider,
  FormControlLabel,
  FormGroup,
  Typography,
} from '@mui/material'
import Loading from '../components/Loading'
import CityMarketItemsTable from '../components/CityMarketItemsTable'
import { isItemProfitable } from '../types/items'

const CityMarkets = () => {
  const { items, refresh } = useItems()

  const [showProfitableOnly, setShowProfitableOnly] = useState(true)
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])

  useEffect(() => {
    refresh()
  }, [refresh])

  const countries = useMemo(() => {
    if (!items) return []
    return Array.from(new Set(items.map((i) => i.valueVendorCountry)))
      .filter((country: string | undefined) => !country || country === 'Torn')
      .sort()
  }, [items])

  const itemTypes = useMemo(() => {
    if (!items) return []
    return Array.from(
      new Set(items
        .filter(item => !item.valueVendorCountry || item.valueVendorCountry === 'Torn')
        .map((item) => item.type)
        .filter((type) => type)))
        .sort() as string[]
  }, [items])

  const vendors = useMemo(() => {
    if (!items) return []
    return Array.from(
      new Set(items
        .filter(item => !item.valueVendorCountry || item.valueVendorCountry === 'Torn')
        .map((item) => item.valueVendorName)
        .filter((vendor) => vendor)))
        .sort() as string[]
  }, [items])

  if (!items) return <Loading message="Loading items..." />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        City Markets
      </Typography>

      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Box>
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
            variant={selectedItemTypes.includes(type) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!type) return
              setSelectedItemTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }}
            sx={{ mb: 1, mr: 1 }}
          />
        ))}
      </Box>

      <Divider sx={{ mt: 1, mb: 2 }} />

      <Box>
        <Chip
          label="All Vendors"
          variant={selectedVendors.length === 0 ? 'filled' : 'outlined'}
          onClick={() => setSelectedVendors((prev) => (prev.length === 0 ? [...vendors] : []))}
          sx={{ mb: 1, mr: 1 }}
        />
        {vendors.map((vendor) => (
          <Chip
            key={vendor}
            label={vendor.replace('the ', '')  }
            color={'primary'}
            variant={selectedVendors.includes(vendor) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!vendor) return
              setSelectedVendors((prev) =>
                prev.includes(vendor) ? prev.filter((t) => t !== vendor) : [...prev, vendor],
              )
            }}
            sx={{ mb: 1, mr: 1 }}
          />
        ))}
      </Box>

      <Divider sx={{ mt: 1, mb: 2 }} />

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={showProfitableOnly}
              onChange={() => setShowProfitableOnly(!showProfitableOnly)}
            />
          }
          label="Show Profitable Items Only"
        />
      </FormGroup>

      {countries.map((country: string | undefined) => (
        <Fragment key={country}>
          <Divider sx={{ mt: 2, mb: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              {country?.replace('Torn', 'Torn City') ?? 'No Vendor'}
            </Typography>

            <CityMarketItemsTable
              items={items.filter(
                (i) =>
                  i.valueVendorCountry === country &&
                  (!showProfitableOnly || isItemProfitable(i)) &&
                  (selectedItemTypes.length === 0 || selectedItemTypes.includes(i.type!)) &&
                  (selectedVendors.length === 0 || (i.valueVendorName && selectedVendors.includes(i.valueVendorName))),
              )}
              showCityPrice={!!country}
              showVendor={!!country}
            />
          </Box>
        </Fragment>
      ))}
    </Box>
  )
}

export default CityMarkets
