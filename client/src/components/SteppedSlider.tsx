import { Grid, Slider, Typography } from '@mui/material'
import { useState } from 'react'
import { getFormattedText, type PrefixUnit, type SuffixUnit } from '../lib/textFormat'

interface SteppedSliderProps {
  initialValueIndex?: number
  label: string
  prefixUnit: PrefixUnit
  suffixUnit: SuffixUnit
  sliderValues: number[]
  onValueChange: (newValue: number) => void
}

export default function SteppedSlider({
  sliderValues,
  initialValueIndex,
  onValueChange,
  label,
  prefixUnit,
  suffixUnit,
}: SteppedSliderProps) {
  const [sliderValueIndex, setSliderValueIndex] = useState(initialValueIndex ?? 0)

  const handleSliderChange = (_: Event, newIndex: number) => {
    setSliderValueIndex(newIndex)
    onValueChange(sliderValues[newIndex])
  }

  return (
    <Grid size={{ xs: 12, sm: 8, md: 4 }} alignItems="center">
      <Typography gutterBottom>
        <strong>{label}:</strong>{' '}
        {getFormattedText(prefixUnit, sliderValues[sliderValueIndex], suffixUnit)}
      </Typography>
      <Slider
        value={sliderValueIndex}
        onChange={handleSliderChange}
        max={sliderValues.length - 1}
        min={0}
        step={1}
        valueLabelDisplay="off"
        sx={{ width: '95%' }}
      />
    </Grid>
  )
}
