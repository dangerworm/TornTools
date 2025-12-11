import { useNavigate } from 'react-router-dom'
import { Autocomplete, TextField, Box, Typography, createFilterOptions } from '@mui/material'
import { useItems } from '../hooks/useItems'

const ItemSearch = () => {
  const { itemsById, items } = useItems()
  const navigate = useNavigate()

  const filter = createFilterOptions<{ label: string; value: number }>()

  return (
    <Autocomplete
      disablePortal
      fullWidth
      options={items.map((i) => ({ label: `#${i.id}: ${i.name}`, value: i.id }))}
      filterOptions={(options, state) => {
        const filtered = filter(options, state)
        return state.inputValue.length < 3 ? [] : filtered
      }}
      noOptionsText="Please enter an item name"
      onChange={(_, option) => {
        if (option && itemsById[option.value]) {
          navigate(`/item/${option.value}`)
        }
      }}
      slotProps={{
        listbox: {
          sx: {
            bgcolor: (theme) => (theme.palette.mode === 'dark' ? '#333' : '#fff'),
            borderRadius: 1,
            m: 0,
            p: 0,
          },
        },
        paper: {
          sx: (theme) => ({
            bgcolor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#555' : '#ccc'}`,
            color: theme.palette.text.primary,
            m: 0,
            p: 0,
            scrollbarColor: theme.palette.mode === 'dark' ? '#555 #333' : '#ccc #fff',
          }),
        },
      }}
      sx={(theme) => ({
        borderRadius: 1,
        backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : '#fff',
        maxWidth: { xs: 450 },
      })}
      renderInput={(params) => (
        <TextField {...params} placeholder="Search items..." size="small" variant="outlined" />
      )}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          sx={{
            alignItems: 'center',
            display: 'flex',
          }}
        >
          <Box
            sx={{
              border: '1px solid #888',
              borderRadius: 2,
              display: 'flex',
              justifyContent: 'center',
              ml: -1,
              height: 40,
              width: 40,
            }}
          >
            <img
              alt=""
              src={`https://www.torn.com/images/items/${option.value}/small.png`}
              style={{
                marginTop: 'auto',
                marginBottom: 'auto',
                height: 19,
                width: 38,
              }}
              onError={(e) => {
                ;(e.currentTarget as HTMLImageElement).style.display = 'none'
              }}
            />
          </Box>

          <Box sx={{ flex: 1, pl: 2, mt: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 500, m: 0 }}>
              {option.label}
            </Typography>
            <Typography component="p" variant="caption" sx={{ color: 'text.secondary', mt: -0.2 }}>
              {itemsById[option.value]?.type}
            </Typography>
          </Box>
        </Box>
      )}
    />
  )
}

export default ItemSearch
