import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Badge, Box, Drawer, Fab, IconButton, Tooltip, Typography } from '@mui/material'
import { useEffect, useState, type ReactNode } from 'react'
import SectionHeader from './SectionHeader'

export const FILTER_DRAWER_WIDTH = 300
const COLLAPSED_STRIP_WIDTH = 44
const COLLAPSE_TRANSITION = '500ms cubic-bezier(0.22, 0.61, 0.36, 1)'
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

  const hasActive = (activeCount ?? 0) > 0
  const countLabel = activeCount === 1 ? '1 active filter' : `${activeCount ?? 0} active filters`
  const strippedToggleTitle = hasActive ? `Show filters — ${countLabel}` : 'Show filters'

  // Single animated panel — width transitions between strip and full so
  // the table flex-widens/narrows smoothly instead of snapping.
  const desktopPanel = (
    <Box
      sx={{
        borderLeft: '1px solid rgba(200, 150, 12, 0.16)',
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        flexShrink: 0,
        maxHeight: '100%',
        overflow: 'hidden',
        transition: `width ${COLLAPSE_TRANSITION}`,
        width: collapsed ? COLLAPSED_STRIP_WIDTH : FILTER_DRAWER_WIDTH,
      }}
    >
      {collapsed ? (
        <Box
          sx={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            pb: 2,
            pt: 1.5,
          }}
        >
          <Tooltip title={strippedToggleTitle} placement="left">
            <IconButton
              aria-label={strippedToggleTitle}
              onClick={() => setCollapsed(false)}
              size="small"
              sx={{ color: 'primary.main' }}
            >
              <Badge
                badgeContent={hasActive ? activeCount : undefined}
                color="secondary"
                overlap="circular"
              >
                <ChevronLeftIcon />
              </Badge>
            </IconButton>
          </Tooltip>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              letterSpacing: '0.15em',
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
            overflowY: 'auto',
            p: 2,
            width: FILTER_DRAWER_WIDTH,
          }}
        >
          <SectionHeader
            variant="subtitle1"
            action={
              <Tooltip title="Hide filters">
                <IconButton
                  aria-label="hide filters"
                  onClick={() => setCollapsed(true)}
                  size="small"
                >
                  <ChevronRightIcon />
                </IconButton>
              </Tooltip>
            }
          >
            {title}
          </SectionHeader>
          {children}
        </Box>
      )}
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
    <Tooltip title={strippedToggleTitle} placement="left">
      <Fab
        color="primary"
        aria-label={strippedToggleTitle}
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
    </Tooltip>
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
