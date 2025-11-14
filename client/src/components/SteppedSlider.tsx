import { Slider, Typography } from "@mui/material";
import { useState } from "react";

interface SteppedSliderProps {
  initialValueIndex?: number;
  label: string;
  prefixUnit: string;
  suffixUnit: string;
  sliderValues: number[];
  onValueChange: (newValue: number) => void;
}

export default function SteppedSlider({
  sliderValues,
  initialValueIndex,
  onValueChange,
  label,
  prefixUnit,
  suffixUnit,
}: SteppedSliderProps) {
  const [sliderValueIndex, setSliderValueIndex] = useState(
    initialValueIndex ?? 0
  );

  const handleSliderChange = (_: Event, newIndex: number) => {
    setSliderValueIndex(newIndex);
    onValueChange(sliderValues[newIndex]);
  };

  return (
    <>
      <Typography gutterBottom>
        {label}: {prefixUnit}{sliderValues[sliderValueIndex].toLocaleString()}{suffixUnit}
      </Typography>
      <Slider
        value={sliderValueIndex}
        onChange={handleSliderChange}
        max={sliderValues.length - 1}
        min={0}
        step={1}
        valueLabelDisplay="off"
        style={{ width: "80%" }}
      />
    </>
  );
}
