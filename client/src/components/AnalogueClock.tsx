type AnalogueClockProps = {
  date: Date;
  size?: number;
  timeZone?: string;
};

const AnalogueClock = ({ date, size = 150, timeZone }: AnalogueClockProps) => {
  let hours = date.getHours() % 12;
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  if (timeZone) {
     const formatter = new Intl.DateTimeFormat("en-GB", {
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
      timeZone,
    });

    const parts = formatter.formatToParts(date);
    const getPart = (type: "hour" | "minute" | "second") =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);

    hours = getPart("hour");
    minutes = getPart("minute");
    seconds = getPart("second");
  }

  const secondDeg = (seconds / 60) * 360;
  const minuteDeg = ((minutes + seconds / 60) / 60) * 360;
  const hourDeg = ((hours + minutes / 60) / 12) * 360;

  const borderSize = Math.max(2, size * 0.015);
  const centreSize = size * 0.05;

  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        border: `${borderSize}px solid #333`,
      }}
    >
      {/* hour hand */}
      <div
        style={{
          position: "absolute",
          width: size * 0.025,
          height: "35%",
          background: "#333",
          top: "15%",
          left: "50%",
          transformOrigin: "50% 100%",
          transform: `translateX(-50%) rotate(${hourDeg}deg)`,
        }}
      />

      {/* minute hand */}
      <div
        style={{
          position: "absolute",
          width: size * 0.02,
          height: "45%",
          background: "#555",
          top: "5%",
          left: "50%",
          transformOrigin: "50% 100%",
          transform: `translateX(-50%) rotate(${minuteDeg}deg)`,
        }}
      />

      {/* second hand */}
      <div
        style={{
          position: "absolute",
          width: size * 0.01,
          height: "45%",
          background: "red",
          top: "5%",
          left: "50%",
          transformOrigin: "50% 100%",
          transform: `translateX(-50%) rotate(${secondDeg}deg)`,
        }}
      />

      {/* centre dot */}
      <div
        style={{
          position: "absolute",
          width: centreSize,
          height: centreSize,
          borderRadius: "50%",
          background: "#333",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />
    </div>
  );
};

export default AnalogueClock;