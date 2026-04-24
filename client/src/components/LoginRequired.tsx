import { Alert, AlertTitle, Link, Typography } from '@mui/material'
import { Fragment } from 'react/jsx-runtime'
import { Link as RouterLink } from 'react-router'
import { useUser } from '../hooks/useUser'

export type AccessLevelName = 'public' | 'minimal'

type LevelConfig = {
  label: string
  value: number
  keyType: number
}

const ACCESS_LEVELS: Record<AccessLevelName, LevelConfig> = {
  public: { label: 'Public', value: 1, keyType: 1 },
  minimal: { label: 'Minimal', value: 2, keyType: 2 },
}

interface LoginRequiredProps {
  tool: string
  requiredLevel: AccessLevelName
}

const buildKeyUrl = (keyType: number) =>
  `https://www.torn.com/preferences.php#tab=api?&step=addNewKey&title=dangerworm%27s%20tools&type=${keyType}`

const PublicRationale = () => (
  <Fragment>
    <Typography variant="body1" gutterBottom>
      This tool reads the item markets, which I scan periodically using a pool of volunteered API
      keys. The more keys I have, the more accurate and up-to-date the data becomes.
    </Typography>
    <Typography variant="body1">
      Because this page uses that scanned data, it's only available to people who've contributed
      their key to the pool.
    </Typography>
  </Fragment>
)

const MinimalRationale = () => (
  <Typography variant="body1">
    This tool reads your personal Torn inventory, so it needs a key with at least{' '}
    <strong>Minimal</strong> access.
  </Typography>
)

const LoginRequired = ({ tool, requiredLevel }: LoginRequiredProps) => {
  const { dotNetUserDetails } = useUser()
  const level = ACCESS_LEVELS[requiredLevel]
  const currentAccessLevel = dotNetUserDetails?.accessLevel ?? 0
  const signedIn = !!dotNetUserDetails
  const needsUpgrade = signedIn && currentAccessLevel < level.value
  const rationale = requiredLevel === 'minimal' ? <MinimalRationale /> : <PublicRationale />

  if (needsUpgrade) {
    const keyUrl = buildKeyUrl(level.keyType)
    return (
      <Fragment>
        <Alert severity="warning" sx={{ mb: 2 }}>
          <AlertTitle>{level.label} access required</AlertTitle>
          <Typography variant="body1" gutterBottom>
            {tool} requires a key with at least <strong>{level.label}</strong> access. Your current
            key has a lower access level.
          </Typography>
          <Typography variant="body1">
            To upgrade,{' '}
            <Link href={keyUrl} target="_blank" rel="noopener noreferrer">
              generate a new {level.label} API key
            </Link>{' '}
            then update it{' '}
            <Link component={RouterLink} to="/settings">
              here
            </Link>
            .
          </Typography>
        </Alert>
        <Alert severity="info" sx={{ mb: 2 }}>
          <AlertTitle>Why is {level.label} access required?</AlertTitle>
          {rationale}
        </Alert>
      </Fragment>
    )
  }

  return (
    <Fragment>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <AlertTitle>Sign in required</AlertTitle>
        <Typography variant="body1">
          You must be signed in with at least a <strong>{level.label}</strong> access key to use{' '}
          {tool}.{' '}
          <Link component={RouterLink} to="/signin">
            Sign in here
          </Link>
          .
        </Typography>
      </Alert>
      <Alert severity="info" sx={{ mb: 2 }}>
        <AlertTitle>Why is sign-in required?</AlertTitle>
        {rationale}
      </Alert>
    </Fragment>
  )
}

export default LoginRequired
