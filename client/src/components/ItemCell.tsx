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
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          height: 32,
          justifyContent: 'center',
          mr: 1,
          width: 40,
        }}
      >
        <Box
          component="img"
          alt=""
          src={`https://www.torn.com/images/items/${itemId}/small.png`}
          sx={{
            borderRadius: 0.5,
            display: 'block',
            maxHeight: '100%',
            maxWidth: '100%',
            objectFit: 'contain',
          }}
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).style.display = 'none'
          }}
        />
      </Box>
      <Typography
        variant="body1"
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
