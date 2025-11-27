export const getSecondsSinceLastUpdate = (lastUpdated: Date): number => {
  const d = new Date(lastUpdated);
  return (Date.now() - d.getTime()) / 1000;
};

export const timeAgo = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = (d.getTime() - Date.now()) / 1000; // seconds difference

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  for (const [unit, secondsInUnit] of units) {
    const value = Math.min(diff, 0) / secondsInUnit;
    if (Math.abs(value) >= 1) {
      return rtf
        .format(Math.round(value), unit)
        .replace("hour", "hr")
        .replace("minute", "min")
        .replace("second", "sec");
    }
  }

  // For some reason the difference is sometimes less than 1 second
  // Doesn't matter for now, so return "just now"
  return "just now";
};