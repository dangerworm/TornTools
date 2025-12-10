import { Box, List, ListItem, Typography } from '@mui/material'
import { type Item } from '../types/items'

interface ItemDetailsDescriptionProps {
  item: Item
  inlineView?: boolean
}

const ItemDetailsDescription = ({ item }: ItemDetailsDescriptionProps) => {

  return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Details
        </Typography>
        <Typography variant="body1" gutterBottom>
          <>{item?.description}</>
        </Typography>
        <Typography variant="body2" gutterBottom>
          {item?.valueVendorCountry && (
            <>
              {' '}
              Available from{' '}
              {item?.valueVendorName?.startsWith('the ')
                ? item?.valueVendorName.substring(4)
                : item?.valueVendorName}
              {' in '}
              {item?.valueVendorCountry === 'Torn' ? 'Torn City' : item?.valueVendorCountry}.
            </>
          )}
        </Typography>
        {item?.effect && (
          <>
            <Typography variant="body2" gutterBottom>
              Effect(s):
            </Typography>
            <List>
              {item.effect.split('\n').map((effect: string, index: number) => (
                <ListItem key={index} sx={{ display: 'list-item', pl: 2, py: 0 }}>
                  {effect}
                </ListItem>
              ))}
            </List>
          </>
        )}
        {item?.requirement && (
          <Typography variant="body2" gutterBottom>
            Requirement: {item.requirement}
          </Typography>
        )}
      </Box>
  )
}

export default ItemDetailsDescription