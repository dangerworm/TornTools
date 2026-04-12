import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import { useUser } from '../hooks/useUser'
import { type ForeignStockItem } from '../types/foreignStockItems'
import type { SaleOutlet } from '../types/markets'
import ForeignMarketItemsTableRow from './ForeignMarketItemsTableRow'

const sellColumnLabel: Record<SaleOutlet, string> = {
  city: 'Sell (City)',
  bazaar: 'Sell (Bazaar)',
  market: 'Sell (Mkt 5%)',
  anonymousMarket: 'Sell (Anon 15%)',
}

interface ForeignMarketItemsTableProps {
  items: ForeignStockItem[]
  saleOutlet: SaleOutlet
}

const ForeignMarketItemsTable = ({ items, saleOutlet }: ForeignMarketItemsTableProps) => {
  const { dotNetUserDetails } = useUser()

  return (
    <>
      <Box>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell align="center">Info</TableCell>
                {dotNetUserDetails && <TableCell align="center">Fav</TableCell>}
                <TableCell>Item</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Buy Price</TableCell>
                <TableCell align="right">{sellColumnLabel[saleOutlet]}</TableCell>
                <TableCell align="right">Profit</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Last Updated</TableCell>
                <TableCell align="center">Torn</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((item) => (
                <ForeignMarketItemsTableRow key={item.itemId} item={item} saleOutlet={saleOutlet} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default ForeignMarketItemsTable
