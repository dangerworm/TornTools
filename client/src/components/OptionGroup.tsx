import { Grid, ToggleButtonGroup, ToggleButton, Typography } from '@mui/material'
import type { LabelValue } from '../types/common'

interface OptionGroupProps {
  options: LabelValue[]
  selectedOption: string | number
  title: string
  titleInline?: boolean
  handleOptionChange: (event: React.MouseEvent<HTMLElement>, newValue: string | number) => void
}

const OptionGroup = ({
  options,
  selectedOption,
  title,
  titleInline = false,
  handleOptionChange,
}: OptionGroupProps) => {
  return (
    <Grid container spacing={0} alignItems="center">
      {titleInline ? (
        <>
          <Grid size={{ xs: 12 }}>
            <Typography component={'span'} variant="subtitle1" sx={{ mr: 2 }}>
              {title}
            </Typography>
            <ToggleButtonGroup
              color="primary"
              exclusive
              onChange={handleOptionChange}
              size={'small'}
              value={selectedOption}
            >
              {options.map((option) => (
                <ToggleButton value={option.value} sx={{ px: 1 }}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
        </>
      ) : (
        <>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {title}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <ToggleButtonGroup
              color="primary"
              exclusive
              onChange={handleOptionChange}
              size={'small'}
              value={selectedOption}
            >
              {options.map((option) => (
                <ToggleButton value={option.value} sx={{ px: 1 }}>
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Grid>
        </>
      )}
    </Grid>
  )
}

export default OptionGroup
