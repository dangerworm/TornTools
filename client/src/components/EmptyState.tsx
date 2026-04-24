import { Box, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  // An optional small illustration (SVG / icon component) displayed above the message.
  illustration?: ReactNode
  title?: string
  message: ReactNode
  action?: ReactNode
  dense?: boolean
}

const EmptyState = ({ action, dense = false, illustration, message, title }: EmptyStateProps) => (
  <Box
    sx={{
      alignItems: 'center',
      border: '1px dashed rgba(200, 150, 12, 0.25)',
      borderRadius: 1,
      color: 'text.secondary',
      display: 'flex',
      flexDirection: 'column',
      gap: 1,
      justifyContent: 'center',
      mx: 'auto',
      my: dense ? 2 : 4,
      px: 3,
      py: dense ? 3 : 5,
      textAlign: 'center',
    }}
  >
    {illustration && (
      <Box sx={{ color: 'primary.main', opacity: 0.7, '& svg': { width: 48, height: 48 } }}>
        {illustration}
      </Box>
    )}
    {title && (
      <Typography variant="h6" sx={{ color: 'text.primary' }}>
        {title}
      </Typography>
    )}
    <Typography variant="body1" sx={{ maxWidth: 480 }}>
      {message}
    </Typography>
    {action && <Box sx={{ mt: 1 }}>{action}</Box>}
  </Box>
)

export default EmptyState
