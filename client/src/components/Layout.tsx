import { useMemo, useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
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
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import { DRAWER_WIDTH, menuItems } from '../constants/Menu'
import { MAX_CONTENT_WIDTH } from '../constants/UiConstants'
import TopAppBar from './TopAppBar'
import Footer from './Footer'
import '../index.css'

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
      <Box>
        <Toolbar sx={{ display: { xs: 'flex', md: 'none' } }} />
        <Divider />
        <List>
          {menuItems
            .filter((item) => !item.requiresItems || (item.requiresItems && items))
            .filter((item) => !item.requiresLogin || (item.requiresLogin && dotNetUserDetails))
            .map((item) => {
              if (item.requiresItems && (!items || items.length === 0)) return null

              return (
                <ListItemButton
                  component={NavLink}
                  key={item.address}
                  onClick={() => setMobileOpen(false)}
                  selected={isActive(item.address)}
                  to={item.address}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </ListItemButton>
              )
            })}
        </List>
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
        justifyContent: 'center',
        minHeight: '100vh',
      }}
    >
      <TopAppBar handleDrawerToggle={handleDrawerToggle} />

      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          display: { xs: 'block', md: 'flex' },
          maxWidth: MAX_CONTENT_WIDTH,
          mx: 'auto',
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
            display: { xs: 'none', md: 'block' },
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              position: 'relative',
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        <Box
          component="main"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flexGrow: 1,
            maxWidth: { xs: '100%', md: `calc(100% - ${DRAWER_WIDTH}px)` },
            minHeight: '100vh',
            p: 3,
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <Outlet />
          </Box>

          <Footer />
        </Box>
      </Box>
    </Box>
  )
}
