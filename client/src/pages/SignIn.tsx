import {
  Alert,
  Paper,
  TableContainer,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Grid,
  Button,
  Box,
  Dialog,
  styled,
  DialogTitle,
  IconButton,
  DialogContent,
  Divider,
  Link,
  AlertTitle,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import Loading from '../components/Loading'
import { useUser } from '../hooks/useUser'
import { useState } from 'react'

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

  const dataStorageColor = (theme: any) => ({
    color: theme.palette.mode === 'dark' ? 'red' : 'darkred',
  })

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

        <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
          API key usage
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Why sign in?</AlertTitle>
          <Typography variant="body2" gutterBottom>
            Signing in gives you access to additional features like favourite markets, resale
            listings, saved theme preferences, and others. It also powers features tailored to your
            personal Torn profile such as automatic country selection when travelling, and in the
            future (when I get around to it) personalised alerts and notifications based on your
            actions here as well as in-game activities.
          </Typography>
        </Alert>

        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>API key sharing notice</AlertTitle>
          <Typography variant="body2" gutterBottom>
            However, signing in requires you to share your API key. It will be added to a pool of
            keys used to fetch data from Torn. This will increase the number of calls made to Torn
            using your API key and will count towards the limit of 100 calls per minute dictated by
            the{' '}
            <Link
              href="https://wiki.torn.com/wiki/API#:~:text=Each%20user%20can%20make%20up,or%20invalid%20keys%20upon%20error."
              target="_blank"
              rel="noopener noreferrer"
            >
              Torn API Terms of Service
            </Link>
            .
          </Typography>
        </Alert>

        <Alert severity="success" sx={{ mb: 2 }}>
          <AlertTitle>Benefits of Sharing Your API Key</AlertTitle>
          <Typography variant="body2" gutterBottom>
            Adding your key helps to populate market data faster and reduces the load on all users'
            API limits. This ensures that data is fetched more efficiently for everyone.
          </Typography>
        </Alert>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          How your data is used
        </Typography>

        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Data Storage</TableCell>
                <TableCell>Data Sharing</TableCell>
                <TableCell>Purpose of Use</TableCell>
                <TableCell>Key Storage & Sharing</TableCell>
                <TableCell>Key Access Level</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Will the data be stored for any purpose?</TableCell>
                <TableCell>Who can access the data besides the end user?</TableCell>
                <TableCell>What is the stored data being used for?</TableCell>
                <TableCell>Will the API key be stored securely and who can access it?</TableCell>
                <TableCell>What key access level or specific selections are required?</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={dataStorageColor}>Persistent - until account deletion</TableCell>
                <TableCell sx={dataStorageColor}>General public</TableCell>
                <TableCell sx={dataStorageColor}>Public community tools</TableCell>
                <TableCell sx={dataStorageColor}>Stored/used only for automation</TableCell>
                <TableCell sx={dataStorageColor}>Public</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
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
              href="https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm&#39;s tools&type=1"
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
