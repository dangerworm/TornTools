import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
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
  TextField,
  useMediaQuery,
} from '@mui/material'

import { useUser } from '../hooks/useUser'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { isItemProfitableOnMarket, type Item, type SortableItem } from '../types/items'
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

interface CityMarketItemsTableProps {
  items: Item[]
  showCityPrice?: boolean
  showVendor?: boolean
}

const CityMarketItemsTable = ({
  items,
  showCityPrice = true,
  showVendor = true,
}: CityMarketItemsTableProps) => {
  const isSmallScreen = useMediaQuery((theme: any) => theme.breakpoints.down('md'))
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
        const profit =
          showCityPrice &&
          isItemProfitableOnMarket(item) &&
          item.valueBuyPrice &&
          item.valueMarketPrice
            ? item.valueMarketPrice - item.valueBuyPrice
            : null
        const profitPerCost =
          showCityPrice &&
          isItemProfitableOnMarket(item) &&
          item.valueBuyPrice &&
          item.valueMarketPrice
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
    <Box>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'left' }}>
          <TextField
            fullWidth={isSmallScreen ? true : false}
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{
              mb: { xs: 0, md: 1 },
              mt: 1,
              minWidth: { md: '500px' },
            }}
          />
        </Grid>
      </Grid>

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
                columnKey="valueMarketPrice"
                label="Market Price"
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
