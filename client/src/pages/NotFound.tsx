import SearchOffIcon from '@mui/icons-material/SearchOff'
import { Box, Button } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

const NotFound = () => (
  <Box sx={{ py: 4 }}>
    <EmptyState
      illustration={<SearchOffIcon />}
      title="Page not found"
      message="The page you were after doesn't exist — it may have been renamed, removed, or never existed in the first place."
      action={
        <Button component={RouterLink} to="/" variant="outlined" color="primary">
          Back to home
        </Button>
      }
    />
  </Box>
)

export default NotFound
