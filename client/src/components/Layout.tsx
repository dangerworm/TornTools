import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Toolbar,
} from '@mui/material'
import { Fragment, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { MAX_CONTENT_WIDTH } from '../constants/uiConstants'
import { useItems } from '../hooks/useItems'
import { useUser } from '../hooks/useUser'
import '../index.css'
import BargainAlertToast from './BargainAlertToast'
import Footer from './Footer'
import {
  DRAWER_WIDTH,
  menuItems,
  SECTION_LABELS,
  SECTION_ORDER,
  type MenuItem as NavMenuItem,
  type MenuSection,
} from './Menu'
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

    const disabledFor = (item: NavMenuItem) => {
      if (item.requiresItems && (!items || items.length === 0)) return true
      if (item.requiresLogin && !dotNetUserDetails) return true
      const userAccessLevel = dotNetUserDetails?.accessLevel ?? 1
      if (item.requiresAccessLevel != null && userAccessLevel < item.requiresAccessLevel) {
        return true
      }
      return false
    }

    const renderItem = (item: NavMenuItem) => {
      const disabled = disabledFor(item)
      const active = isActive(item.address)
      const color = disabled ? 'action.disabled' : active ? 'primary.main' : 'text.secondary'
      return (
        <ListItemButton
          component={NavLink}
          key={item.address}
          onClick={() => setMobileOpen(false)}
          selected={active}
          to={item.address}
          sx={(theme) => ({
            color,
            borderLeft: `3px solid ${active ? theme.palette.primary.main : 'transparent'}`,
            pl: '13px',
            transition: 'border-color 0.2s, color 0.15s',
            '&:hover': {
              color: disabled ? 'action.disabled' : 'primary.main',
            },
            '& .MuiListItemText-primary': {
              fontWeight: active ? 500 : 400,
            },
          })}
        >
          <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.title} />
        </ListItemButton>
      )
    }

    const ungrouped = menuItems.filter((item) => !item.section)
    const grouped: Record<MenuSection, NavMenuItem[]> = {
      markets: [],
      utilities: [],
      you: [],
    }
    menuItems.forEach((item) => {
      if (item.section) grouped[item.section].push(item)
    })

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Toolbar sx={{ display: { xs: 'flex', md: 'none' } }} />
        <Divider />
        <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
          {ungrouped.length > 0 && <List disablePadding>{ungrouped.map(renderItem)}</List>}
          {SECTION_ORDER.map((section) => {
            const sectionItems = grouped[section]
            if (sectionItems.length === 0) return null
            return (
              <Fragment key={section}>
                <Divider sx={{ my: 0.5 }} />
                <List
                  disablePadding
                  subheader={
                    <ListSubheader
                      component="div"
                      disableSticky
                      sx={{
                        bgcolor: 'transparent',
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        lineHeight: 2,
                      }}
                    >
                      {SECTION_LABELS[section]}
                    </ListSubheader>
                  }
                >
                  {sectionItems.map(renderItem)}
                </List>
              </Fragment>
            )
          })}
        </Box>
        <Footer />
      </Box>
    )
  }, [dotNetUserDetails, items, location.pathname])

  return (
    <Box
      sx={{
        backgroundColor: 'grey.900',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
      }}
    >
      <TopAppBar handleDrawerToggle={handleDrawerToggle} />
      <BargainAlertToast />

      <Box
        sx={{
          backgroundColor: (theme) => theme.palette.background.default,
          display: 'flex',
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
