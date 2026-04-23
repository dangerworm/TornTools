import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import {
  Alert,
  AlertTitle,
  Avatar,
  Box,
  Chip,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router'
import Loading from '../components/Loading'
import LoginRequiredForToken from '../components/LoginRequiredForToken'
import {
  BAZAAR_CATEGORIES,
  BAZAAR_MIN_ACCESS_LEVEL,
  type BazaarCategory,
} from '../constants/bazaarCategories'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import { fetchTornInventory, type TornInventoryItem } from '../lib/tornapi'

interface CategoryState {
  loading: boolean
  error: string | null
  items: TornInventoryItem[] | null
}

interface AggregatedRow {
  id: number
  name: string
  totalQuantity: number
  image?: string | null
}

const aggregate = (items: TornInventoryItem[]): AggregatedRow[] => {
  const byId = new Map<number, AggregatedRow>()
  for (const item of items) {
    if (item.equipped || item.faction_owned) continue
    const existing = byId.get(item.id)
    if (existing) {
      existing.totalQuantity += item.amount
    } else {
      byId.set(item.id, { id: item.id, name: item.name, totalQuantity: item.amount })
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name))
}

const formatPrice = (price: number) => `$${price.toLocaleString()}`

const formatRelativeTime = (iso: string): string => {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'unknown'
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

const BazaarPriceLookup = () => {
  const { apiKey, dotNetUserDetails } = useUser()
  const { itemsById } = useItems()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [selected, setSelected] = useState<BazaarCategory | null>(null)
  const [byCategory, setByCategory] = useState<Record<string, CategoryState>>({})
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [copiedSuggestedId, setCopiedSuggestedId] = useState<number | null>(null)

  const loadCategory = useCallback(
    async (category: BazaarCategory) => {
      if (!apiKey) {
        setByCategory((prev) => ({
          ...prev,
          [category.cat]: {
            loading: false,
            error: 'No API key available. Please sign out and sign in again.',
            items: null,
          },
        }))
        return
      }
      setByCategory((prev) => ({
        ...prev,
        [category.cat]: { loading: true, error: null, items: prev[category.cat]?.items ?? null },
      }))
      try {
        const payload = await fetchTornInventory(apiKey, category.cat)
        setByCategory((prev) => ({
          ...prev,
          [category.cat]: {
            loading: false,
            error: null,
            items: payload.inventory?.items ?? [],
          },
        }))
      } catch (e) {
        setByCategory((prev) => ({
          ...prev,
          [category.cat]: {
            loading: false,
            error: e instanceof Error ? e.message : 'Failed to load inventory',
            items: null,
          },
        }))
      }
    },
    [apiKey],
  )

  const handleSelect = (category: BazaarCategory) => {
    setSelected(category)
    if (!byCategory[category.cat]) {
      void loadCategory(category)
    }
  }

  const handleCopy = async (id: number, price: number) => {
    try {
      await navigator.clipboard.writeText(String(price))
      setCopiedId(id)
      window.setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 1200)
    } catch {
      // clipboard not available - silently ignore
    }
  }

  const handleCopySuggested = async (id: number, price: number) => {
    try {
      await navigator.clipboard.writeText(String(price))
      setCopiedSuggestedId(id)
      window.setTimeout(
        () => setCopiedSuggestedId((current) => (current === id ? null : current)),
        1200,
      )
    } catch {
      // clipboard not available - silently ignore
    }
  }

  const suggestedPrice = (minPrice: number): number =>
    Math.max(1, 10 * (Math.floor(minPrice / 10) - 1) + 9)

  const currentState = selected ? byCategory[selected.cat] : undefined
  const aggregatedRows = useMemo(
    () => (currentState?.items ? aggregate(currentState.items) : []),
    [currentState],
  )

  // Login guard
  if (!dotNetUserDetails) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Bazaar Price Lookup
        </Typography>
        <LoginRequiredForToken />
      </Box>
    )
  }

  // Access-level guard
  if ((dotNetUserDetails.accessLevel ?? 1) < BAZAAR_MIN_ACCESS_LEVEL) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Bazaar Price Lookup
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Minimal access required</AlertTitle>
          <Typography variant="body1" gutterBottom>
            This page reads your personal Torn inventory, which requires a key with at least
            <strong> Minimal</strong> access. Your current key is Public-only.
          </Typography>
          <Typography variant="body1" gutterBottom>
            To upgrade, generate a new Minimal-access key on your{' '}
            <Link
              href="https://www.torn.com/preferences.php#tab=api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Torn API preferences page
            </Link>{' '}
            and{' '}
            <Link component={RouterLink} to="/signin">
              sign in again
            </Link>{' '}
            with it.
          </Typography>
        </Alert>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Bazaar Price Lookup
      </Typography>

      <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
        Pick a category to load that slice of your inventory. Each item shows the current lowest
        Weav3r bazaar listing - click the price to copy it to your clipboard, then paste it into
        Torn's "Add items to your Bazaar" page.
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 3 }}>
        {BAZAAR_CATEGORIES.map((category) => {
          const state = byCategory[category.cat]
          const isSelected = selected?.cat === category.cat
          return (
            <Chip
              key={category.cat}
              label={category.label}
              color="primary"
              variant={isSelected ? 'filled' : 'outlined'}
              onClick={() => handleSelect(category)}
              disabled={state?.loading}
            />
          )
        })}
      </Stack>

      {!selected && <Alert severity="info">Select a category above to load your inventory.</Alert>}

      {selected && currentState?.loading && <Loading message={`Loading your ${selected.label}…`} />}

      {selected && currentState?.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Couldn't load inventory</AlertTitle>
          <Typography variant="body1">{currentState.error}</Typography>
        </Alert>
      )}

      {selected && currentState && !currentState.loading && !currentState.error && (
        <>
          {aggregatedRows.length === 0 ? (
            <Alert severity="info">
              No sellable {selected.label.toLowerCase()} items found in your inventory.
              {currentState.items && currentState.items.length > 0 && (
                <> (Equipped or faction-owned items are excluded.)</>
              )}
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell />
                    <TableCell>Item</TableCell>
                    <TableCell align="right">Qty</TableCell>
                    <TableCell align="right">Lowest Bazaar Price</TableCell>
                    <TableCell align="right">Suggested Price</TableCell>
                    <TableCell>Last seen</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {aggregatedRows.map((row) => {
                    const itemMeta = itemsById[row.id]
                    const summary = bazaarSummaries[row.id]
                    return (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          {itemMeta?.image ? (
                            <Avatar
                              src={itemMeta.image}
                              alt={row.name}
                              variant="square"
                              sx={{ width: 32, height: 32 }}
                            />
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <Link component={RouterLink} to={`/item/${row.id}`}>
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell align="right">{row.totalQuantity.toLocaleString()}</TableCell>
                        <TableCell align="right">
                          {summary ? (
                            <Tooltip
                              title={copiedId === row.id ? 'Copied!' : 'Click to copy'}
                              placement="left"
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(row.id, summary.minPrice)}
                                sx={{ fontSize: '0.875rem', borderRadius: 1, px: 1 }}
                              >
                                {formatPrice(summary.minPrice)}
                                <ContentCopyIcon sx={{ fontSize: '0.875rem', ml: 0.5 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                            >
                              No bazaar data
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {summary ? (
                            <Tooltip
                              title={copiedSuggestedId === row.id ? 'Copied!' : 'Click to copy'}
                              placement="left"
                            >
                              <IconButton
                                size="small"
                                onClick={() =>
                                  handleCopySuggested(row.id, suggestedPrice(summary.minPrice))
                                }
                                sx={{ fontSize: '0.875rem', borderRadius: 1, px: 1 }}
                              >
                                {formatPrice(suggestedPrice(summary.minPrice))}
                                <ContentCopyIcon sx={{ fontSize: '0.875rem', ml: 0.5 }} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Typography
                              variant="body1"
                              sx={{ color: 'text.disabled', fontStyle: 'italic' }}
                            >
                              No bazaar data
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {summary ? (
                            <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                              {formatRelativeTime(summary.lastUpdated)}
                            </Typography>
                          ) : (
                            <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                              -
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  )
}

export default BazaarPriceLookup
