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
import { type Item } from '../types/items'
import FavouriteItemsTableRow from './FavouriteMarketsTableRow'

interface FavouriteItemsTableProps {
  items: Item[]
}

const FavouriteMarketsTable = ({ items }: FavouriteItemsTableProps) => {
  return (
    <Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>
                Info
              </TableCell>
              <TableCell align="center" sx={{ width: 48 }}>
                Fav
              </TableCell>
              <TableCell align="left">Item</TableCell>
              <TableCell align="left">Type</TableCell>
              <TableCell align="left">Subtype</TableCell>
              <TableCell align="center">Item Page</TableCell>
              <TableCell align="center">Torn</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <FavouriteItemsTableRow key={item.id} item={item} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default FavouriteMarketsTable
