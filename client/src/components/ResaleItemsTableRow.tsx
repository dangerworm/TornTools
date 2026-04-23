import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Chip, rgbToHex, TableCell, TableRow } from '@mui/material'
import { Favorite, FavoriteBorder, OpenInNew } from '@mui/icons-material'
import { useUser } from '../hooks/useUser'
import { getFormattedText } from '../lib/textFormat'
import { getSecondsSinceLastUpdate, timeAgo } from '../lib/time'
import {
  getBuyPriceRange,
  getLastUpdated,
  getQuantity,
  getTotalProfit,
  getSellRevenue,
} from '../lib/profitCalculations'
import type { ProfitableListing } from '../types/profitableListings'
import type { PurchaseOutlet, SaleOutlet } from '../types/markets'
import ItemCell from './ItemCell'

const MotionTableRow = motion.create(TableRow)

interface ResaleItemsTableRowProps {
  isNew: boolean
  row: ProfitableListing
  purchaseOutlet: PurchaseOutlet
  saleOutlet: SaleOutlet
}

const ProfitChip = ({ profit }: { profit: number | null }) => {
  if (profit === null)
    return <Chip label="N/A" size="small" sx={{ opacity: 0.3, whiteSpace: 'nowrap' }} />
  return (
    <Chip
      label={getFormattedText('$', profit, '')}
      color={profit >= 0 ? 'success' : 'error'}
      size="small"
      sx={{ whiteSpace: 'nowrap' }}
    />
  )
}

const ResaleItemsTableRow = ({
  isNew,
  row,
  purchaseOutlet,
  saleOutlet,
}: ResaleItemsTableRowProps) => {
  const navigate = useNavigate()
  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const buyPriceRange = getBuyPriceRange(row, purchaseOutlet, saleOutlet)
  const sellRevenue = getSellRevenue(row, saleOutlet)
  const totalProfit = getTotalProfit(row, purchaseOutlet, saleOutlet)
  const lastUpdated = getLastUpdated(row, purchaseOutlet)

  const quantity = getQuantity(row, purchaseOutlet, saleOutlet)

  const rowColor = (date: Date | null): string => {
    if (date === null) return `rgba(128, 128, 128, 0.87)`
    const diffSeconds = getSecondsSinceLastUpdate(date)
    const colorValue = 255 - Math.min(Math.max(Math.floor(diffSeconds / 3), 0), 171)
    return `rgba(${colorValue}, ${colorValue}, ${colorValue}, 0.87)`
  }

  const color = rowColor(lastUpdated)

  const openTornMarketPage = (itemId: number) => {
    window.open(
      `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${itemId}&sortField=price&sortOrder=ASC`,
      '_blank',
    )
  }

  return (
    <MotionTableRow
      key={row.itemId}
      hover
      initial={isNew ? false : { height: 0, opacity: 0, y: -12 }}
      animate={{ height: '2.3em', opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -12 }}
      transition={{ duration: 0.5 }}
    >
      {dotNetUserDetails && (
        <TableCell align="left" onClick={() => toggleFavouriteItemAsync(row.itemId)}>
          {dotNetUserDetails.favouriteItems?.includes(row.itemId) ? (
            <Favorite sx={{ cursor: 'pointer', color: '#1976d2' }} />
          ) : (
            <FavoriteBorder sx={{ cursor: 'pointer', color: 'gray' }} />
          )}
        </TableCell>
      )}

      <TableCell onClick={() => openTornMarketPage(row.itemId)}>
        <ItemCell itemId={row.itemId} itemName={row.name} rowColour={color} />
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(color) }}
      >
        {buyPriceRange !== null
          ? buyPriceRange.min === buyPriceRange.max
            ? getFormattedText('$', buyPriceRange.min, '')
            : `${getFormattedText('$', buyPriceRange.min, '')}–${getFormattedText('$', buyPriceRange.max, '')}`
          : '-'}
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(color) }}
      >
        {quantity !== null ? getFormattedText('', quantity, '') : '-'}
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(color) }}
      >
        {sellRevenue !== null ? getFormattedText('$', sellRevenue, '') : '-'}
      </TableCell>

      <TableCell align="right" onClick={() => openTornMarketPage(row.itemId)}>
        <ProfitChip profit={totalProfit} />
      </TableCell>

      <TableCell align="right" style={{ color: rgbToHex(color) }}>
        {lastUpdated !== null ? timeAgo(lastUpdated) : '-'}
      </TableCell>

      <TableCell align="right" onClick={() => navigate(`/item/${row.itemId}`)}>
        <OpenInNew />
      </TableCell>
    </MotionTableRow>
  )
}

export default ResaleItemsTableRow
