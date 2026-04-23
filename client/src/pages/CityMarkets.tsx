import { Box, Chip, Divider, Typography } from '@mui/material'
import { Fragment, useEffect, useMemo, useState } from 'react'
import CityMarketItemsTable from '../components/CityMarketItemsTable'
import FilterDrawer from '../components/FilterDrawer'
import Loading from '../components/Loading'
import LoginRequired from '../components/LoginRequired'
import MarketToolbar from '../components/MarketToolbar'
import { menuItems } from '../components/Menu'
import SectionHeader from '../components/SectionHeader'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import { isItemProfitableOnMarket } from '../types/items'
import type { SaleOutlet } from '../types/markets'

const VALID_CM_SALE_OUTLETS: SaleOutlet[] = ['bazaar', 'market', 'anonymousMarket']

const CityMarkets = () => {
  const { items, refresh } = useItems()
  const { dotNetUserDetails } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([])
  const [selectedVendors, setSelectedVendors] = useState<string[]>([])
  const [showProfitableOnly, setShowProfitableOnly] = useState(
    () => localStorage.getItem('torntools:city-markets:show-profitable-only:v1') === 'true',
  )
  const [saleOutlet, setSaleOutlet] = useState<SaleOutlet>(() => {
    const stored = localStorage.getItem(
      'torntools:city-markets:sale-outlet:v1',
    ) as SaleOutlet | null
    return stored && VALID_CM_SALE_OUTLETS.includes(stored) ? stored : 'market'
  })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    refresh()
  }, [refresh])

  const countries = useMemo(() => {
    if (!items) return []
    return Array.from(new Set(items.map((i) => i.valueVendorCountry)))
      .filter((country: string | undefined) => country === 'Torn')
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
        (!showProfitableOnly ||
          isItemProfitableOnMarket(i, saleOutlet, bazaarSummaries[i.id]?.minPrice)) &&
        (selectedItemTypes.length === 0 || selectedItemTypes.includes(i.type!)) &&
        (selectedVendors.length === 0 ||
          (i.valueVendorName && selectedVendors.includes(i.valueVendorName))),
    )
  }, [items, showProfitableOnly, selectedItemTypes, selectedVendors, saleOutlet, bazaarSummaries])

  const handleSaleOutletChange = (_: React.MouseEvent<HTMLElement>, newOutlet: string | number) => {
    const outlet = newOutlet as SaleOutlet
    setSaleOutlet(outlet)
    localStorage.setItem('torntools:city-markets:sale-outlet:v1', outlet)
  }

  const handleShowProfitableOnlyChange = (next: boolean) => {
    setShowProfitableOnly(next)
    localStorage.setItem('torntools:city-markets:show-profitable-only:v1', String(next))
  }

  if (
    menuItems.length > 0 &&
    menuItems.find((item) => item.address === '/city-markets')?.requiresLogin &&
    !dotNetUserDetails
  ) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          City Markets
        </Typography>

        <LoginRequired tool="City Markets" requiredLevel="public" />
      </Box>
    )
  }

  if (!items) return <Loading message="Loading items..." />

  const saleOutletHint =
    saleOutlet === 'bazaar'
      ? 'Bazaar sell prices show the cheapest listing from the most recent Weav3r scan. Items with no scan data show no sell price.'
      : "Sell prices are based on Torn's daily average market price, not the most recent market scan."

  const activeCount =
    (selectedItemTypes.length > 0 && selectedItemTypes.length !== itemTypes.length ? 1 : 0) +
    (selectedVendors.length > 0 && selectedVendors.length !== vendors.length ? 1 : 0) +
    (showProfitableOnly ? 1 : 0) +
    (searchTerm.trim().length > 0 ? 1 : 0)

  const mainContent = (
    <Box sx={{ pt: 0 }}>
      <Typography variant="h4" gutterBottom>
        City Markets
      </Typography>

      {countries.map((country: string | undefined) => (
        <Fragment key={country}>
          <Divider sx={{ mt: 2, mb: 4 }} />

          <Box sx={{ mb: 4 }}>
            <SectionHeader variant="h5">
              {country?.replace('Torn', 'Torn City') ?? 'No Vendor'}
            </SectionHeader>

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

      <SectionHeader variant="subtitle2" hairline={false}>
        Item types
      </SectionHeader>
      <Box sx={{ mb: 1 }}>
        <Chip
          label="All"
          size="small"
          variant={
            selectedItemTypes.length === 0 || selectedItemTypes.length === itemTypes.length
              ? 'filled'
              : 'outlined'
          }
          onClick={() => setSelectedItemTypes([])}
          sx={{ mb: 0.5, mr: 0.5 }}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            color="primary"
            variant={selectedItemTypes.includes(type) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!type) return
              setSelectedItemTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }}
            sx={{ mb: 0.5, mr: 0.5 }}
          />
        ))}
      </Box>

      <Divider sx={{ my: 2 }} />

      <SectionHeader variant="subtitle2" hairline={false}>
        Vendors
      </SectionHeader>
      <Box>
        <Chip
          label="All"
          size="small"
          variant={
            selectedVendors.length === 0 || selectedVendors.length === vendors.length
              ? 'filled'
              : 'outlined'
          }
          onClick={() => setSelectedVendors([])}
          sx={{ mb: 0.5, mr: 0.5 }}
        />
        {vendors.map((vendor) => (
          <Chip
            key={vendor}
            label={vendor.replace('the ', '')}
            size="small"
            color="primary"
            variant={selectedVendors.includes(vendor) ? 'filled' : 'outlined'}
            onClick={() => {
              if (!vendor) return
              setSelectedVendors((prev) =>
                prev.includes(vendor) ? prev.filter((t) => t !== vendor) : [...prev, vendor],
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

export default CityMarkets
