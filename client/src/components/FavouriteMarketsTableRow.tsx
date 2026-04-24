import {
  Favorite,
  FavoriteBorder,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
  Storefront,
} from '@mui/icons-material'
import { Collapse, IconButton, TableCell, TableRow, Tooltip } from '@mui/material'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBazaarSummaries } from '../hooks/useBazaarSummaries'
import { useUser } from '../hooks/useUser'
import { getFormattedText } from '../lib/textFormat'
import ItemDetails from '../pages/ItemDetails'
import { type Item } from '../types/items'
import ItemCell from './ItemCell'
import LazyLatestMarketPrice from './LazyLatestMarketPrice'
import LazySparkline from './LazySparkline'

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    '_blank',
  )
}

const formatRelative = (iso: string | null | undefined): string => {
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

interface FavouriteItemsTableRowProps {
  item: Item
}

const FavouriteItemsTableRow = ({ item }: FavouriteItemsTableRowProps) => {
  const navigate = useNavigate()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()
  const { summaries: bazaarSummaries } = useBazaarSummaries()

  const [open, setOpen] = useState(false)
  const isFavourite = dotNetUserDetails?.favouriteItems?.includes(item.id) ?? false
  const bazaarSummary = bazaarSummaries[item.id]
  // 9 base columns (Info, Item, Type, Bazaar, BazaarTrend, Market, MarketTrend,
  // Item Page, Torn) plus 1 if signed-in (Fav).
  const expandedColSpan = 9 + (dotNetUserDetails ? 1 : 0)

  return (
    <>
      <TableRow key={item.id} hover>
        <TableCell align="center">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        {dotNetUserDetails && (
          <TableCell align="center" onClick={() => toggleFavouriteItemAsync(item.id)}>
            <Tooltip title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}>
              {isFavourite ? (
                <Favorite sx={{ cursor: 'pointer', color: 'primary.main' }} />
              ) : (
                <FavoriteBorder sx={{ cursor: 'pointer', color: 'text.secondary' }} />
              )}
            </Tooltip>
          </TableCell>
        )}
        <TableCell>
          <ItemCell itemId={item.id} itemName={item?.name ?? `Item ${item.id}`} />
        </TableCell>

        <TableCell>{item.type}</TableCell>

        <TableCell align="right">
          {bazaarSummary ? (
            <Tooltip
              title={`Latest scan: ${formatRelative(bazaarSummary.lastUpdated)}`}
              placement="left"
            >
              <span>{getFormattedText('$', bazaarSummary.minPrice, '')}</span>
            </Tooltip>
          ) : (
            <span style={{ opacity: 0.5 }}>&mdash;</span>
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

        <TableCell align="center" onClick={() => navigate(`/item/${item.id}`)}>
          <OpenInNew sx={{ cursor: 'pointer' }} />
        </TableCell>

        <TableCell align="center" onClick={() => openTornMarketPage(item.id)}>
          <Storefront sx={{ cursor: 'pointer' }} />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={expandedColSpan}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ItemDetails inputItem={item} inlineView={true} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default FavouriteItemsTableRow
