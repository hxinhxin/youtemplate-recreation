import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";

// Computed once at module load — a snapshot of "time remaining" as of
// whenever this is rendered, since the video itself is a fixed export.
const target = new Date(concertInfo.targetDate).getTime();
const diffMs = Math.max(target - Date.now(), 0);
const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
const totalHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
const totalMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

const pad = (n: number) => Math.max(0, Math.round(n)).toString().padStart(2, "0");

export const Countdown: React.FC = () => {
  const frame = useCurrentFrame();

  // Numbers tick up rapidly into place — a "counter" reveal rather than a
  // literal ticking clock, since this is a fixed render.
  const progress = interpolate(frame, [0, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const days = progress * totalDays;
  const hours = progress * totalHours;
  const minutes = progress * totalMinutes;

  const settle = interpolate(frame, [30, 36, 42], [1, 1.1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [36, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${settle})` }}>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 160,
            lineHeight: 1,
          }}
        >
          {pad(days)}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.accent,
            fontSize: 32,
            letterSpacing: 6,
            marginTop: 8,
          }}
        >
          DAYS TO GO
        </div>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.textMuted,
            fontSize: 48,
            marginTop: 28,
          }}
        >
          {pad(hours)}:{pad(minutes)}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.text,
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: 3,
            marginTop: 24,
            opacity: labelOpacity,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.day} · {concertInfo.venue}
        </div>
      </div>
    </AbsoluteFill>
  );
};
