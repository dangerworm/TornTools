import { Grid, Slider, Typography } from '@mui/material'
import { useState } from 'react'
import { getFormattedText, type PrefixUnit, type SuffixUnit } from '../lib/textFormat'

interface SteppedSliderProps {
  initialMinIndex?: number
  initialMaxIndex?: number
  label: string
  prefixUnit: PrefixUnit
  suffixUnit: SuffixUnit
  sliderValues: number[]
  onValueChange: (minValue: number, maxValue: number) => void
}

const SteppedSlider = ({
  sliderValues,
  initialMinIndex,
  initialMaxIndex,
  onValueChange,
  label,
  prefixUnit,
  suffixUnit,
}: SteppedSliderProps) => {
  const lastIndex = sliderValues.length - 1
  const [range, setRange] = useState<[number, number]>([
    initialMinIndex ?? 0,
    initialMaxIndex ?? lastIndex,
  ])

  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    if (!Array.isArray(newValue)) return
    const [lo, hi] = newValue as [number, number]
    setRange([lo, hi])
    onValueChange(sliderValues[lo], sliderValues[hi])
  }

  const formatBound = (idx: number) => getFormattedText(prefixUnit, sliderValues[idx], suffixUnit)

  return (
    <Grid size={{ xs: 12, sm: 8, md: 4 }} alignItems="center">
      <Typography gutterBottom>
        <strong>{label}:</strong> {formatBound(range[0])} – {formatBound(range[1])}
      </Typography>
      <Slider
        value={range}
        onChange={handleSliderChange}
        max={lastIndex}
        min={0}
        step={1}
        valueLabelDisplay="off"
        disableSwap
        sx={{ width: '95%' }}
      />
    </Grid>
  )
}

export default SteppedSlider
