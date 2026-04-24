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
import { useMemo, useState } from 'react'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useUser } from '../hooks/useUser'
import { getComparator, stableSort, type SortOrder } from '../lib/comparisons'
import { type Item } from '../types/items'
import FavouriteItemsTableRow from './FavouriteMarketsTableRow'
import TableSortCell from './TableSortCell'

interface FavouriteItemsTableProps {
  items: Item[]
}

interface SortableFavouriteItem {
  item: Item
  itemName: string
  itemType: string
  bazaarPrice: number | null
}

const FavouriteMarketsTable = ({ items }: FavouriteItemsTableProps) => {
  const { dotNetUserDetails } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [orderBy, setOrderBy] = useState<keyof SortableFavouriteItem>('itemName')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const handleRequestSort = (
    property: keyof SortableFavouriteItem,
    defaultOrderDirection: SortOrder,
  ) => {
    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc ? 'desc' : !isSelected ? defaultOrderDirection : 'asc')
    setOrderBy(property)
  }

  const sortableItems = useMemo<SortableFavouriteItem[]>(
    () =>
      items.map((item) => ({
        item,
        itemName: item.name ?? '',
        itemType: item.type ?? '',
        bazaarPrice: bazaarSummaries[item.id]?.minPrice ?? null,
      })),
    [items, bazaarSummaries],
  )

  const sortedItems = useMemo(
    () => stableSort(sortableItems, getComparator(orderDirection, orderBy)),
    [sortableItems, orderDirection, orderBy],
  )

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>
                Info
              </TableCell>
              {dotNetUserDetails && (
                <TableCell align="center" sx={{ width: 48 }}>
                  Fav
                </TableCell>
              )}
              <TableSortCell<SortableFavouriteItem>
                columnKey="itemName"
                label="Item"
                orderBy={orderBy}
                orderDirection={orderDirection}
                handleRequestSort={handleRequestSort}
              />
              <TableSortCell<SortableFavouriteItem>
                columnKey="itemType"
                label="Type"
                orderBy={orderBy}
                orderDirection={orderDirection}
                handleRequestSort={handleRequestSort}
              />
              <TableSortCell<SortableFavouriteItem>
                align="right"
                columnKey="bazaarPrice"
                defaultOrderDirection="desc"
                label="Bazaar (latest)"
                orderBy={orderBy}
                orderDirection={orderDirection}
                handleRequestSort={handleRequestSort}
              />
              <TableCell align="center" sx={{ width: 100 }}>
                Bazaar trend
              </TableCell>
              <TableCell align="right">Market (latest)</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>
                Market trend
              </TableCell>
              <TableCell align="center" sx={{ width: 48 }}>
                Item Page
              </TableCell>
              <TableCell align="center" sx={{ width: 48 }}>
                Torn
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedItems.map(({ item }) => (
              <FavouriteItemsTableRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default FavouriteMarketsTable
