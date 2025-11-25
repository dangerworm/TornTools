import { useEffect, useState } from "react";
import { Grid, Typography } from "@mui/material";
import AnalogueClock from "./AnalogueClock";

const getOrdinalSuffix = (day: number): string => {
  if (day > 3 && day < 21) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

interface DateTimeDisplayProps {
  asTornTime: boolean;
  date?: Date;
  label: string;
  showDate?: boolean;
  size?: number;
}

const DateTimeDisplay = ({
  asTornTime,
  date,
  label,
  showDate = true,
  size = 150,
}: DateTimeDisplayProps) => {
  const [now, setNow] = useState(() => date ?? new Date());

  const getFormattedDate = (date: Date, asTornTime: boolean) => {
    const day = asTornTime ? date.getUTCDate() : date.getDate();
    const suffix = getOrdinalSuffix(day);

    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      month: "long",
      year: "numeric",
      hour12: true,
      ...(asTornTime ? { timeZone: "UTC" } : {}),
    };

    return `${date
      .toLocaleString(asTornTime ? "en-GB" : undefined, {
        ...options,
        day: "numeric",
      })
      .replace(String(day), `${day}${suffix}`)}`;
  };

  const getFormattedTime = (date: Date, asTornTime: boolean) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      second: showDate ? "2-digit" : undefined,
      hour12: true,
      ...(asTornTime ? { timeZone: "UTC" } : {}),
    };

    return `${date.toLocaleString(asTornTime ? "en-GB" : undefined, options)}`;
  };

  useEffect(() => {
    if (date) {
      setNow(date);
      return;
    }

    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [date]);

  return (
    <>
      <Typography variant="body1" sx={{ mb: 1 }}>
        <strong>{label}</strong>
      </Typography>
      <Grid container spacing={1} sx={{ mb: 2, alignItems: "center" }}>
        <Grid sx={{ width: size + 20, height: size }}>
          <AnalogueClock
            date={now}
            size={size}
            timeZone={asTornTime ? "UTC" : undefined}
          />
        </Grid>
        <Grid>
          {showDate && (
            <Typography variant="body1">
              {getFormattedDate(now, asTornTime)}
            </Typography>
          )}
          <Typography variant="body1">
            {getFormattedTime(now, asTornTime)}
          </Typography>
        </Grid>
      </Grid>
    </>
  );
};

export default DateTimeDisplay;
