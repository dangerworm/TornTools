import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  tablePaginationClasses as classes,
  TableRow,
} from '@mui/material'

import { useUser } from '../hooks/useUser'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { SALE_TAX } from '../lib/profitCalculations'
import { type Item, type SortableItem } from '../types/items'
import type { SaleOutlet } from '../types/markets'
import CityMarketItemsTableRow from './CityMarketItemsTableRow'
import TableSortCell from './TableSortCell'

const CustomTablePagination = styled(TablePagination)`
  & .${classes.toolbar} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    flex-direction: row;
    align-items: center;
  }

  & .${classes.selectLabel} {
    margin: 0;
  }

  & .${classes.displayedRows} {
    margin: 0;

    @media (min-width: 768px) {
      margin-left: auto;
    }
  }

  & .${classes.spacer} {
    display: none;
  }

  & .${classes.actions} {
    display: flex;
    gap: 0.25rem;
  }
`

const saleOutletLabel: Record<SaleOutlet, string> = {
  city: 'City Sell Price',
  bazaar: 'Bazaar Price',
  market: 'Market Price (5%)',
  anonymousMarket: 'Market Price (15%)',
}

interface CityMarketItemsTableProps {
  items: Item[]
  searchTerm: string
  showCityPrice?: boolean
  showVendor?: boolean
  saleOutlet: SaleOutlet
}

const CityMarketItemsTable = ({
  items,
  searchTerm,
  showCityPrice = true,
  showVendor = true,
  saleOutlet,
}: CityMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [orderBy, setOrderBy] = useState<keyof SortableItem>('name')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const handleRequestSort = (property: keyof SortableItem, defaultOrderDirection: SortOrder) => {
    console.log('property:', property)

    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc ? 'desc' : !isSelected ? defaultOrderDirection : 'asc')
    setOrderBy(property)
    setPage(0)
  }

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()
    return items
      .filter(
        (item) =>
          item.name.toLowerCase().includes(lowerSearchTerm) ||
          item.type?.toLowerCase().includes(lowerSearchTerm) ||
          item.subType?.toLowerCase().includes(lowerSearchTerm) ||
          item.valueVendorName?.toLowerCase().includes(lowerSearchTerm),
      )
      .map((item) => {
        const grossSellPrice =
          saleOutlet === 'bazaar'
            ? (bazaarSummaries[item.id]?.minPrice ?? null)
            : (item.valueMarketPrice ?? null)
        const sellPrice =
          grossSellPrice != null ? Math.floor(grossSellPrice * (1 - SALE_TAX[saleOutlet])) : null
        const profit =
          showCityPrice && item.valueBuyPrice && sellPrice !== null
            ? sellPrice - item.valueBuyPrice
            : null
        const profitPerCost =
          showCityPrice && item.valueBuyPrice && profit !== null
            ? profit / item.valueBuyPrice
            : null
        return { ...item, sellPrice, grossSellPrice, profit, profitPerCost } as SortableItem
      })
  }, [items, searchTerm, saleOutlet, showCityPrice, bazaarSummaries])

  const sortedItems = useMemo(
    () => stableSort(filteredItems, getComparator(orderDirection, orderBy)),
    [filteredItems, orderDirection, orderBy],
  )

  const pagedItems = useMemo(
    () => sortedItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [sortedItems, page, rowsPerPage],
  )

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= filteredItems.length) {
      setPage(Math.max(0, Math.ceil(filteredItems.length / rowsPerPage) - 1))
    }
  }, [filteredItems, page, rowsPerPage])

  return (
    <Box>
      <TableContainer component={Paper}>
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

              <TableSortCell<SortableItem>
                align="left"
                columnKey={'name'}
                label="Item"
                orderBy={orderBy}
                orderDirection={orderDirection}
                handleRequestSort={handleRequestSort}
              />

              {showVendor ? (
                <TableSortCell<SortableItem>
                  align="left"
                  columnKey="valueVendorName"
                  label="Vendor"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
              ) : (
                <TableCell align="left" sx={{ width: 48 }}>
                  Type
                </TableCell>
              )}

              {showCityPrice ? (
                <TableSortCell<SortableItem>
                  align="right"
                  columnKey="valueBuyPrice"
                  label="City Price"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
              ) : (
                <TableCell align="left" sx={{ width: 48 }}>
                  Subtype
                </TableCell>
              )}

              <TableSortCell<SortableItem>
                align="right"
                columnKey="sellPrice"
                label={saleOutletLabel[saleOutlet]}
                orderBy={orderBy}
                orderDirection={orderDirection}
                handleRequestSort={handleRequestSort}
              />

              {showCityPrice ? (
                <TableSortCell<SortableItem>
                  align="right"
                  columnKey="profit"
                  defaultOrderDirection="desc"
                  label="Profit"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
              ) : (
                <TableCell align="right" sx={{ width: 48 }}>
                  Circulation
                </TableCell>
              )}

              {showCityPrice && (
                <TableSortCell<SortableItem>
                  align="right"
                  columnKey="profitPerCost"
                  defaultOrderDirection="desc"
                  label="Ratio"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
              )}

              <TableCell align="center">Torn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagedItems.map((item) => (
              <CityMarketItemsTableRow
                key={item.id}
                item={item}
                showVendor={showVendor}
                showCityPrice={showCityPrice}
                saleOutlet={saleOutlet}
              />
            ))}
            <TableRow>
              <CustomTablePagination
                colSpan={10}
                count={filteredItems.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(parseInt(event.target.value, 10))
                  setPage(0)
                }}
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default CityMarketItemsTable
