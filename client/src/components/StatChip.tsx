import { Chip, type ChipProps } from '@mui/material'

export type StatChipVariant = 'profit' | 'loss' | 'neutral' | 'experimental' | 'tradable' | 'status'

interface StatChipProps extends Omit<ChipProps, 'color' | 'variant'> {
  chipVariant: StatChipVariant
}

// Consolidates the green/red profit chips, the orange Experimental badge,
// the green Tradable pill, and status colours used across the app.
//
// Callers pass a `chipVariant` (rather than `variant` which MUI reserves for
// filled/outlined). The component picks colours that play well with the
// brass-and-noir palette without shouting.
const VARIANT_SX: Record<StatChipVariant, object> = {
  profit: {
    backgroundColor: 'rgba(76, 175, 80, 0.18)',
    borderColor: 'rgba(76, 175, 80, 0.5)',
    color: '#7bc57f',
  },
  loss: {
    backgroundColor: 'rgba(220, 80, 60, 0.18)',
    borderColor: 'rgba(220, 80, 60, 0.5)',
    color: '#e88b7c',
  },
  neutral: {
    backgroundColor: 'rgba(200, 150, 12, 0.12)',
    borderColor: 'rgba(200, 150, 12, 0.4)',
    color: '#d4a24a',
  },
  experimental: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    borderColor: 'rgba(255, 152, 0, 0.55)',
    color: '#ffb952',
  },
  tradable: {
    backgroundColor: 'rgba(100, 180, 100, 0.18)',
    borderColor: 'rgba(100, 180, 100, 0.5)',
    color: '#8dd48c',
  },
  status: {
    backgroundColor: 'rgba(200, 200, 200, 0.08)',
    borderColor: 'rgba(200, 200, 200, 0.35)',
    color: '#cfc8bc',
  },
}

const StatChip = ({ chipVariant, sx, size = 'small', ...rest }: StatChipProps) => {
  return (
    <Chip
      size={size}
      variant="outlined"
      sx={{
        fontWeight: 500,
        borderRadius: 1,
        letterSpacing: '0.02em',
        ...VARIANT_SX[chipVariant],
        ...sx,
      }}
      {...rest}
    />
  )
}

export default StatChip
