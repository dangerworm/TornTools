import CloseIcon from '@mui/icons-material/Close'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  styled,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Loading from '../components/Loading'
import PrivacyNotice from '../components/PrivacyNotice'
import { useUser } from '../hooks/useUser'
import { proxyTornKeyValidate, type ValidatedKey } from '../lib/dotnetapi'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}))

// How long to wait after the last keystroke before validating against the
// backend. 16-character Torn keys are usually pasted, not typed — this
// catches both cases without flooding the proxy on every keystroke.
const VALIDATE_DEBOUNCE_MS = 400

const SignIn = () => {
  const { loadingDotNetUserDetails, errorDotNetUserDetails, signInAsync, dotNetUserDetails } =
    useUser()

  const navigate = useNavigate()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [apiKey, setApiKeyInput] = useState('')
  const [preview, setPreview] = useState<ValidatedKey | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // Only redirect on successful auth that followed an intentional Sign in
  // click — not on arrival with an existing session cookie.
  const attemptedSignInRef = useRef(false)

  useEffect(() => {
    if (attemptedSignInRef.current && dotNetUserDetails) {
      attemptedSignInRef.current = false
      setDialogOpen(false)
      navigate('/')
    }
  }, [dotNetUserDetails, navigate])

  useEffect(() => {
    if (attemptedSignInRef.current && !loadingDotNetUserDetails && errorDotNetUserDetails) {
      attemptedSignInRef.current = false
    }
  }, [loadingDotNetUserDetails, errorDotNetUserDetails])

  // Debounced validation preview. The plaintext key is held only in this
  // component's local state — never in context or localStorage.
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

  const handleClose = useCallback(() => {
    attemptedSignInRef.current = false
    setDialogOpen(false)
    setApiKeyInput('')
    setPreview(null)
    setPreviewError(null)
  }, [])

  const handleSignIn = useCallback(() => {
    attemptedSignInRef.current = true
    void signInAsync(apiKey)
  }, [apiKey, signInAsync])

  return (
    <>
      <Box>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid size={{ xs: 6 }}>
            <Typography variant="h4">Sign In</Typography>
          </Grid>
          <Grid size={{ xs: 6 }} sx={{ textAlign: 'right' }}>
            <Button onClick={() => setDialogOpen(true)} variant="contained">
              Sign in / Register
            </Button>
          </Grid>
        </Grid>

        <PrivacyNotice />
      </Box>

      <BootstrapDialog
        onClose={handleClose}
        open={dialogOpen}
        aria-labelledby="sign-in-register-title"
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            sx: {
              alignSelf: 'flex-start',
              marginTop: '6rem',
            },
          },
        }}
      >
        <DialogTitle id="sign-in-register-title" sx={{ m: 0, p: 2 }}>
          Sign In / Register
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent dividers>
          {apiKey && !loadingPreview && previewError && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{previewError}</Alert>
            </Box>
          )}

          <Typography variant="body1" gutterBottom>
            Enter your Torn API key here.
          </Typography>
          <Typography component={'p'} variant="body1" gutterBottom>
            If you don't have an API key you can get one from your Torn settings page.
          </Typography>
          <Typography component={'p'} variant="body1" gutterBottom>
            <Link
              href="https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm&#39;s tools&type=1"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textDecoration: 'none',
                fontWeight: 'bold',
                color: (theme) => theme.palette.grey[500],
                '&:hover': { color: (theme) => theme.palette.grey[500] },
                '&:visited': { color: (theme) => theme.palette.grey[500] },
              }}
            >
              Click here for a Public API key
            </Link>
            .
          </Typography>
          <Typography component={'p'} variant="body1" gutterBottom>
            <Link
              href="https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm&#39;s tools&type=2"
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                textDecoration: 'none',
                fontWeight: 'bold',
                color: (theme) => theme.palette.success.main,
                '&:hover': { color: (theme) => theme.palette.success.main },
                '&:visited': { color: (theme) => theme.palette.success.main },
              }}
            >
              Click here for a Minimal API key
            </Link>
            .
          </Typography>
          <TextField
            label="Torn API Key"
            variant="outlined"
            value={apiKey}
            onChange={(e) => setApiKeyInput(e.target.value)}
            sx={{ mt: 2 }}
            type={showKey ? 'text' : 'password'}
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

          {loadingPreview && (
            <Box sx={{ mt: 2 }}>
              <Loading message="Loading profile..." />
            </Box>
          )}

          {apiKey && !loadingPreview && !previewError && preview && (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert severity="success" sx={{ mt: 2, py: 2 }}>
                  Loaded successfully!
                </Alert>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Alert
                  severity="info"
                  sx={{
                    mb: { xs: 0, sm: 0 },
                    mt: { xs: 0, sm: 2 },
                  }}
                >
                  {preview.profile.name} [{preview.profile.id}]
                  <br />
                  {preview.profile.gender}, level {preview.profile.level}
                </Alert>
              </Grid>
            </Grid>
          )}

          {apiKey && !loadingPreview && !previewError && preview && (
            <Box>
              <Divider sx={{ mt: 2, mb: 3 }} />
              <Typography variant="body1" gutterBottom>
                Click the button below to add your API key. By doing so you agree to the usage terms
                and that your data will be stored and used as described.
              </Typography>
              {errorDotNetUserDetails && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {errorDotNetUserDetails}
                </Alert>
              )}
              <Button
                fullWidth
                variant="contained"
                sx={{ my: 2 }}
                onClick={handleSignIn}
                disabled={loadingDotNetUserDetails}
              >
                {loadingDotNetUserDetails ? 'Signing in…' : 'Sign in'}
              </Button>
            </Box>
          )}
        </DialogContent>
      </BootstrapDialog>
    </>
  )
}

export default SignIn
