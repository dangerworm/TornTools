import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Loading from '../components/Loading'
import { useUser } from '../hooks/useUser'

const UserSettings = () => {
  const {
    apiKey,
    setApiKey,
    tornUserProfile,
    loadingTornUserProfile,
    errorTornUserProfile,
    confirmApiKeyAsync,
  } = useUser()

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        User Settings
      </Typography>

      <Box sx={{ mt: 1, maxWidth: 480 }}>
        <Typography variant="h6" gutterBottom>
          API Key
        </Typography>
        <Typography variant="body1" gutterBottom>
          Update your Torn API key or re-confirm it if you generated a new one.
        </Typography>
        <Stack spacing={2} sx={{ mt: 1, width: '100%' }}>
          <TextField
            label="Torn API Key"
            variant="outlined"
            value={apiKey || ''}
            onChange={(e) => setApiKey(e.target.value || null)}
            fullWidth
          />
          {loadingTornUserProfile && <Loading message="Checking API key..." />}
          {errorTornUserProfile && <Alert severity="error">{errorTornUserProfile}</Alert>}
          {tornUserProfile && (
            <Alert severity="success">
              Loaded profile: {tornUserProfile.name} [{tornUserProfile.id}]
            </Alert>
          )}
          <Box>
            <Button
              variant="contained"
              onClick={() => confirmApiKeyAsync()}
              disabled={!apiKey || loadingTornUserProfile}
            >
              Save API key
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}

export default UserSettings
