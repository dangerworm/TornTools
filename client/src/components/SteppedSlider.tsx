import { Slider, Typography } from "@mui/material";
import { useState } from "react";

interface SteppedSliderProps {
  initialValueIndex?: number;
  label: string;
  prefixUnit: PrefixUnit;
  suffixUnit: SuffixUnit;
  sliderValues: number[];
  onValueChange: (newValue: number) => void;
}

type PrefixUnit = "$" | "";
type SuffixUnit = "minute" | "";

const getValueWithSuffix = (prefixUnit: PrefixUnit, value: number, suffixUnit: SuffixUnit): string => {
  const outputValue = value.toLocaleString();
  
  if (suffixUnit === "") {
    return `${prefixUnit}${outputValue}`;
  }

  if (suffixUnit === "minute" && value > 59) {
    const hours = Math.floor(value / 60);
    const suffix = hours === 1 ? "hour" : "hours";
    return `${hours} ${suffix}`;
  }

  if (suffixUnit === "minute") {
    const suffix = value === 1 ? "minute" : "minutes";
    return `${value} ${suffix}`;
  }

  return outputValue;
};

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
        <strong>{label}:</strong>{" "}
        {getValueWithSuffix(prefixUnit, sliderValues[sliderValueIndex], suffixUnit)}
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
