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
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import EmptyState from '../components/EmptyState'
import FilterDrawer from '../components/FilterDrawer'
import LazyLatestMarketPrice from '../components/LazyLatestMarketPrice'
import LazySparkline from '../components/LazySparkline'
import Loading from '../components/Loading'
import SectionHeader from '../components/SectionHeader'
import StatChip from '../components/StatChip'
import TableSortCell from '../components/TableSortCell'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useItems } from '../hooks/useItems'
import { stableSort, getComparator, type SortOrder } from '../lib/comparisons'
import { loadStringArray, saveStringArray } from '../lib/persistence'
import { getFormattedText } from '../lib/textFormat'
import type { Item } from '../types/items'

// Catalogue item augmented with the latest bazaar summary (min price +
// timestamp) so the Bazaar (latest) column can be sorted and tooltipped
// using data we already have in context.
type SortableAllItemsItem = Item & {
  bazaarMinPrice: number | null
  bazaarLastUpdated: string | null
}

const formatRelative = (iso: string | null): string => {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return `${Math.floor(diffHr / 24)}d ago`
}

const formatPrice = (value: number | null | undefined): string =>
  value == null ? '—' : getFormattedText('$', value, '')

const AllItems = () => {
  const { items, loading } = useItems()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>(() =>
    loadStringArray('torntools:all-items:selected-item-types:v1'),
  )
  const [page, setPage] = useState(0)

  useEffect(() => {
    saveStringArray('torntools:all-items:selected-item-types:v1', selectedItemTypes)
  }, [selectedItemTypes])
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [orderBy, setOrderBy] = useState<keyof SortableAllItemsItem>('name')
  const [orderDirection, setOrderDirection] = useState<SortOrder>('asc')

  const itemTypes = useMemo(
    () => Array.from(new Set(items.map((i) => i.type).filter(Boolean))).sort() as string[],
    [items],
  )

  const enriched: SortableAllItemsItem[] = useMemo(
    () =>
      items.map((item) => {
        const summary = bazaarSummaries[item.id]
        return {
          ...item,
          bazaarMinPrice: summary?.minPrice ?? null,
          bazaarLastUpdated: summary?.lastUpdated ?? null,
        }
      }),
    [items, bazaarSummaries],
  )

  const filtered = useMemo(() => {
    const lower = searchTerm.toLowerCase()
    return enriched.filter(
      (item) =>
        (selectedItemTypes.length === 0 || (item.type && selectedItemTypes.includes(item.type))) &&
        (item.name.toLowerCase().includes(lower) ||
          item.type?.toLowerCase().includes(lower) ||
          item.subType?.toLowerCase().includes(lower)),
    )
  }, [enriched, searchTerm, selectedItemTypes])

  const sorted = useMemo(
    () => stableSort(filtered, getComparator(orderDirection, orderBy)),
    [filtered, orderDirection, orderBy],
  )

  const paged = useMemo(
    () => sorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [sorted, page, rowsPerPage],
  )

  const handleSort = (property: keyof SortableAllItemsItem, defaultOrderDirection: SortOrder) => {
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
        Every item in the Torn catalogue. Click a row to open its full details page. Bazaar prices
        use the latest Weav3r scan; market prices and trends lazy-load the 1-day history per row as
        you scroll.
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
                <TableSortCell<SortableAllItemsItem>
                  align="left"
                  columnKey="name"
                  label="Item"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableSortCell<SortableAllItemsItem>
                  align="left"
                  columnKey="type"
                  label="Type"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableSortCell<SortableAllItemsItem>
                  align="right"
                  columnKey="bazaarMinPrice"
                  defaultOrderDirection="desc"
                  label="Bazaar (latest)"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableCell align="center" sx={{ width: 100 }}>
                  Bazaar trend
                </TableCell>
                <TableSortCell<SortableAllItemsItem>
                  align="right"
                  columnKey="valueMarketPrice"
                  defaultOrderDirection="desc"
                  label="Market (latest)"
                  orderBy={orderBy}
                  orderDirection={orderDirection}
                  handleRequestSort={handleSort}
                />
                <TableCell align="center" sx={{ width: 100 }}>
                  Market trend
                </TableCell>
                <TableCell align="center" sx={{ width: 72 }}>
                  Tradable
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((item) => {
                const bazaarTooltip = item.bazaarLastUpdated
                  ? `Latest scan: ${formatRelative(item.bazaarLastUpdated)}`
                  : 'No bazaar scan data'
                return (
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
                    <TableCell align="right">
                      {item.bazaarMinPrice != null ? (
                        <Tooltip title={bazaarTooltip} placement="left">
                          <span>{formatPrice(item.bazaarMinPrice)}</span>
                        </Tooltip>
                      ) : (
                        <span style={{ opacity: 0.5 }}>—</span>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <LazySparkline itemId={item.id} source="Weav3r" />
                    </TableCell>
                    <TableCell align="right">
                      <LazyLatestMarketPrice itemId={item.id} source="Torn" />
                    </TableCell>
                    <TableCell align="center">
                      <LazySparkline itemId={item.id} source="Torn" />
                    </TableCell>
                    <TableCell align="center">
                      {item.isTradable && <StatChip chipVariant="tradable" label="Yes" />}
                    </TableCell>
                  </TableRow>
                )
              })}
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
          variant={
            selectedItemTypes.length === 0 || selectedItemTypes.length === itemTypes.length
              ? 'filled'
              : 'outlined'
          }
          onClick={() =>
            setSelectedItemTypes((prev) => (prev.length === itemTypes.length ? [] : [...itemTypes]))
          }
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
