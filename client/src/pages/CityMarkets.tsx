import { Fragment, useEffect, useMemo, useState } from 'react'
import { useItems } from '../hooks/useItems'
import {
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
import Loading from '../components/Loading'
import CityMarketItemsTable from '../components/CityMarketItemsTable'
import { isItemProfitableOnMarket } from '../types/items'
import OptionGroup from '../components/OptionGroup'
import { saleOutletOptions } from '../types/common'
import type { SaleOutlet } from '../types/markets'

const CityMarkets = () => {
  const { items, refresh } = useItems()

  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [showProfitableOnly, setShowProfitableOnly] = useState(true)
  const [saleOutlet, setSaleOutlet] = useState<SaleOutlet>('market')
  const [searchTerm, setSearchTerm] = useState('')

  const marketSaleOutletOptions = saleOutletOptions.filter((o) => o.value !== 'city')

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
      new Set(
        items
          .filter((item) => !item.valueVendorCountry || item.valueVendorCountry === 'Torn')
          .map((item) => item.type)
          .filter((type) => type),
      ),
    ).sort() as string[]
  }, [items])

  const vendors = useMemo(() => {
    if (!items) return []
    return Array.from(
      new Set(
        items
          .filter((item) => !item.valueVendorCountry || item.valueVendorCountry === 'Torn')
          .map((item) => item.valueVendorName)
          .filter((vendor) => vendor),
      ),
    ).sort() as string[]
  }, [items])

  const filteredItems = useMemo(() => {
    if (!items) return []
    return items.filter(
      (i) =>
        (!showProfitableOnly || isItemProfitableOnMarket(i, saleOutlet)) &&
        (selectedItemTypes.length === 0 || selectedItemTypes.includes(i.type!)) &&
        (selectedVendors.length === 0 ||
          (i.valueVendorName && selectedVendors.includes(i.valueVendorName))),
    )
  }, [items, showProfitableOnly, selectedItemTypes, selectedVendors, saleOutlet])

  const handleSaleOutletChange = (_: React.MouseEvent<HTMLElement>, newOutlet: string | number) => {
    setSaleOutlet(newOutlet as SaleOutlet)
  }

  if (!items) return <Loading message="Loading items..." />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        City Markets
      </Typography>

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <Box sx={{ mt: 2 }}>
        <Chip
          label="All Item Types"
          variant={
            selectedItemTypes.length === 0 || selectedItemTypes.length === itemTypes.length
              ? 'filled'
              : 'outlined'
          }
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

      <Box sx={{ mt: 2 }}>
        <Chip
          label="All Vendors"
          variant={
            selectedVendors.length === 0 || selectedVendors.length === vendors.length
              ? 'filled'
              : 'outlined'
          }
          onClick={() => setSelectedVendors((prev) => (prev.length === 0 ? [...vendors] : []))}
          sx={{ mb: 1, mr: 1 }}
        />
        {vendors.map((vendor) => (
          <Chip
            key={vendor}
            label={vendor.replace('the ', '')}
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

      <Typography variant="h6" gutterBottom>
        Options
      </Typography>

      <Grid container spacing={2} alignItems="top">
        <Grid size={{ xs: 12, sm: "auto" }} sx={{ minWidth: '22em' }}>
          <OptionGroup
            options={marketSaleOutletOptions}
            selectedOption={saleOutlet}
            title={'Sell via'}
            titleInline={true}
            handleOptionChange={handleSaleOutletChange}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }} sx={{ mt: "-2px"}}>
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
        </Grid>
      </Grid>

      {(saleOutlet === 'market' || saleOutlet === 'anonymousMarket') && (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Note: sell prices are based on Torn's daily average market price, not the most recent market scan.
        </Typography>
      )}
      {saleOutlet === 'bazaar' && (
        <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
          Note: bazaar sell prices show the current cheapest listing from the most recent Weav3r scan. Items with no scan data show no sell price.
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

      {countries.map((country: string | undefined) => (
        <Fragment key={country}>
          <Divider sx={{ mt: 2, mb: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h5" gutterBottom>
              {country?.replace('Torn', 'Torn City') ?? 'No Vendor'}
            </Typography>

            <CityMarketItemsTable
              items={filteredItems.filter((i) => i.valueVendorCountry === country)}
              searchTerm={searchTerm}
              showCityPrice={!!country}
              showVendor={!!country}
              saleOutlet={saleOutlet}
            />
          </Box>
        </Fragment>
      ))}
    </Box>
  )
}

export default CityMarkets
