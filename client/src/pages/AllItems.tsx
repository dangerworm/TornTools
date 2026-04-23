import {
  Box,
  Chip,
  Divider,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import EmptyState from '../components/EmptyState'
import FilterDrawer from '../components/FilterDrawer'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import StatChip from '../components/StatChip'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { useItems } from '../hooks/useItems'
import TableSortCell from '../components/TableSortCell'
import type { Item } from '../types/items'

const AllItems = () => {
  const { items, loading } = useItems()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [orderBy, setOrderBy] = useState<keyof Item>('name')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const itemTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.type).filter(Boolean))).sort() as string[],
    [items],
  )

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return items.filter(
      (item) =>
        (selectedItemTypes.length === 0 || (item.type && selectedItemTypes.includes(item.type))) &&
        (item.name.toLowerCase().includes(lower) ||
          item.type?.toLowerCase().includes(lower) ||
          item.subType?.toLowerCase().includes(lower)),
    )
  }, [items, searchTerm, selectedItemTypes])

  const sorted = useMemo(
    () => stableSort(filtered, getComparator(orderDirection, orderBy)),
    [filtered, orderDirection, orderBy],
  )

  const paged = useMemo(
    () => sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [sorted, page, rowsPerPage],
  )

  const handleSort = (property: keyof Item, defaultOrderDirection: SortOrder) => {
    const isSelected = orderBy === property
    const isAsc = orderDirection === 'asc'
    setOrderDirection(isSelected && isAsc ? 'desc' : !isSelected ? defaultOrderDirection : 'asc')
    setOrderBy(property)
    setPage(0)
  }

  const activeCount =
    (selectedItemTypes.length > 0 ? 1 : 0) + (searchTerm.trim().length > 0 ? 1 : 0)

  if (loading && items.length === 0) {
    return <Loading message="Loading items..." />
  }

  const mainContent = (
    <Box>
      <Typography variant="h4" gutterBottom>
        All Items
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Every item in the Torn catalogue. Click a row to open its full details page.
      </Typography>

      {sorted.length === 0 ? (
        <EmptyState
          title="No items match"
          message="Try clearing a filter or broadening your search."
        />
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableSortCell<Item>
                  align="left"
                  columnKey="name"
                  label="Item"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableSortCell<Item>
                  align="left"
                  columnKey="type"
                  label="Type"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableSortCell<Item>
                  align="left"
                  columnKey="subType"
                  label="Sub-type"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableCell align="center">Tradable</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>
                    {item.image ? (
                      <Box
                        sx={{
                          alignItems: 'center',
                          display: 'flex',
                          height: 32,
                          justifyContent: 'center',
                          width: 32,
                        }}
                      >
                        <Box
                          component="img"
                          src={item.image}
                          alt={item.name}
                          sx={{
                            display: 'block',
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </Box>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Link component={RouterLink} to={`/item/${item.id}`}>
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{item.type ?? ''}</TableCell>
                  <TableCell>{item.subType ?? ''}</TableCell>
                  <TableCell align="center">
                    {item.isTradable && <StatChip chipVariant="tradable" label="Yes" />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
            onRowsPerPageChange={(event) => {
              const value = parseInt(event.target.value, 10)
              setRowsPerPage(value > 0 ? value : filtered.length)
              setPage(0)
            }}
          />
        </TableContainer>
      )}
    </Box>
  )

  const filterPanel = (
    <>
      <TextField
        label="Search"
        variant="outlined"
        size="small"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        fullWidth
      />

      <Divider sx={{ my: 2 }} />

      <SectionHeader variant="subtitle2" hairline={false}>
        Item types
      </SectionHeader>
      <Box>
        <Chip
          label="All"
          size="small"
          variant={selectedItemTypes.length === 0 ? 'filled' : 'outlined'}
          onClick={() => setSelectedItemTypes([])}
          sx={{ mb: 0.5, mr: 0.5 }}
        />
        {itemTypes.map((type) => (
          <Chip
            key={type}
            label={type}
            size="small"
            color="primary"
            variant={selectedItemTypes.includes(type) ? 'filled' : 'outlined'}
            onClick={() => {
              setSelectedItemTypes((prev) =>
                prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
              )
            }}
            sx={{ mb: 0.5, mr: 0.5 }}
          />
        ))}
      </Box>
    </>
  )

  return (
    <FilterDrawer activeCount={activeCount} main={mainContent}>
      {filterPanel}
    </FilterDrawer>
  )
}

export default AllItems
