import { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useUser } from '../hooks/useUser'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { SALE_TAX } from '../lib/profitCalculations'
import { type ForeignStockItem, type SortableForeignStockItem } from '../types/foreignStockItems'
import type { SaleOutlet } from '../types/markets'
import ForeignMarketItemsTableRow from './ForeignMarketItemsTableRow'
import TableSortCell from './TableSortCell'

const sellColumnLabel: Record<SaleOutlet, string> = {
  city: 'Sell (City)',
  bazaar: 'Sell (Bazaar)',
  market: 'Sell (Mkt 5%)',
  anonymousMarket: 'Sell (Anon 15%)',
}

interface ForeignMarketItemsTableProps {
  items: ForeignStockItem[]
  saleOutlet: SaleOutlet
  showCountry?: boolean
}

const ForeignMarketItemsTable = ({
  items,
  saleOutlet,
  showCountry = false,
}: ForeignMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [orderBy, setOrderBy] = useState<keyof SortableForeignStockItem>('itemName')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const handleRequestSort = (
    property: keyof SortableForeignStockItem,
    defaultOrderDirection: SortOrder,
  ) => {
    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc ? 'desc' : !isSelected ? defaultOrderDirection : 'asc')
    setOrderBy(property)
  }

  const sortableItems = useMemo(
    () =>
      items.map((item) => {
        const grossSellPrice =
          saleOutlet === 'bazaar'
            ? (bazaarSummaries[item.itemId]?.minPrice ?? null)
            : (item.item.valueMarketPrice ?? null)
        const sellPrice =
          grossSellPrice != null ? Math.floor(grossSellPrice * (1 - SALE_TAX[saleOutlet])) : null
        return {
          ...item,
          itemType: item.item.type,
          sellPrice,
          grossSellPrice,
          profit: sellPrice != null ? sellPrice - item.cost : null,
        } as SortableForeignStockItem
      }),
    [items, saleOutlet, bazaarSummaries],
  )

  const sortedItems = useMemo(
    () => stableSort(sortableItems, getComparator(orderDirection, orderBy)),
    [sortableItems, orderDirection, orderBy],
  )

  return (
    <>
      <Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Info</TableCell>
                {dotNetUserDetails && <TableCell align="center">Fav</TableCell>}
                <TableSortCell<SortableForeignStockItem>
                  columnKey="itemName"
                  label="Item"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<SortableForeignStockItem>
                  columnKey="itemType"
                  label="Type"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                {showCountry && (
                  <TableSortCell<SortableForeignStockItem>
                    columnKey="country"
                    label="Country"
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                    handleRequestSort={handleRequestSort}
                  />
                )}
                <TableSortCell<SortableForeignStockItem>
                  align="right"
                  columnKey="cost"
                  label="Buy Price"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<SortableForeignStockItem>
                  align="right"
                  columnKey="sellPrice"
                  label={sellColumnLabel[saleOutlet]}
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<SortableForeignStockItem>
                  align="right"
                  columnKey="profit"
                  defaultOrderDirection="desc"
                  label="Profit"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<SortableForeignStockItem>
                  align="right"
                  columnKey="quantity"
                  defaultOrderDirection="desc"
                  label="Available"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<SortableForeignStockItem>
                  align="right"
                  columnKey="lastUpdated"
                  defaultOrderDirection="desc"
                  label="Last Updated"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableCell align="center">Torn</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedItems.map((item) => (
                <ForeignMarketItemsTableRow
                  key={`${item.itemId}-${item.country}`}
                  item={item}
                  showCountry={showCountry}
                  saleOutlet={saleOutlet}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default ForeignMarketItemsTable
