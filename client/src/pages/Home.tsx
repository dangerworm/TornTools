import { Link } from 'react-router'
import { Alert, AlertTitle, Card, CardContent, Divider, Grid, Typography } from '@mui/material'
import Loading from '../components/Loading'
import { menuItems } from '../constants/Menu'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import { useMemo } from 'react'

const Home = () => {
  const { loading, items } = useItems()
  const { dotNetUserDetails } = useUser()

  const visibleMenuItems = useMemo(
    () =>
      menuItems
        .filter((item) => item.showOnHomePage)
        .filter((item) => !item.requiresItems || (item.requiresItems && items))
        .filter((item) => !item.requiresLogin || (item.requiresLogin && dotNetUserDetails)),
    [items, dotNetUserDetails],
  )

  return (
    <>
      <Typography variant="h3" gutterBottom className="passero-one">
        dangerworm&apos;s Tools
      </Typography>

      <Divider sx={{ mb: 3 }} />

      <Typography variant="body1" gutterBottom>
        This website hosts a collection of tools for the game{' '}
        <a href="https://www.torn.com/index.php" target="_blank" rel="noopener noreferrer">
          Torn
        </a>
        .
      </Typography>
      <Typography variant="body1" gutterBottom>
        This is a personal project and not affiliated with Torn or its developers. Use at your own
        risk.
      </Typography>

      <Divider sx={{ mt: 3 }} />
      {loading && <Loading message="Loading items..." />}

      {!loading && (
        <>
          <Typography gutterBottom sx={{ mt: 3 }} variant="h5">
            Tools
          </Typography>

          {visibleMenuItems.length !== menuItems.length - 1 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Some tools are hidden</AlertTitle>
              <Typography variant="body2" gutterBottom>
                To access all tools, ensure you are <Link to="/signin">logged in</Link>.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {visibleMenuItems.map((item) => (
              <Grid key={item.address} size={{ xs: 12, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h5" gutterBottom>
                      <Link to={item.address} className="no-underline">
                        {item.title}
                      </Link>
                    </Typography>
                    <Typography variant="body1">{item.subTitle}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </>
  )
}

export default Home
