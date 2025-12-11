import { useMemo, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
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
import { useUser } from '../hooks/useUser'
import { getSecondsSinceLastUpdate } from '../lib/time'
import type { ProfitableListing } from '../types/profitableListings'
import type { SaleOutlet, TaxType } from '../types/markets'
import ResaleItemsTableRow from './ResaleItemsTableRow'

interface ResaleItemsTableProps {
  rows: ProfitableListing[]
  minProfit?: number
  maxBuyPrice?: number
  maxTimeSinceLastUpdate?: number
  error: string | null
  sellPriceColumnNameOverride?: string
  saleOutlet: SaleOutlet
  taxType: TaxType
}

const ResaleItemsTable = ({
  error,
  maxBuyPrice = 500000,
  maxTimeSinceLastUpdate = 5,
  minProfit = 500,
  rows,
  sellPriceColumnNameOverride = 'Sell',
  saleOutlet,
  taxType,
}: ResaleItemsTableProps) => {
  const { dotNetUserDetails } = useUser()

  const seenIdsRef = useRef<Set<number | string>>(new Set())

  const filteredRows = useMemo(() => rows.filter(
    (r) =>
      (saleOutlet === 'city' 
        ? minProfit === 0 || r.cityProfit >= minProfit 
        : minProfit === 0 || r.marketProfit(taxType) >= minProfit) &&
      r.maxPrice <= maxBuyPrice &&
      getSecondsSinceLastUpdate(r.lastUpdated) <= maxTimeSinceLastUpdate * 60,
  ), [rows, minProfit, maxBuyPrice, maxTimeSinceLastUpdate, saleOutlet, taxType]);

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
              <TableCell align="right">Buy</TableCell>
              <TableCell align="right">{sellPriceColumnNameOverride}</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Profit</TableCell>
              <TableCell align="right">Updated</TableCell>
              <TableCell align="right">Item</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <AnimatePresence initial={false}>
              {filteredRows
                .map((r) => {
                  const seenIds = seenIdsRef.current
                  const isNew = !seenIds.has(r.itemId)
                  if (isNew) {
                    seenIds.add(r.itemId)
                  }
                  return (
                    <ResaleItemsTableRow
                      key={r.itemId}
                      isNew={isNew}
                      row={r}
                      saleOutlet={saleOutlet}
                      taxType={taxType}
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
