import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { MAX_CONTENT_WIDTH } from '../constants/uiConstants'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import '../index.css'
import Footer from './Footer'
import { DRAWER_WIDTH, menuItems } from './Menu'
import TopAppBar from './TopAppBar'

export default function Layout() {
  const { items } = useItems()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dotNetUserDetails } = useUser()

  const handleDrawerToggle = () => setMobileOpen((prev) => !prev)

  const drawerContent = useMemo(() => {
    const isActive = (to: string) => {
      if (to === '/') return location.pathname === '/'
      return location.pathname === to || location.pathname.startsWith(`${to}/`)
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Toolbar sx={{ display: { xs: 'flex', md: 'none' } }} />
        <Divider />
        <List sx={{ flexGrow: 1 }}>
          {menuItems.map((item) => {
            let isDisabled = false
            isDisabled = isDisabled || (item.requiresItems && (!items || items.length === 0))
            isDisabled = isDisabled || (item.requiresLogin && !dotNetUserDetails)

            const userAccessLevel = dotNetUserDetails?.accessLevel ?? 1
            const hasAccess =
              item.requiresAccessLevel == null || userAccessLevel >= item.requiresAccessLevel
            isDisabled = isDisabled || (item.requiresAccessLevel != null && !hasAccess)

            return (
              <ListItemButton
                component={NavLink}
                key={item.address}
                onClick={() => setMobileOpen(false)}
                selected={isActive(item.address)}
                to={item.address}
                sx={(theme) => ({
                  color: isDisabled ? theme.palette.action.disabled : 'inherit',
                  borderLeft: `3px solid ${isActive(item.address) ? theme.palette.primary.main : 'transparent'}`,
                  pl: '13px',
                  transition: 'border-color 0.2s',
                })}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.title} />
              </ListItemButton>
            )
          })}
        </List>
        <Footer />
      </Box>
    )
  }, [dotNetUserDetails, items, location.pathname])

  return (
    <Box
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[900],
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <TopAppBar handleDrawerToggle={handleDrawerToggle} />

      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          display: { xs: 'block', md: 'flex' },
          flexGrow: 1,
          maxWidth: MAX_CONTENT_WIDTH,
          mx: 'auto',
          overflow: 'hidden',
          width: '100%',
        }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'flex' },
            flexDirection: 'column',
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              position: 'relative',
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              overflow: 'auto',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            maxWidth: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
            overflow: 'auto',
            p: 3,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  )
}
