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
import { useUser } from '../hooks/useUser'

interface FavouriteItemsTableProps {
  items: Item[]
}

const FavouriteMarketsTable = ({ items }: FavouriteItemsTableProps) => {
  const { dotNetUserDetails } = useUser()
  const hasSubtype = items.some((item) => !!item.subType)

  return (
    <Box>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 48 }}>
                Info
              </TableCell>
              {dotNetUserDetails && (
                <TableCell align="center" sx={{ width: 48 }}>
                  Fav
                </TableCell>
              )}
              <TableCell align="left">Item</TableCell>
              <TableCell align="left">Type</TableCell>
              {hasSubtype && <TableCell align="left">Subtype</TableCell>}
              <TableCell align="center" sx={{ width: 110 }}>
                Trend (1w)
              </TableCell>
              <TableCell align="center" sx={{ width: 48 }}>
                Item Page
              </TableCell>
              <TableCell align="center" sx={{ width: 48 }}>
                Torn
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <FavouriteItemsTableRow key={item.id} item={item} showSubtype={hasSubtype} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

export default FavouriteMarketsTable
