import {
  Alert,
  AlertTitle,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { AnimatePresence } from 'framer-motion'
import { useMemo, useRef } from 'react'
import { useUser } from '../hooks/useUser'
import { getBuyPriceRange, getLastUpdated, getTotalProfit } from '../lib/profitCalculations'
import { getSecondsSinceLastUpdate } from '../lib/time'
import type { PurchaseOutlet, SaleOutlet } from '../types/markets'
import type { ProfitableListing } from '../types/profitableListings'
import ResaleItemsTableRow from './ResaleItemsTableRow'

interface ResaleItemsTableProps {
  rows: ProfitableListing[]
  minProfit?: number
  maxBuyPrice?: number
  maxTimeSinceLastUpdate?: number
  error: string | null
  purchaseOutlet: PurchaseOutlet
  saleOutlet: SaleOutlet
}

const purchaseOutletLabel: Record<PurchaseOutlet, string> = {
  city: 'Buy (City)',
  bazaar: 'Buy (Bazaar)',
  market: 'Buy (Market)',
}

const saleOutletLabel: Record<SaleOutlet, string> = {
  city: 'Sell (City)',
  bazaar: 'Sell (Bazaar)',
  market: 'Sell (Mkt 5%)',
  anonymousMarket: 'Sell (Anon 15%)',
}

const ResaleItemsTable = ({
  error,
  maxBuyPrice = 500000,
  maxTimeSinceLastUpdate = 5,
  minProfit = 500,
  rows,
  purchaseOutlet,
  saleOutlet,
}: ResaleItemsTableProps) => {
  const { dotNetUserDetails } = useUser()
  const seenIdsRef = useRef<Set<number | string>>(new Set())

  const filteredRows = useMemo(
    () =>
      rows.filter((r) => {
        const totalProfit = getTotalProfit(r, purchaseOutlet, saleOutlet)
        if (totalProfit === null) return false

        const buyPriceRange = getBuyPriceRange(r, purchaseOutlet, saleOutlet)
        if (buyPriceRange === null || buyPriceRange.min > maxBuyPrice) return false

        if (minProfit > 0 && totalProfit < minProfit) return false

        const lastUpdated = getLastUpdated(r, purchaseOutlet)
        if (
          lastUpdated !== null &&
          getSecondsSinceLastUpdate(lastUpdated) > maxTimeSinceLastUpdate * 60 * 60
        )
          return false

        return true
      }),
    [rows, minProfit, maxBuyPrice, maxTimeSinceLastUpdate, purchaseOutlet, saleOutlet],
  )

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
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {dotNetUserDetails && <TableCell>Fav</TableCell>}
              <TableCell>Item</TableCell>
              <TableCell align="right">{purchaseOutletLabel[purchaseOutlet]}</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">{saleOutletLabel[saleOutlet]}</TableCell>
              <TableCell align="right">Profit</TableCell>
              <TableCell align="right">Updated</TableCell>
              <TableCell align="right">Item</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence initial={false}>
              {filteredRows.map((r) => {
                const seenIds = seenIdsRef.current
                const isNew = !seenIds.has(r.itemId)
                if (isNew) seenIds.add(r.itemId)
                return (
                  <ResaleItemsTableRow
                    key={r.itemId}
                    isNew={isNew}
                    row={r}
                    purchaseOutlet={purchaseOutlet}
                    saleOutlet={saleOutlet}
                  />
                )
              })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ResaleItemsTable
