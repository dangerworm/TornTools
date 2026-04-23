import CloseIcon from '@mui/icons-material/Close'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Badge, Box, Drawer, Fab, IconButton, Typography } from '@mui/material'
import { useState, type ReactNode } from 'react'
import SectionHeader from './SectionHeader'

export const FILTER_DRAWER_WIDTH = 300

interface FilterDrawerProps {
  children: ReactNode
  // Rendered above the filter content on desktop and mobile — label
  // for the drawer (e.g. "Filters").
  title?: string
  // Number of active filters — surfaced on the mobile FAB.
  activeCount?: number
  // Optional slot for page-layout content on the main side (e.g. the table).
  // When provided, this component renders the flex shell. When omitted,
  // render this component as a sibling inside your own flex container.
  main?: ReactNode
}

const PanelContent = ({ title, children }: { title: string; children: ReactNode }) => (
  <Box sx={{ p: 2 }}>
    <SectionHeader variant="subtitle1">{title}</SectionHeader>
    {children}
  </Box>
)

const FilterDrawer = ({ activeCount, children, main, title = 'Filters' }: FilterDrawerProps) => {
  const [mobileOpen, setMobileOpen] = useState(false)

  const desktopPanel = (
    <Box
      sx={{
        borderLeft: '1px solid rgba(200, 150, 12, 0.16)',
        bgcolor: 'background.paper',
        display: { xs: 'none', md: 'block' },
        flexShrink: 0,
        width: FILTER_DRAWER_WIDTH,
        maxHeight: '100%',
        overflowY: 'auto',
      }}
    >
      <PanelContent title={title}>{children}</PanelContent>
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
      <Badge
        badgeContent={activeCount && activeCount > 0 ? activeCount : undefined}
        color="secondary"
      >
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
