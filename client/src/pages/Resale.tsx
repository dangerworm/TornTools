import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  FormGroup,
  Grid,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import Loading from '../components/Loading'
import LoginRequired from '../components/LoginRequired'
import OptionGroup from '../components/OptionGroup'
import ResaleItemsTable from '../components/ResaleItemsTable'
import StaleDataBanner from '../components/StaleDataBanner'
import SteppedSlider from '../components/SteppedSlider'
import { useItems } from '../hooks/useItems'
import { useRequiresLogin } from '../hooks/useRequiresLogin'
import { useResaleScan } from '../hooks/useResaleScan'
import { getTotalProfit } from '../lib/profitCalculations'
import { purchaseOutletOptions, saleOutletOptions } from '../types/common'
import type { PurchaseOutlet, SaleOutlet } from '../types/markets'

const VALID_PURCHASE_OUTLETS: PurchaseOutlet[] = ['city', 'bazaar', 'market']
const VALID_SALE_OUTLETS: SaleOutlet[] = ['city', 'bazaar', 'market', 'anonymousMarket']

const MINUTE_RANGE_VALUES = [1, 2, 5, 10, 30, 60, 120, 300]
const PRICE_RANGE_VALUES = [
  0, 1, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000, 5000000, 10000000,
  50000000, 100000000, 500000000, 1000000000, 50000000000, 100000000000,
]

const DEFAULT_MIN_PROFIT_INDEX = 3 // $50
const DEFAULT_MAX_PROFIT_INDEX = PRICE_RANGE_VALUES.length - 1
const DEFAULT_MIN_BUY_PRICE_INDEX = 0 // $0
const DEFAULT_MAX_BUY_PRICE_INDEX = 17 // $1,000,000,000
const DEFAULT_MIN_TIME_INDEX = 0 // 1 minute
const DEFAULT_MAX_TIME_INDEX = 4 // 30 minutes

const loadSliderIndex = (key: string, defaultIndex: number, values: number[]): number => {
  const stored = localStorage.getItem(key)
  if (stored === null) return defaultIndex
  const idx = values.indexOf(Number(stored))
  return idx === -1 ? defaultIndex : idx
}

const disabledSaleOutlets = (purchase: PurchaseOutlet): SaleOutlet[] =>
  purchase === 'market' ? ['market', 'anonymousMarket'] : [purchase as SaleOutlet]

const loadOutlets = (): { purchaseOutlet: PurchaseOutlet; saleOutlet: SaleOutlet } => {
  const storedPurchase = localStorage.getItem('resale:purchaseOutlet:v1') as PurchaseOutlet
  const purchase: PurchaseOutlet = VALID_PURCHASE_OUTLETS.includes(storedPurchase)
    ? storedPurchase
    : 'market'

  const storedSale = localStorage.getItem('resale:saleOutlet:v1') as SaleOutlet
  const disabled = disabledSaleOutlets(purchase)
  const sale: SaleOutlet =
    VALID_SALE_OUTLETS.includes(storedSale) && !disabled.includes(storedSale)
      ? storedSale
      : !disabled.includes('city')
        ? 'city'
        : ((saleOutletOptions.find((o) => !disabled.includes(o.value as SaleOutlet))
            ?.value as SaleOutlet) ?? 'city')

  return { purchaseOutlet: purchase, saleOutlet: sale }
}

// Items Torn sells one at a time in their vendors: weapons (except Temporary,
// which are boxes you buy stacks of) and armour. Everything else can be
// scooped up in bulk, which is the only realistic path for high-volume
// resale flips. Drew's request: hide the non-bulk rows by default when the
// checkbox is on.
const canBuyInBulk = (type: string | undefined, subType: string | undefined): boolean => {
  if (!type) return true
  if (type === 'Armor') return false
  if (type === 'Weapon' && subType !== 'Temporary') return false
  return true
}

const Resale = () => {
  const { rows, error, lastFetched } = useResaleScan({ intervalMs: 5000 })
  const loginRequired = useRequiresLogin('/resale')
  const { itemsById } = useItems()

  // useMemo with [] ensures localStorage is read once on mount, not on every render.
  // Indices are passed as initialMin/MaxIndex props to SteppedSlider (mount-only).
  const initialMinProfitIndex = useMemo(
    () => loadSliderIndex('resale:minProfit:v2', DEFAULT_MIN_PROFIT_INDEX, PRICE_RANGE_VALUES),
    [],
  )
  const initialMaxProfitIndex = useMemo(
    () => loadSliderIndex('resale:maxProfit:v2', DEFAULT_MAX_PROFIT_INDEX, PRICE_RANGE_VALUES),
    [],
  )
  const initialMinBuyPriceIndex = useMemo(
    () => loadSliderIndex('resale:minBuyPrice:v2', DEFAULT_MIN_BUY_PRICE_INDEX, PRICE_RANGE_VALUES),
    [],
  )
  const initialMaxBuyPriceIndex = useMemo(
    () => loadSliderIndex('resale:maxBuyPrice:v2', DEFAULT_MAX_BUY_PRICE_INDEX, PRICE_RANGE_VALUES),
    [],
  )
  const initialMinTimeIndex = useMemo(
    () => loadSliderIndex('resale:minTimeMinutes:v2', DEFAULT_MIN_TIME_INDEX, MINUTE_RANGE_VALUES),
    [],
  )
  const initialMaxTimeIndex = useMemo(
    () => loadSliderIndex('resale:maxTimeMinutes:v2', DEFAULT_MAX_TIME_INDEX, MINUTE_RANGE_VALUES),
    [],
  )

  const [minProfit, setMinProfit] = useState(PRICE_RANGE_VALUES[initialMinProfitIndex])
  const [maxProfit, setMaxProfit] = useState(PRICE_RANGE_VALUES[initialMaxProfitIndex])
  const [minBuyPrice, setMinBuyPrice] = useState(PRICE_RANGE_VALUES[initialMinBuyPriceIndex])
  const [maxBuyPrice, setMaxBuyPrice] = useState(PRICE_RANGE_VALUES[initialMaxBuyPriceIndex])
  const [minTimeSinceLastUpdate, setMinTimeSinceLastUpdate] = useState(
    MINUTE_RANGE_VALUES[initialMinTimeIndex],
  )
  const [maxTimeSinceLastUpdate, setMaxTimeSinceLastUpdate] = useState(
    MINUTE_RANGE_VALUES[initialMaxTimeIndex],
  )
  const [applyBuyToTotal, setApplyBuyToTotal] = useState(
    () => localStorage.getItem('resale:applyBuyToTotal:v1') === 'true',
  )

  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState<number | null>(null)

  useEffect(() => {
    if (!lastFetched) return
    const update = () =>
      setSecondsSinceUpdate(Math.floor((Date.now() - lastFetched.getTime()) / 1000))
    update()
    const id = window.setInterval(update, 1000)
    return () => window.clearInterval(id)
  }, [lastFetched])

  const [purchaseOutlet, setPurchaseOutlet] = useState<PurchaseOutlet>(
    () => loadOutlets().purchaseOutlet,
  )
  const [saleOutlet, setSaleOutlet] = useState<SaleOutlet>(() => loadOutlets().saleOutlet)
  const [hideNonBulk, setHideNonBulk] = useState(
    () => localStorage.getItem('resale:hideNonBulk:v1') === 'true',
  )

  const handlePurchaseOutletChange = (
    _: React.MouseEvent<HTMLElement>,
    newOutlet: string | number,
  ) => {
    const newPurchase = newOutlet as PurchaseOutlet
    setPurchaseOutlet(newPurchase)
    localStorage.setItem('resale:purchaseOutlet:v1', newPurchase)
    const disabled = disabledSaleOutlets(newPurchase)
    if (disabled.includes(saleOutlet)) {
      const fallback = saleOutletOptions.find((o) => !disabled.includes(o.value as SaleOutlet))
      if (fallback) {
        setSaleOutlet(fallback.value as SaleOutlet)
        localStorage.setItem('resale:saleOutlet:v1', fallback.value as string)
      }
    }
  }

  const handleSaleOutletChange = (_: React.MouseEvent<HTMLElement>, newOutlet: string | number) => {
    setSaleOutlet(newOutlet as SaleOutlet)
    localStorage.setItem('resale:saleOutlet:v1', newOutlet as string)
  }

  const sortedRows = useMemo(() => {
    if (!rows) return []
    const filtered = hideNonBulk
      ? rows.filter((r) => {
          const item = itemsById[r.itemId]
          return canBuyInBulk(item?.type, item?.subType)
        })
      : rows
    return [...filtered].sort((a, b) => {
      const profitA = getTotalProfit(a, purchaseOutlet, saleOutlet) ?? -Infinity
      const profitB = getTotalProfit(b, purchaseOutlet, saleOutlet) ?? -Infinity
      return profitB - profitA
    })
  }, [rows, hideNonBulk, itemsById, purchaseOutlet, saleOutlet])

  if (loginRequired) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Resale Opportunities
        </Typography>

        <LoginRequired tool="Resale Opportunities" requiredLevel="public" />
      </Box>
    )
  }

  if (!rows) return <Loading message="Loading resale opportunities..." />

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Resale Opportunities
      </Typography>

      <Typography variant="body1" gutterBottom>
        This tool scans the market for profitable resale listings. It looks for items being sold
        below the sell price in the city, allowing you to buy low and sell high.
      </Typography>

      <StaleDataBanner surface="bazaar scan" />

      {secondsSinceUpdate !== null && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Last updated {secondsSinceUpdate}s ago
        </Typography>
      )}

      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
        Filters
      </Typography>

      <FormGroup sx={{ mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={applyBuyToTotal}
              onChange={(e) => {
                const next = e.target.checked
                setApplyBuyToTotal(next)
                localStorage.setItem('resale:applyBuyToTotal:v1', String(next))
              }}
            />
          }
          label="Apply buy-price filter to total bargain (instead of per-item)"
        />
      </FormGroup>

      <Grid container spacing={2} alignItems="center">
        <SteppedSlider
          label="Profit"
          prefixUnit="$"
          suffixUnit=""
          sliderValues={PRICE_RANGE_VALUES}
          initialMinIndex={initialMinProfitIndex}
          initialMaxIndex={initialMaxProfitIndex}
          onValueChange={(lo, hi) => {
            setMinProfit(lo)
            setMaxProfit(hi)
            localStorage.setItem('resale:minProfit:v2', String(lo))
            localStorage.setItem('resale:maxProfit:v2', String(hi))
          }}
        />
        <SteppedSlider
          label={applyBuyToTotal ? 'Total Buy Price' : 'Buy Price'}
          prefixUnit="$"
          suffixUnit=""
          sliderValues={PRICE_RANGE_VALUES}
          initialMinIndex={initialMinBuyPriceIndex}
          initialMaxIndex={initialMaxBuyPriceIndex}
          onValueChange={(lo, hi) => {
            setMinBuyPrice(lo)
            setMaxBuyPrice(hi)
            localStorage.setItem('resale:minBuyPrice:v2', String(lo))
            localStorage.setItem('resale:maxBuyPrice:v2', String(hi))
          }}
        />
        <SteppedSlider
          label="Updated"
          prefixUnit=""
          suffixUnit="minute"
          sliderValues={MINUTE_RANGE_VALUES}
          initialMinIndex={initialMinTimeIndex}
          initialMaxIndex={initialMaxTimeIndex}
          onValueChange={(lo, hi) => {
            setMinTimeSinceLastUpdate(lo)
            setMaxTimeSinceLastUpdate(hi)
            localStorage.setItem('resale:minTimeMinutes:v2', String(lo))
            localStorage.setItem('resale:maxTimeMinutes:v2', String(hi))
          }}
        />
      </Grid>

      <Divider sx={{ my: 2 }} />

      <Typography variant="h6" gutterBottom>
        Options
      </Typography>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ minWidth: '14em' }}>
          <OptionGroup
            options={purchaseOutletOptions}
            selectedOption={purchaseOutlet}
            title="Buy from"
            handleOptionChange={handlePurchaseOutletChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4, md: 3 }} sx={{ minWidth: '18em' }}>
          <OptionGroup
            options={saleOutletOptions}
            selectedOption={saleOutlet}
            title="Sell via"
            disabledValues={disabledSaleOutlets(purchaseOutlet)}
            handleOptionChange={handleSaleOutletChange}
          />
        </Grid>
      </Grid>

      <FormGroup sx={{ mt: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hideNonBulk}
              onChange={(e) => {
                const next = e.target.checked
                setHideNonBulk(next)
                localStorage.setItem('resale:hideNonBulk:v1', String(next))
              }}
            />
          }
          label="Hide non-bulk markets (armour + non-Temporary weapons)"
        />
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      <ResaleItemsTable
        error={error}
        applyBuyToTotal={applyBuyToTotal}
        minBuyPrice={minBuyPrice}
        maxBuyPrice={maxBuyPrice}
        minTimeSinceLastUpdate={minTimeSinceLastUpdate}
        maxTimeSinceLastUpdate={maxTimeSinceLastUpdate}
        minProfit={minProfit}
        maxProfit={maxProfit}
        rows={sortedRows}
        purchaseOutlet={purchaseOutlet}
        saleOutlet={saleOutlet}
      />
    </Box>
  )
}

export default Resale
