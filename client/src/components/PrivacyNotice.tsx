import {
  Alert,
  AlertTitle,
  Box,
  Link,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'

const dataStorageColor = (theme: { palette: { mode: string } }) => ({
  color: theme.palette.mode === 'dark' ? 'red' : 'darkred',
})

export default function PrivacyNotice() {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
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
          Signing in requires you to share your API key. It will be added to a pool of keys used to
          fetch data from Torn. This will increase the number of calls made to Torn using your API
          key and will count towards the limit of 100 calls per minute dictated by the{' '}
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
        <AlertTitle>Benefits of sharing your API key</AlertTitle>
        <Typography variant="body2" gutterBottom>
          Adding your key helps to populate market data faster and reduces the load on all users'
          API limits. This ensures that data is fetched more efficiently for everyone.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Choosing your key access level
      </Typography>

      <Typography variant="body2" gutterBottom>
        Torn keys come in four access levels: <strong>Public</strong>, <strong>Minimal</strong>,{' '}
        <strong>Limited</strong>, and <strong>Full</strong>. This site only uses the selections it
        needs to deliver the features you choose to use. The choice of level is yours.
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 1, mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Access level</TableCell>
              <TableCell>Features unlocked</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <strong>Public</strong>
              </TableCell>
              <TableCell>
                Sign in, favourite items, theme preferences, Resale, and all other shared market
                features.
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <strong>Minimal</strong> (or higher)
              </TableCell>
              <TableCell>
                Everything above, plus the <strong>Bazaar Price Lookup</strong> page (reads your
                personal inventory so you can quickly compare your items against current bazaar
                prices).
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        How your data is used
      </Typography>

      <TableContainer component={Paper} sx={{ mt: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Data Storage</TableCell>
              <TableCell>Data Sharing</TableCell>
              <TableCell>Purpose of Use</TableCell>
              <TableCell>Key Storage &amp; Sharing</TableCell>
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
              <TableCell sx={dataStorageColor}>Public or Minimal+ (your choice)</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
