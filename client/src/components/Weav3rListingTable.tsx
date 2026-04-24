import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  tablePaginationClasses as classes,
  TableRow,
  TextField,
  styled,
  useMediaQuery,
} from '@mui/material'
import { getComparator, stableSort, type SortOrder } from '../lib/comparisons'
import type { Weav3rMarketplaceListing, Weav3rMarketplacePayload } from '../types/weav3r'
import TableSortCell from './TableSortCell'
import Weav3rListingTableRow from './Weav3rListingTableRow'

const CustomTablePagination = styled(TablePagination)`
  & .${classes.toolbar} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    flex-direction: row;
    align-items: center;
    margin-left: -0.5em;
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

interface Weav3rMarketTableProps {
  payload: Weav3rMarketplacePayload
}

const Weav3rMarketTable = ({ payload }: Weav3rMarketTableProps) => {
  const isSmallScreen = useMediaQuery((theme: any) => theme.breakpoints.down('md'))
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<keyof Weav3rMarketplaceListing>('price')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const handleRequestSort = (
    property: keyof Weav3rMarketplaceListing,
    defaultOrderDirection: SortOrder,
  ) => {
    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc ? 'desc' : !isSelected ? defaultOrderDirection : 'asc')
    setOrderBy(property)
  }

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()

    const distinctListings = payload.listings
      .filter(
        (item, index, array) =>
          index ===
          array.findIndex((t) => t.player_id === item.player_id && t.price === item.price),
      )
      .map((item) => ({
        ...item,
        quantity: payload.listings
          .filter((listing) => listing.player_id === item.player_id && listing.price === item.price)
          .reduce((sum, listing) => sum + listing.quantity, 0),
      }))

    return distinctListings.filter(
      (item) =>
        item.player_id?.toString().includes(lowerSearchTerm) ||
        item.player_name.toLowerCase().includes(lowerSearchTerm),
    )
  }, [payload, searchTerm])

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
        <TextField
          fullWidth={isSmallScreen ? true : false}
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{
            mb: { xs: 0, md: 2 },
            mt: -1,
            minWidth: { md: '500px' },
          }}
        />

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableSortCell<Weav3rMarketplaceListing>
                  columnKey="player_name"
                  label="Player"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<Weav3rMarketplaceListing>
                  align="right"
                  columnKey="quantity"
                  defaultOrderDirection="desc"
                  label="Quantity"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<Weav3rMarketplaceListing>
                  align="right"
                  columnKey="price"
                  label="Price"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<Weav3rMarketplaceListing>
                  align="right"
                  columnKey="last_checked"
                  defaultOrderDirection="desc"
                  label="Last Checked"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
                <TableSortCell<Weav3rMarketplaceListing>
                  align="right"
                  columnKey="content_updated"
                  defaultOrderDirection="desc"
                  label="Last Updated"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleRequestSort}
                />
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <Weav3rListingTableRow key={`${item.player_id}-${item.price}`} item={item} />
              ))}
              <TableRow>
                <CustomTablePagination
                  colSpan={5}
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
    </>
  )
}

export default Weav3rMarketTable
