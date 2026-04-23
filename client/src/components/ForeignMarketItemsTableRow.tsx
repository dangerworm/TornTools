import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, TableRow, TableCell, IconButton, Collapse } from '@mui/material'
import {
  Favorite,
  FavoriteBorder,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
} from '@mui/icons-material'
import { Tooltip } from '@mui/material'
import { useUser } from '../hooks/useUser'
import { getFormattedText } from '../lib/textFormat'
import { SALE_TAX } from '../lib/profitCalculations'
import { timeAgo } from '../lib/time'
import ItemDetails from '../pages/ItemDetails'
import { type SortableForeignStockItem } from '../types/foreignStockItems'
import type { SaleOutlet } from '../types/markets'
import ItemCell from './ItemCell'
import PriceWithTax from './PriceWithTax'
import StatChip from './StatChip'

const ProfitChip = ({ profit }: { profit: number | null }) => {
  if (profit === null)
    return <StatChip chipVariant="status" label="N/A" sx={{ opacity: 0.5, whiteSpace: 'nowrap' }} />
  return (
    <StatChip
      chipVariant={profit >= 0 ? 'profit' : 'loss'}
      label={getFormattedText('$', profit, '')}
      sx={{ whiteSpace: 'nowrap' }}
    />
  )
}

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    '_blank',
  )
}

interface ForeignMarketItemsTableRowProps {
  item: SortableForeignStockItem
  showCountry?: boolean
  saleOutlet: SaleOutlet
}

const ForeignMarketItemsTableRow = ({
  item,
  saleOutlet,
  showCountry = false,
}: ForeignMarketItemsTableRowProps) => {
  const navigate = useNavigate()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow hover key={item.itemId}>
        <TableCell align="center">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>

        {dotNetUserDetails && (
          <TableCell align="center" onClick={() => toggleFavouriteItemAsync(item.itemId)}>
            <Tooltip
              title={
                dotNetUserDetails.favouriteItems?.includes(item.itemId)
                  ? 'Remove from favourites'
                  : 'Add to favourites'
              }
            >
              {dotNetUserDetails.favouriteItems?.includes(item.itemId) ? (
                <Favorite sx={{ cursor: 'pointer', color: 'primary.main' }} />
              ) : (
                <FavoriteBorder sx={{ cursor: 'pointer', color: 'text.secondary' }} />
              )}
            </Tooltip>
          </TableCell>
        )}

        <TableCell onClick={() => navigate(`/item/${item.itemId}`)}>
          <ItemCell itemId={item.itemId} itemName={item.item?.name ?? `Item ${item.itemId}`} />
        </TableCell>

        <TableCell onClick={() => navigate(`/item/${item.itemId}`)}>{item.item.type}</TableCell>

        {showCountry && (
          <TableCell onClick={() => navigate(`/item/${item.itemId}`)}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
              <img
                src={`/${item.country.toLowerCase().replace(' ', '-')}.svg`}
                alt={`Flag of ${item.country}`}
                style={{ width: '1.2em', height: '1.2em', borderRadius: '50%', objectFit: 'cover' }}
              />
              {item.country}
            </Box>
          </TableCell>
        )}

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          {item.cost ? <span>{getFormattedText('$', item.cost, '')}</span> : <span>&mdash;</span>}
        </TableCell>

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          <PriceWithTax value={item.grossSellPrice} taxRate={SALE_TAX[saleOutlet]} />
        </TableCell>

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          <ProfitChip profit={item.profit} />
        </TableCell>

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          {item.quantity === 0 ? (
            <StatChip chipVariant="loss" label="Out of stock" />
          ) : (
            <span>{getFormattedText('', item.quantity ?? 0, '')}</span>
          )}
        </TableCell>

        <TableCell align="right" onClick={() => navigate(`/item/${item.itemId}`)}>
          {item.lastUpdated ? timeAgo(item.lastUpdated) : <span>&ndash;</span>}
        </TableCell>

        <TableCell align="center" onClick={() => openTornMarketPage(item.itemId)}>
          <OpenInNew />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={showCountry ? 11 : 10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ItemDetails inputItem={item.item} inlineView={true} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default ForeignMarketItemsTableRow
