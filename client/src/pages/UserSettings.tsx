import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import Loading from '../components/Loading'
import { useUser } from '../hooks/useUser'
import { proxyTornKeyValidate, type ValidatedKey } from '../lib/dotnetapi'

const VALIDATE_DEBOUNCE_MS = 400

const ACCESS_LEVEL_LABELS: Record<number, string> = {
  1: 'Public',
  2: 'Minimal',
  3: 'Limited',
  4: 'Full',
}

const accessLevelDescription = (level: number): string => {
  switch (level) {
    case 1:
      return 'Public — used for the shared market scan pool. Personal data not exposed.'
    case 2:
      return 'Minimal — adds personal selections (inventory, bazaar, bars, cooldowns). Required for Bazaar Price Lookup.'
    case 3:
      return 'Limited — superset of Minimal. Everything we do works.'
    case 4:
      return 'Full — superset of Limited. We don’t currently need anything Full-only.'
    default:
      return 'Unknown access level.'
  }
}

const UserSettings = () => {
  const {
    loadingDotNetUserDetails,
    errorDotNetUserDetails,
    signInAsync,
    dotNetUserDetails,
    sessionChecking,
  } = useUser()

  const navigate = useNavigate()
  const [showKey, setShowKey] = useState(false)
  const [apiKey, setApiKeyInput] = useState('')
  const [preview, setPreview] = useState<ValidatedKey | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [saveInFlight, setSaveInFlight] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

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

  // Debounced preview validation. Local-only plaintext; never persisted.
  useEffect(() => {
    if (!apiKey) {
      setPreview(null)
      setPreviewError(null)
      setLoadingPreview(false)
      return
    }

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()
    const signal = abortRef.current.signal

    const timer = window.setTimeout(() => {
      setLoadingPreview(true)
      setPreviewError(null)
      proxyTornKeyValidate(apiKey, signal)
        .then((payload) => {
          setPreview(payload)
        })
        .catch((e: unknown) => {
          if (e instanceof DOMException && e.name === 'AbortError') return
          setPreview(null)
          setPreviewError(e instanceof Error ? e.message : 'Unknown error')
        })
        .finally(() => {
          setLoadingPreview(false)
        })
    }, VALIDATE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [apiKey])

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
    return <Navigate to="/signin" replace />
  }

  const handleSave = async () => {
    if (!apiKey) return
    setSaveInFlight(true)
    try {
      await signInAsync(apiKey)
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
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6">API Key</Typography>
          {dotNetUserDetails.accessLevel ? (
            <Tooltip title={accessLevelDescription(dotNetUserDetails.accessLevel)}>
              <Chip
                size="small"
                color="primary"
                variant="outlined"
                label={`${ACCESS_LEVEL_LABELS[dotNetUserDetails.accessLevel] ?? `Level ${dotNetUserDetails.accessLevel}`} access`}
              />
            </Tooltip>
          ) : null}
        </Stack>
        <Typography variant="body1" gutterBottom>
          Update your Torn API key or re-confirm it if you generated a new one.
        </Typography>
        <Stack spacing={2} sx={{ mt: 1, width: '100%', maxWidth: 640 }}>
          <TextField
            label="Torn API Key"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
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
          {loadingPreview && <Loading message="Checking API key..." />}
          {previewError && <Alert severity="error">{previewError}</Alert>}
          {errorDotNetUserDetails && <Alert severity="error">{errorDotNetUserDetails}</Alert>}
          {preview && !justSaved && (
            <Alert severity="success">
              Loaded profile: {preview.profile.name} [{preview.profile.id}]
            </Alert>
          )}
          {justSaved && <Alert severity="success">Saved. Redirecting…</Alert>}
          <Box>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={!apiKey || loadingPreview || saveInFlight || !preview}
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
