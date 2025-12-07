import { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  tablePaginationClasses as classes,
  TableRow,
  TextField,
  styled,
  useMediaQuery,
} from '@mui/material'
import type { Weav3rMarketplacePayload } from '../types/weav3r'
import Weav3rListingTableRow from './Weav3rListingTableRow'

const CustomTablePagination = styled(TablePagination)`
  & .${classes.toolbar} {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;

    flex-direction: row;
    align-items: center;
    margin-left: -0.5em;
  }

  & .${classes.selectLabel} {
    margin: 0;
  }

  & .${classes.displayedRows} {
    margin: 0;

    @media (min-width: 768px) {
      margin-left: auto;
    }
  }

  & .${classes.spacer} {
    display: none;
  }

  & .${classes.actions} {
    display: flex;
    gap: 0.25rem;
  }
`

interface Weav3rMarketTableProps {
  payload: Weav3rMarketplacePayload
}

const Weav3rMarketTable = ({ payload }: Weav3rMarketTableProps) => {
  const isXs = useMediaQuery((theme: any) => theme.breakpoints.down('md'))
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredItems = useMemo(() => {
    const lowerSearchTerm = searchTerm.toLowerCase()

    const distinctListings = payload.listings
      .filter(
        (item, index, array) =>
          index ===
          array.findIndex((t) => t.player_id === item.player_id && t.price === item.price),
      )
      .map((item) => ({
        ...item,
        quantity: payload.listings
          .filter((listing) => listing.player_id === item.player_id && listing.price === item.price)
          .reduce((sum, listing) => sum + listing.quantity, 0),
      }))

    return distinctListings.filter(
      (item) =>
        item.player_id?.toString().includes(lowerSearchTerm) ||
        item.player_name.toLowerCase().includes(lowerSearchTerm),
    )
  }, [payload, searchTerm])

  const pagedItems = useMemo(
    () => filteredItems.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [filteredItems, page, rowsPerPage],
  )

  useEffect(() => {
    if (page > 0 && page * rowsPerPage >= filteredItems.length) {
      setPage(Math.max(0, Math.ceil(filteredItems.length / rowsPerPage) - 1))
    }
  }, [filteredItems, page, rowsPerPage])

  return (
    <>
      <Box>
        <Grid container spacing={2} sx={{ mb: 1 }}>
          <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'left' }}>
            <TextField
              fullWidth={isXs ? true : false}
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                mb: { xs: 0, md: 1 },
                mt: 1,
                minWidth: { md: '500px' },
              }}
            />
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell align="left">Player</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="right">Last Checked</TableCell>
                <TableCell align="right">Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedItems.map((item) => (
                <Weav3rListingTableRow key={`${item.player_id}-${item.price}`} item={item} />
              ))}
              <TableRow>
                <CustomTablePagination
                  colSpan={5}
                  count={filteredItems.length}
                  page={page}
                  onPageChange={(_, newPage) => setPage(newPage)}
                  rowsPerPage={rowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
                  onRowsPerPageChange={(event) => {
                    setRowsPerPage(parseInt(event.target.value, 10))
                    setPage(0)
                  }}
                  showFirstButton
                  showLastButton
                />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  )
}

export default Weav3rMarketTable
