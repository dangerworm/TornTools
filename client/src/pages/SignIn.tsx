import CloseIcon from '@mui/icons-material/Close'
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
  Link,
  styled,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import Loading from '../components/Loading'
import PrivacyNotice from '../components/PrivacyNotice'
import { useUser } from '../hooks/useUser'

const BootstrapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialogContent-root': {
    padding: theme.spacing(2),
  },
  '& .MuiDialogActions-root': {
    padding: theme.spacing(1),
  },
}))

const SignIn = () => {
  const {
    apiKey,
    setApiKey,
    tornUserProfile,
    loadingTornUserProfile,
    errorTornUserProfile,
    confirmApiKeyAsync,
  } = useUser()

  const [dialogOpen, setDialogOpen] = useState(false)

  const handleClose = () => {
    setDialogOpen(false)
  }

  const handleSignIn = () => {
    confirmApiKeyAsync()
    setDialogOpen(false)
  }

  return (
    <>
      <Box>
        <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
          Account Sign-In
        </Typography>

        <PrivacyNotice />

        <Button
          onClick={() => setDialogOpen(true)}
          sx={{ ml: 'auto', mr: 'auto', mt: 3, display: 'block' }}
          variant="contained"
        >
          Sign in / Register
        </Button>
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

        <DialogContent dividers sx={{}}>
          {apiKey && !loadingTornUserProfile && errorTornUserProfile && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="error">{errorTornUserProfile}</Alert>
            </Box>
          )}

          <Typography variant="body1" gutterBottom>
            Enter your Torn API key here.
          </Typography>
          <Typography component={'p'} variant="body2" gutterBottom>
            If you don't have an API key you can get one from your{' '}
            <Link
              href="https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm&#39;s tools&type=2"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textDecoration: 'none' }}
            >
              Torn settings page
            </Link>
            .
          </Typography>
          <TextField
            label="Torn API Key"
            variant="outlined"
            value={apiKey || ''}
            onChange={(e) => setApiKey(e.target.value || null)}
            sx={{ mt: 2 }}
            type={'password'}
          />

          {loadingTornUserProfile && (
            <Box sx={{ mt: 2 }}>
              <Loading message="Loading profile..." />
            </Box>
          )}

          {apiKey && !loadingTornUserProfile && !errorTornUserProfile && tornUserProfile && (
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
                    mb: {
                      xs: 0,
                      sm: 0,
                    },
                    mt: {
                      xs: 0,
                      sm: 2,
                    },
                  }}
                >
                  {tornUserProfile.name} [{tornUserProfile.id}]
                  <br />
                  {tornUserProfile.gender}, level {tornUserProfile.level}
                </Alert>
              </Grid>
            </Grid>
          )}

          {apiKey && !loadingTornUserProfile && !errorTornUserProfile && tornUserProfile && (
            <Box>
              <Divider sx={{ mt: 2, mb: 3 }} />
              <Typography variant="body1" gutterBottom>
                Click the button below to add your API key. By doing so you agree to the usage terms
                and that your data will be stored and used as described.
              </Typography>
              <Button fullWidth variant="contained" sx={{ my: 2 }} onClick={() => handleSignIn()}>
                Sign in
              </Button>
            </Box>
          )}
        </DialogContent>
      </BootstrapDialog>
    </>
  )
}

export default SignIn
