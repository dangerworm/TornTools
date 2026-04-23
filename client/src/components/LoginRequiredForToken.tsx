import { Alert, AlertTitle, Link, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router'
import { Fragment } from 'react/jsx-runtime'

const LoginRequiredForToken = () => {
  return (
    <Fragment>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Login required</AlertTitle>
        <Typography variant="body1" gutterBottom>
          You must be signed in with at least a <strong>Minimal</strong> access key to use the
          Bazaar Price Lookup tool.{' '}
          <Link component={RouterLink} to="/signin">
            Sign in here
          </Link>
          .
        </Typography>
      </Alert>
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Why is login required?</AlertTitle>
        <Typography variant="body1" gutterBottom>
          This tool requires access to your personal Torn market data, and for that I need a&nbsp;
          <strong>Minimal</strong> API key.
        </Typography>
      </Alert>
    </Fragment>
  )
}

export default LoginRequiredForToken
