import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableRow, TableCell, IconButton, Collapse } from '@mui/material'
import {
  Favorite,
  FavoriteBorder,
  KeyboardArrowDown,
  KeyboardArrowUp,
  OpenInNew,
  Storefront,
} from '@mui/icons-material'
import { useUser } from '../hooks/useUser'
import ItemDetails from '../pages/ItemDetails'
import { type Item } from '../types/items'
import ItemCell from './ItemCell'

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

  return (
    <>
      <TableRow key={item.id} hover>
        <TableCell align="center">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell align="left" onClick={() => toggleFavouriteItemAsync(item.id)}>
          {dotNetUserDetails?.favouriteItems?.includes(item.id) ? (
            <Favorite sx={{ cursor: 'pointer', color: '#1976d2' }} />
          ) : (
            <FavoriteBorder sx={{ cursor: 'pointer', color: 'gray' }} />
          )}
        </TableCell>
        <TableCell>
          <ItemCell itemId={item.id} itemName={item?.name ?? `Item ${item.id}`} />
        </TableCell>

        <TableCell>{item.type}</TableCell>

        <TableCell>{item.subType ? item.subType : (<span>&mdash;</span>)}</TableCell>

        <TableCell align="center" onClick={() => navigate(`/item/${item.id}`)}>
          <OpenInNew />
        </TableCell>
        
        <TableCell align="center" onClick={() => openTornMarketPage(item.id)}>
          <Storefront />
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <ItemDetails inputItem={item} inlineView={true} />
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  )
}

export default FavouriteItemsTableRow
