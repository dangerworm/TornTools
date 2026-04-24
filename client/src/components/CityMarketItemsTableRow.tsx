import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TableRow, TableCell, IconButton, Collapse, Tooltip } from '@mui/material'
import {
  Favorite,
  FavoriteBorder,
  KeyboardArrowDown,
  KeyboardArrowUp,
  ShoppingCart,
  Storefront,
} from '@mui/icons-material'
import { useUser } from '../hooks/useUser'
import { getFormattedText } from '../lib/textFormat'
import { SALE_TAX } from '../lib/profitCalculations'
import ItemDetails from '../pages/ItemDetails'
import { type SortableItem } from '../types/items'
import type { SaleOutlet } from '../types/markets'
import ItemCell from './ItemCell'
import PriceWithTax from './PriceWithTax'
import StatChip from './StatChip'

const shopUrls: Map<string, string> = new Map([
  ["Big Al's Gun Shop", 'https://www.torn.com/bigalgunshop.php'],
  ["Bits 'n' Bobs", 'https://www.torn.com/shops.php?step=bitsnbobs'],
  ["Sally's Sweet Shop", 'https://www.torn.com/shops.php?step=candy'],
  ['the Docks', 'https://www.torn.com/shops.php?step=docks'],
  ['the Jewelry Store', 'https://www.torn.com/shops.php?step=jewelry'],
  ['the Post Office', 'https://www.torn.com/shops.php?step=postoffice'],
  ['the Print Shop', 'https://www.torn.com/shops.php?step=printstore'],
  ['the Pharmacy', 'https://www.torn.com/shops.php?step=pharmacy'],
  ['the Recycling Center', 'https://www.torn.com/shops.php?step=recyclingcenter'],
  ['the Super Store', 'https://www.torn.com/shops.php?step=super'],
  ['TC Clothing', 'https://www.torn.com/shops.php?step=clothes'],
])

const openTornMarketPage = (itemId: number) => {
  window.open(
    `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
    '_blank',
  )
}

const openTornShopPage = (vendorName: string) => {
  if (shopUrls.has(vendorName)) {
    window.open(shopUrls.get(vendorName)!, '_blank')
    return
  }
}

interface CityMarketItemsTableRowProps {
  item: SortableItem
  showCityPrice: boolean
  showVendor: boolean
  saleOutlet: SaleOutlet
}

const CityMarketItemsTableRow = ({
  item,
  saleOutlet,
  showCityPrice,
  showVendor,
}: CityMarketItemsTableRowProps) => {
  const navigate = useNavigate()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const [open, setOpen] = useState(false)

  return (
    <>
      <TableRow hover key={item.id}>
        <TableCell align="center">
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>

        {dotNetUserDetails && (
          <TableCell align="center" onClick={() => toggleFavouriteItemAsync(item.id)}>
            <Tooltip
              title={
                dotNetUserDetails.favouriteItems?.includes(item.id)
                  ? 'Remove from favourites'
                  : 'Add to favourites'
              }
            >
              {dotNetUserDetails.favouriteItems?.includes(item.id) ? (
                <Favorite sx={{ cursor: 'pointer', color: 'primary.main' }} />
              ) : (
                <FavoriteBorder sx={{ cursor: 'pointer', color: 'text.secondary' }} />
              )}
            </Tooltip>
          </TableCell>
        )}

        <TableCell align="left" onClick={() => navigate(`/item/${item.id}`)}>
          <ItemCell itemId={item.id} itemName={item?.name ?? `Item ${item.id}`} />
        </TableCell>

        {showVendor ? (
          <TableCell align="left" onClick={() => navigate(`/item/${item.id}`)}>
            {item.valueVendorName?.startsWith('the')
              ? item.valueVendorName.substring(4)
              : item.valueVendorName}
          </TableCell>
        ) : (
          <TableCell align="left" onClick={() => navigate(`/item/${item.id}`)}>
            {item.type}
          </TableCell>
        )}

        {showCityPrice ? (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {item.valueBuyPrice ? (
              <span>{getFormattedText('$', item.valueBuyPrice!, '')}</span>
            ) : (
              <span>&mdash;</span>
            )}
          </TableCell>
        ) : (
          <TableCell align="left" onClick={() => navigate(`/item/${item.id}`)}>
            {item.subType}
          </TableCell>
        )}

        <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
          <PriceWithTax value={item.grossSellPrice} taxRate={SALE_TAX[saleOutlet]} />
        </TableCell>

        {showCityPrice ? (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {!item.profit && item.profit !== 0 ? (
              <span>&mdash;</span>
            ) : (
              <StatChip
                chipVariant={item.profit >= 0 ? 'profit' : 'loss'}
                label={getFormattedText('$', item.profit, '')}
              />
            )}
          </TableCell>
        ) : (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {getFormattedText('', item.circulation ?? 0, '')}
          </TableCell>
        )}

        {showCityPrice && (
          <TableCell align="right" onClick={() => navigate(`/item/${item.id}`)}>
            {!item.profitPerCost && item.profitPerCost !== 0 ? (
              <span>&mdash;</span>
            ) : item.profitPerCost! >= 0 ? (
              <span>{getFormattedText('', item.profitPerCost * 100, '%')}</span>
            ) : (
              <span>{getFormattedText('', item.profitPerCost * 100, '%')}</span>
            )}
          </TableCell>
        )}

        <TableCell
          align="center"
          onClick={() =>
            showVendor && item.valueVendorName && shopUrls.has(item.valueVendorName)
              ? openTornShopPage(item.valueVendorName)
              : openTornMarketPage(item.id)
          }
        >
          {showVendor && item.valueVendorName && shopUrls.has(item.valueVendorName) ? (
            <ShoppingCart />
          ) : (
            <Storefront />
          )}
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

export default CityMarketItemsTableRow
