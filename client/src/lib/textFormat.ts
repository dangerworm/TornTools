
export type PrefixUnit = "$" | "";
export type SuffixUnit = "minute" | "%" | "x" | "";

const getValueWithPrefix = (prefixUnit: PrefixUnit, value: number): string => {
  const outputValue = value.toLocaleString();

  return value < 0
    ? `-${prefixUnit}${Math.abs(value).toLocaleString()}`
    : `${prefixUnit}${outputValue}`;
}

const getValueWithSuffix = (value: number, suffixUnit: SuffixUnit): string => {
  if (suffixUnit === "minute" && value > 59) {
    const hours = Math.floor(value / 60);
    const suffix = hours === 1 ? "hour" : "hours";
    return `${hours} ${suffix}`;
  }

  if (suffixUnit === "minute") {
    const suffix = value === 1 ? "minute" : "minutes";
    return `${value} ${suffix}`;
  }

  if (suffixUnit === "%") {
    const percentageValue = value.toFixed(1);
    return `${percentageValue}${suffixUnit}`;
  }

  return `${value.toLocaleString()}${suffixUnit}`;
}

export const getFormattedText = (prefixUnit: PrefixUnit, value: number, suffixUnit: SuffixUnit): string => {
  if (prefixUnit === "" && suffixUnit === "") {
    return value.toLocaleString();
  }

  let result = "";

  if (prefixUnit !== "") {
    result += getValueWithPrefix(prefixUnit, value);
  }

  if (suffixUnit !== "") {
    result += getValueWithSuffix(value, suffixUnit);
  }

  return result;
};
