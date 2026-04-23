import { Alert, AlertTitle, Typography } from '@mui/material'
import { Link } from 'react-router'
import { Fragment } from 'react/jsx-runtime'

const LoginRequiredForFairness = () => {
  return (
    <Fragment>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Login required</AlertTitle>
        <Typography variant="body1" gutterBottom>
          You must be signed in with at least a <strong>Public</strong> access key to access the
          resale opportunities tool. <Link to="/signin">Sign in here</Link>.
        </Typography>
      </Alert>
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Why is login required?</AlertTitle>
        <Typography variant="body1" gutterBottom>
          This tool requires access to Torn's market data, and to get that I have to scan the
          markets periodically. The more keys I have, the more accurate and up-to-date the data
          becomes.
        </Typography>
        <Typography variant="body1" gutterBottom></Typography>
        <Typography variant="body1" gutterBottom>
          Since this page uses that scanned data, it's only made available to people who have
          contributed their API key to the pool.
        </Typography>
      </Alert>
    </Fragment>
  )
}

export default LoginRequiredForFairness
