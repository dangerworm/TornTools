import { Box, rgbToHex, Typography } from '@mui/material'

interface ItemCellProps {
  itemId: number
  itemName: string
  rowColour?: string
}

const ItemCell = ({ itemId, itemName, rowColour }: ItemCellProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <img
        alt=""
        src={`https://www.torn.com/images/items/${itemId}/small.png`}
        width={46}
        height={19}
        style={{ borderRadius: 4, paddingRight: 8 }}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
      <Typography
        variant="body2"
        style={{
          color: rowColour ? rgbToHex(rowColour) : 'inherit',
        }}
      >
        {itemName}
      </Typography>
    </Box>
  )
}

export default ItemCell
