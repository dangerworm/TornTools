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
import { useUser } from '../hooks/useUser'
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

interface FavouriteItemsTableRowProps {
  item: Item
}

const FavouriteItemsTableRow = ({ item }: FavouriteItemsTableRowProps) => {
  const navigate = useNavigate()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const [open, setOpen] = useState(false)
  const isFavourite = dotNetUserDetails?.favouriteItems?.includes(item.id) ?? false
  // 7 base columns (Info, Item, Type, Sub-type, Market, Trend, Item Page, Torn)
  // minus 1 if signed-out (no Fav column)
  const expandedColSpan = 8 + (dotNetUserDetails ? 1 : 0)

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

        <TableCell>{item.subType ?? <span style={{ opacity: 0.4 }}>&mdash;</span>}</TableCell>

        <TableCell align="right">
          <LazyLatestMarketPrice itemId={item.id} />
        </TableCell>

        <TableCell align="center">
          <LazySparkline itemId={item.id} />
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
