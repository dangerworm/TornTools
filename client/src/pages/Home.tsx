import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  Divider,
  Grid,
  Typography,
  type Theme,
} from '@mui/material'
import { motion } from 'framer-motion'
import { useCallback, useMemo } from 'react'
import { Link } from 'react-router'
import Loading from '../components/Loading'
import { menuItems, type MenuItem } from '../components/Menu'
import TopMovers from '../components/TopMovers'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'

const Home = () => {
  const { loading, items } = useItems()
  const { dotNetUserDetails } = useUser()

  const visibleMenuItems = useMemo(() => menuItems.filter((item) => item.showOnHomePage), [])

  const isDisabled = useCallback(
    (menuItem: MenuItem) => {
      const needsItems = menuItem.requiresItems && (!items || items.length === 0)
      const needsLogin = menuItem.requiresLogin && !dotNetUserDetails
      const needsAccessLevel =
        menuItem.requiresAccessLevel !== undefined &&
        (!dotNetUserDetails || dotNetUserDetails.accessLevel < menuItem.requiresAccessLevel)
      return needsItems || needsLogin || needsAccessLevel
    },
    [items, dotNetUserDetails],
  )

  const anyHidden = visibleMenuItems.some(isDisabled)

  return (
    <>
      <Typography variant="h3" gutterBottom sx={{ color: 'primary.main' }}>
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

          {anyHidden && !dotNetUserDetails && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Some tools are hidden</AlertTitle>
              <Typography variant="body1" gutterBottom>
                To access more tools, ensure you are <Link to="/signin">signed in</Link>.
              </Typography>
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {visibleMenuItems.map((item, index) => {
              const linkColour = (item: MenuItem, theme: Theme): string =>
                isDisabled(item) ? theme.palette.action.disabled : theme.palette.primary.main

              return (
                <Grid key={item.address} size={{ xs: 12, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.32, delay: index * 0.07, ease: 'easeOut' }}
                    style={{ height: '100%' }}
                  >
                    <Card
                      variant="outlined"
                      sx={{
                        height: '100%',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: (theme) => `0 2px 18px ${theme.palette.primary.main}30`,
                        },
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                          <Box sx={{ color: (theme) => linkColour(item, theme), display: 'flex' }}>
                            {item.icon}
                          </Box>
                          <Typography
                            variant="h5"
                            sx={{ color: (theme) => linkColour(item, theme), mb: 0 }}
                          >
                            <Link
                              to={item.address}
                              className="no-underline"
                              style={{ color: 'inherit' }}
                            >
                              {item.title}
                            </Link>
                          </Typography>
                        </Box>
                        <Typography variant="body1">{item.subTitle}</Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              )
            })}
          </Grid>

          <Typography gutterBottom sx={{ mt: 4 }} variant="h5">
            Today's movers
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Most-traded items in the last 24 hours, and which prices moved the most. Refreshed
            every six hours from the scanned Torn market history.
          </Typography>
          <TopMovers limit={5} />
        </>
      )}
    </>
  )
}

export default Home
