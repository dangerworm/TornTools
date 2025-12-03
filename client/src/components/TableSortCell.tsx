import { TableCell, TableSortLabel } from '@mui/material'
import type { SortOrder } from '../lib/comparisons'

interface TableSortCellProps<T> {
  align?: 'left' | 'right' | 'center' | 'justify' | 'inherit'
  columnKey: keyof T
  defaultOrderDirection?: 'asc' | 'desc'
  label: string
  orderBy: keyof T
  orderDirection: 'asc' | 'desc'
  handleRequestSort: (property: keyof T, defaultOrderDirection: SortOrder) => void
}

const TableSortCell = <T,>({
  align = 'left',
  columnKey,
  defaultOrderDirection = 'asc',
  label,
  orderBy,
  orderDirection,
  handleRequestSort,
}: TableSortCellProps<T>) => {
  return (
    <TableCell align={align}>
      <TableSortLabel
        active={orderBy === columnKey}
        direction={orderBy === columnKey ? orderDirection : defaultOrderDirection}
        onClick={() => handleRequestSort(columnKey, defaultOrderDirection)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  )
}

export default TableSortCell
