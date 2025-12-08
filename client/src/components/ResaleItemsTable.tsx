import { useRef } from 'react'
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
import ResaleItemsTableRow from './ResaleItemsTableRow'


interface MarketItemsTableProps {
  rows: ProfitableListing[]
  minProfit?: number
  maxBuyPrice?: number
  maxTimeSinceLastUpdate?: number
  error: string | null
  sellPriceColumnNameOverride?: string
}

const ResaleItemsTable = ({
  rows,
  minProfit = 500,
  maxBuyPrice = 500000,
  maxTimeSinceLastUpdate = 5,
  error,
  sellPriceColumnNameOverride = 'Sell',
}: MarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser()

  const seenIdsRef = useRef<Set<number | string>>(new Set())

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
              {rows
                .filter(
                  (r) =>
                    r.profit >= minProfit &&
                    r.maxPrice <= maxBuyPrice &&
                    getSecondsSinceLastUpdate(r.lastUpdated) <= maxTimeSinceLastUpdate * 60,
                )
                .map((r) => {
                  const seenIds = seenIdsRef.current
                  const isNew = !seenIds.has(r.itemId)
                  if (isNew) {
                    seenIds.add(r.itemId)
                  }
                  return <ResaleItemsTableRow key={r.itemId} isNew={isNew} row={r} />
                })}
            </AnimatePresence>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default ResaleItemsTable
