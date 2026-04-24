import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Loading from '../components/Loading'
import { useUser } from '../hooks/useUser'

const UserSettings = () => {
  const {
    apiKey,
    setApiKey,
    tornUserProfile,
    loadingTornUserProfile,
    loadingDotNetUserDetails,
    errorTornUserProfile,
    errorDotNetUserDetails,
    confirmApiKeyAsync,
    dotNetUserDetails,
    sessionChecking,
  } = useUser()

  const navigate = useNavigate()
  const [showKey, setShowKey] = useState(false)
  const [saveInFlight, setSaveInFlight] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (saveInFlight && !loadingDotNetUserDetails) {
      setSaveInFlight(false)
      if (!errorDotNetUserDetails) {
        setJustSaved(true)
      }
    }
  }, [saveInFlight, loadingDotNetUserDetails, errorDotNetUserDetails])

  useEffect(() => {
    if (justSaved) {
      const timer = window.setTimeout(() => navigate('/'), 600)
      return () => window.clearTimeout(timer)
    }
  }, [justSaved, navigate])

  // getMe() is still in flight — don't redirect yet; a valid session
  // cookie could resolve any moment and land us here legitimately.
  if (sessionChecking) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Loading message="Checking your session..." />
      </Box>
    )
  }

  if (!dotNetUserDetails) {
    // Session check completed without producing a user — send them to sign in.
    return <Navigate to="/signin" replace />
  }

  const handleSave = async () => {
    setSaveInFlight(true)
    try {
      await confirmApiKeyAsync()
    } catch {
      setSaveInFlight(false)
    }
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ mt: 1 }}>
        <Typography variant="h6" gutterBottom>
          API Key
        </Typography>
        <Typography variant="body1" gutterBottom>
          Update your Torn API key or re-confirm it if you generated a new one.
        </Typography>
        <Stack spacing={2} sx={{ mt: 1, width: '100%', maxWidth: 640 }}>
          <TextField
            label="Torn API Key"
            variant="outlined"
            value={apiKey || ''}
            onChange={(e) => setApiKey(e.target.value || null)}
            type={showKey ? 'text' : 'password'}
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showKey ? 'hide API key' : 'show API key'}
                      onClick={() => setShowKey((prev) => !prev)}
                      edge="end"
                    >
                      {showKey ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {loadingTornUserProfile && <Loading message="Checking API key..." />}
          {errorTornUserProfile && <Alert severity="error">{errorTornUserProfile}</Alert>}
          {errorDotNetUserDetails && <Alert severity="error">{errorDotNetUserDetails}</Alert>}
          {tornUserProfile && !justSaved && (
            <Alert severity="success">
              Loaded profile: {tornUserProfile.name} [{tornUserProfile.id}]
            </Alert>
          )}
          {justSaved && <Alert severity="success">Saved. Redirecting…</Alert>}
          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!apiKey || loadingTornUserProfile || saveInFlight}
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
