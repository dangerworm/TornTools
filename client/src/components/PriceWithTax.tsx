import { Box, Typography, type TypographyProps } from '@mui/material'
import { getFormattedText } from '../lib/textFormat'

interface PriceWithTaxProps {
  // Pre-tax price (the headline number).
  value: number | null | undefined
  // Fraction (0-1) deducted by the outlet. When omitted or 0 only the
  // primary value renders — the component gracefully collapses.
  taxRate?: number
  // Typography variant for the primary value. Defaults to body1-ish.
  primaryVariant?: TypographyProps['variant']
  // Aligns the numbers — defaults to right (table-friendly).
  align?: 'left' | 'right' | 'inherit'
  // Renders the tax line inline with " · after N% tax" rather than
  // stacked beneath the primary value. Useful in dense cells.
  inline?: boolean
}

const PriceWithTax = ({
  align = 'right',
  inline = false,
  primaryVariant = 'body1',
  taxRate,
  value,
}: PriceWithTaxProps) => {
  if (value == null) {
    return (
      <Typography variant={primaryVariant} align={align} color="text.disabled">
        &mdash;
      </Typography>
    )
  }

  const primary = getFormattedText('$', value, '')
  const hasTax = taxRate != null && taxRate > 0
  const netValue = hasTax ? value * (1 - taxRate) : null
  const netLabel =
    netValue != null
      ? `${getFormattedText('$', netValue, '')} after ${Math.round(taxRate! * 100)}% tax`
      : null

  if (!hasTax) {
    return (
      <Typography variant={primaryVariant} align={align}>
        {primary}
      </Typography>
    )
  }

  if (inline) {
    return (
      <Typography variant={primaryVariant} align={align}>
        {primary}
        <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
          · {netLabel}
        </Typography>
      </Typography>
    )
  }

  return (
    <Box
      sx={{
        textAlign: align,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : 'center',
      }}
    >
      <Typography variant={primaryVariant}>{primary}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {netLabel}
      </Typography>
    </Box>
  )
}

export default PriceWithTax
