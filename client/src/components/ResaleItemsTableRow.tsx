import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Chip, rgbToHex, TableCell, TableRow } from '@mui/material'
import {
  Favorite,
  FavoriteBorder,
  OpenInNew,
} from '@mui/icons-material'
import { useThemeSettings } from '../hooks/useThemeSettings'
import { useUser } from '../hooks/useUser'
import { getFormattedText } from '../lib/textFormat'
import { getSecondsSinceLastUpdate, timeAgo } from '../lib/time'
import type { ProfitableListing } from '../types/profitableListings'
import ItemCell from './ItemCell'

const MotionTableRow = motion.create(TableRow)

interface ResaleItemsTableRowProps {
  isNew: boolean
  row: ProfitableListing
}

const ResaleItemsTableRow = ({ isNew, row }: ResaleItemsTableRowProps) => {
  const navigate = useNavigate()
  const { availableThemes, selectedThemeId } = useThemeSettings()

  const { dotNetUserDetails, toggleFavouriteItemAsync } = useUser()

  const rowColor = (lastUpdated: Date): string => {
    const diffSeconds = getSecondsSinceLastUpdate(lastUpdated)
    const selectedTheme = availableThemes.find((t) => t.id === selectedThemeId)

    let colorValue = Math.min(Math.max(Math.floor(diffSeconds / 3), 0), 171)
    if (selectedTheme?.mode != null && selectedTheme.mode === 'dark') {
      colorValue = 255 - colorValue
    }
    return `rgba(${colorValue}, ${colorValue}, ${colorValue}, 0.87)` // default color
  }

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
      // Only animate in for brand-new rows
      initial={
        isNew ? false : { height: 0, opacity: 0, y: -12 } // don't replay enter animation
      }
      animate={{ height: '2.3em', opacity: 1, y: 0 }}
      exit={{ height: 0, opacity: 0, y: -12 }} // fade/slide out on removal
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
        <ItemCell itemId={row.itemId} itemName={row.name} rowColour={rowColor(row.lastUpdated)} />
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(rowColor(row.lastUpdated)) }}
      >
        {row.minPrice === row.maxPrice
          ? getFormattedText('$', row.minPrice, '')
          : `${getFormattedText('$', row.minPrice, '')} - ${getFormattedText('$', row.maxPrice, '')}`}
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(rowColor(row.lastUpdated)) }}
      >
        {getFormattedText('$', row.sellPrice, '')}
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(rowColor(row.lastUpdated)) }}
      >
        {getFormattedText('', row.quantity, '')}
      </TableCell>

      <TableCell
        align="right"
        onClick={() => openTornMarketPage(row.itemId)}
        style={{ color: rgbToHex(rowColor(row.lastUpdated)) }}
      >
        <Chip label={getFormattedText('$', row.profit, '')} color={'success'} size="small" />
      </TableCell>

      <TableCell align="right" style={{ color: rgbToHex(rowColor(row.lastUpdated)) }}>
        {timeAgo(row.lastUpdated)}
      </TableCell>

      <TableCell align="right" onClick={() => navigate(`/item/${row.itemId}`)}>
        <OpenInNew />
      </TableCell>
    </MotionTableRow>
  )
}

export default ResaleItemsTableRow
