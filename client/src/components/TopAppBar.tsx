import {
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material'
import {
  AppBar,
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from '@mui/material'
import { useState, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { MAX_CONTENT_WIDTH } from '../constants/uiConstants'
import { useUser } from '../hooks/useUser'
import '../index.css'
import ItemSearch from './ItemSearch'

interface TopAppBarProps {
  handleDrawerToggle: () => void
}

function TopAppBar({ handleDrawerToggle }: TopAppBarProps) {
  const navigate = useNavigate()
  const { dotNetUserDetails, logoutAsync } = useUser()

  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget)
  }

  const handleCloseMenu = () => setMenuAnchor(null)

  const handleSignOut = async () => {
    await logoutAsync()
    navigate('/')
    handleCloseMenu()
  }

  return (
    <AppBar
      position="relative"
      sx={{
        maxWidth: MAX_CONTENT_WIDTH,
        mx: 'auto',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {/* Hamburger only on small screens */}
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
            aria-label="open drawer"
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            component="div"
            className="passero-one"
            sx={{ display: { xs: 'none', md: 'block' } }}
          >
            dangerworm&apos;s Tools
          </Typography>
        </Box>

        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexGrow: 1,
            justifyContent: { xs: 'flex-start', sm: 'center' },
            mr: { xs: 1, sm: 0 },
          }}
        >
          <ItemSearch />
        </Box>

        <Box sx={{ ml: 'auto' }}>
          {dotNetUserDetails ? (
            <>
              <IconButton
                color="inherit"
                onClick={handleOpenMenu}
                aria-label="user menu"
                aria-controls={menuAnchor ? 'user-menu' : undefined}
                aria-haspopup="true"
              >
                <AccountCircle sx={{ fontSize: 32 }} />
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={handleCloseMenu}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <MenuItem
                  disabled
                  sx={(theme) => ({
                    color: theme.palette.text.primary,
                    opacity: '0.8 !important',
                    cursor: 'default',
                  })}
                >
                  <Typography variant="body1">
                    {dotNetUserDetails.name} [{dotNetUserDetails.id}]
                  </Typography>
                </MenuItem>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleSignOut}>Sign out</MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/signin')}
              sx={{ fontWeight: 500 }}
            >
              Sign in
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default TopAppBar
