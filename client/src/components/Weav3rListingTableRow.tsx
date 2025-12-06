import { TableRow, TableCell, Typography } from '@mui/material'
import { getFormattedText } from '../lib/textFormat'
import type { Weav3rMarketPlaceListing } from '../types/weav3r'

const openPlayerBazaarPage = (playerId: number) => {
  window.open(`https://www.torn.com/bazaar.php?userId=${playerId}#/`, '_blank')
}

interface WeaverListingTableRowProps {
  item: Weav3rMarketPlaceListing
}

const WeaverListingTableRow = ({ item }: WeaverListingTableRowProps) => {
  return (
    <>
      <TableRow hover key={item.player_id} onClick={() => openPlayerBazaarPage(item.player_id)}>
        <TableCell align="left">
          <Typography component={'a'}>
            {item.player_name} [{item.player_id}]
          </Typography>
        </TableCell>

        <TableCell align="right">{item.quantity}</TableCell>

        <TableCell align="left">{getFormattedText('$', item.price, '')}</TableCell>

        <TableCell align="right">{item.last_checked_relative}</TableCell>

        <TableCell align="right">{item.content_updated_relative}</TableCell>
      </TableRow>
    </>
  )
}

export default WeaverListingTableRow
