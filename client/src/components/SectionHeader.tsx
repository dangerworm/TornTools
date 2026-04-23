import { Box, Typography, type TypographyProps } from '@mui/material'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  children: ReactNode
  // Optional right-aligned content (e.g., an action button or chip).
  action?: ReactNode
  // Defaults to h6 which is usually right for a sub-section.
  variant?: TypographyProps['variant']
  // Slim variant drops the hairline — for tighter contexts.
  hairline?: boolean
  // Extra sx on the wrapper.
  sx?: object
}

const SectionHeader = ({
  action,
  children,
  hairline = true,
  sx,
  variant = 'h6',
}: SectionHeaderProps) => (
  <Box
    sx={{
      alignItems: 'flex-end',
      borderBottom: hairline ? '1px solid rgba(200, 150, 12, 0.24)' : 'none',
      display: 'flex',
      gap: 2,
      justifyContent: 'space-between',
      mb: 1.5,
      pb: hairline ? 0.5 : 0,
      ...sx,
    }}
  >
    <Typography
      variant={variant}
      sx={{
        color: 'primary.main',
        letterSpacing: '0.02em',
        mb: 0,
      }}
    >
      {children}
    </Typography>
    {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
  </Box>
)

export default SectionHeader
