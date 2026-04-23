import CloseIcon from '@mui/icons-material/Close'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Badge, Box, Drawer, Fab, IconButton, Tooltip, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import SectionHeader from './SectionHeader'

export const FILTER_DRAWER_WIDTH = 300
const COLLAPSED_STRIP_WIDTH = 44
const COLLAPSE_STORAGE_KEY = 'torntools:ui:filter-drawer:collapsed:v1'

interface FilterDrawerProps {
  children: ReactNode
  // Rendered above the filter content on desktop and mobile — label
  // for the drawer (e.g. "Filters").
  title?: string
  // Number of active filters — surfaced on the mobile FAB and the
  // collapsed-strip badge so density is never fully hidden.
  activeCount?: number
  // Optional slot for page-layout content on the main side (e.g. the table).
  // When provided, this component renders the flex shell. When omitted,
  // render this component as a sibling inside your own flex container.
  main?: ReactNode
}

const FilterDrawer = ({ activeCount, children, main, title = 'Filters' }: FilterDrawerProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed))
    } catch {
      // localStorage unavailable - preference resets next session
    }
  }, [collapsed])

  const hasActive = activeCount && activeCount > 0

  const desktopPanel = collapsed ? (
    <Box
      sx={{
        alignItems: 'flex-start',
        borderLeft: '1px solid rgba(200, 150, 12, 0.16)',
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        flexShrink: 0,
        gap: 1,
        pt: 1.5,
        width: COLLAPSED_STRIP_WIDTH,
      }}
    >
      <Tooltip title="Show filters" placement="left">
        <IconButton
          aria-label="show filters"
          onClick={() => setCollapsed(false)}
          size="small"
          sx={{ color: 'primary.main', mx: 'auto' }}
        >
          <Badge badgeContent={hasActive ? activeCount : undefined} color="secondary">
            <ChevronLeftIcon />
          </Badge>
        </IconButton>
      </Tooltip>
      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
          letterSpacing: '0.15em',
          mx: 'auto',
          textTransform: 'uppercase',
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          mt: 1,
        }}
      >
        {title}
      </Typography>
    </Box>
  ) : (
    <Box
      sx={{
        borderLeft: '1px solid rgba(200, 150, 12, 0.16)',
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'block' },
        flexShrink: 0,
        maxHeight: '100%',
        overflowY: 'auto',
        width: FILTER_DRAWER_WIDTH,
      }}
    >
      <Box sx={{ p: 2 }}>
        <SectionHeader
          variant="subtitle1"
          action={
            <Tooltip title="Hide filters">
              <IconButton aria-label="hide filters" onClick={() => setCollapsed(true)} size="small">
                <ChevronRightIcon />
              </IconButton>
            </Tooltip>
          }
        >
          {title}
        </SectionHeader>
        {children}
      </Box>
    </Box>
  )

  const mobileDrawer = (
    <Drawer
      anchor="right"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      sx={{
        display: { xs: 'block', md: 'none' },
        '& .MuiDrawer-paper': {
          width: Math.min(FILTER_DRAWER_WIDTH + 20, 360),
          maxWidth: '90vw',
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}>
        <Typography variant="h6" sx={{ ml: 1, color: 'primary.main' }}>
          {title}
        </Typography>
        <IconButton aria-label="close filters" onClick={() => setMobileOpen(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Box sx={{ p: 2 }}>{children}</Box>
    </Drawer>
  )

  const mobileFab = (
    <Fab
      color="primary"
      aria-label="open filters"
      onClick={() => setMobileOpen(true)}
      sx={{
        display: { xs: 'inline-flex', md: 'none' },
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Badge badgeContent={hasActive ? activeCount : undefined} color="secondary">
        <FilterListIcon />
      </Badge>
    </Fab>
  )

  if (main !== undefined) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0, pr: { md: 2 } }}>{main}</Box>
          {desktopPanel}
        </Box>
        {mobileDrawer}
        {mobileFab}
      </>
    )
  }

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
      {mobileFab}
    </>
  )
}

export default FilterDrawer
