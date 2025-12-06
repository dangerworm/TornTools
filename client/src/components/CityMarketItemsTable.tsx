import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
} from '@mui/material'
import { useUser } from '../hooks/useUser'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { isItemProfitableOnMarket, type Item, type SortableItem } from '../types/items'
import CityMarketItemsTableRow from './CityMarketItemsTableRow'
import TableSortCell from './TableSortCell'

interface LocalMarketItemsTableProps {
  items: Item[]
  showCityPrice?: boolean
  showVendor?: boolean
}

const CityMarketItemsTable = ({
  items,
  showCityPrice = true,
  showVendor = true,
}: LocalMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser()

  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<keyof SortableItem>('name')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const handleRequestSort = (property: keyof SortableItem, defaultOrderDirection: SortOrder) => {
    console.log('property:', property)

    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc 
      ? 'desc' 
      : !isSelected 
        ? defaultOrderDirection 
        : 'asc')
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
        const profit =
          showCityPrice && isItemProfitableOnMarket(item) && item.valueBuyPrice && item.valueMarketPrice
            ? item.valueMarketPrice - item.valueBuyPrice
            : null
        const profitPerCost =
          showCityPrice && isItemProfitableOnMarket(item) && item.valueBuyPrice && item.valueMarketPrice
            ? (item.valueMarketPrice - item.valueBuyPrice) / item.valueBuyPrice
            : null
        return { ...item, profit, profitPerCost } as SortableItem
      })
  }, [items, searchTerm])

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
    <>
      <Box>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'left' }}>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 400, mt: 1 }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: 'right' }}>
            <TablePagination
              component="div"
              count={filteredItems.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10))
                setPage(0)
              }}
              sx={{ ml: 0 }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell align="center">Info</TableCell>

                {dotNetUserDetails && <TableCell align="center">Fav</TableCell>}

                <TableSortCell<SortableItem>
                  align="left"
                  columnKey={'name'}
                  label="Item"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />

                <TableSortCell<SortableItem>
                  align="left"
                  columnKey={'type'}
                  label="Type"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />

                {showVendor && (
                  <TableSortCell<SortableItem>
                    align="left"
                    columnKey="valueVendorName"
                    label="Vendor"
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                    handleRequestSort={handleRequestSort}
                  />
                )}

                {showCityPrice && (
                  <TableSortCell<SortableItem>
                    align="right"
                    columnKey="valueBuyPrice"
                    label="City Price"
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                    handleRequestSort={handleRequestSort}
                  />
                )}

                <TableSortCell<SortableItem>
                  align="right"
                  columnKey="valueMarketPrice"
                  label="Market Price"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />

                {showCityPrice && (
                  <TableSortCell<SortableItem>
                    align="right"
                    columnKey="profit"
                    defaultOrderDirection="desc"
                    label="Profit"
                    orderBy={orderBy}
                    orderDirection={orderDirection}
                    handleRequestSort={handleRequestSort}
                  />
                )}

                {showCityPrice && (
                  <TableSortCell<SortableItem>
                    align="right"
                    columnKey="profitPerCost"
                    defaultOrderDirection="desc"
                    label="Profit/Cost"
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
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default CityMarketItemsTable
