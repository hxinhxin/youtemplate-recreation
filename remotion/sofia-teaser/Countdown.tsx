import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { LightBurst } from "./LightBurst";

// Computed once at module load — a snapshot of "time remaining" as of
// whenever this is rendered, since the video itself is a fixed export.
const target = new Date(concertInfo.targetDate).getTime();
const diffMs = Math.max(target - Date.now(), 0);
const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
const totalHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
const totalMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

const pad = (n: number) => Math.max(0, Math.round(n)).toString().padStart(2, "0");

const LANDING_FRAME = 30;

export const Countdown: React.FC = () => {
  const frame = useCurrentFrame();

  // Numbers tick up rapidly into place — a "counter" reveal rather than a
  // literal ticking clock, since this is a fixed render.
  const progress = interpolate(frame, [0, LANDING_FRAME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const days = progress * totalDays;
  const hours = progress * totalHours;
  const minutes = progress * totalMinutes;

  // Harder overshoot on landing — punches out past 1.25x before settling.
  const settle = interpolate(frame, [LANDING_FRAME, LANDING_FRAME + 5, LANDING_FRAME + 14], [1, 1.25, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });

  // Quick screen shake right on impact.
  const shakeWindow = frame - LANDING_FRAME;
  const shakeMag = interpolate(shakeWindow, [0, 10], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeMag > 0 ? Math.sin(shakeWindow * 9) * shakeMag : 0;
  const shakeY = shakeMag > 0 ? Math.cos(shakeWindow * 11) * shakeMag : 0;

  const labelOpacity = interpolate(frame, [LANDING_FRAME + 6, LANDING_FRAME + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glow = interpolate(frame, [LANDING_FRAME, LANDING_FRAME + 5, LANDING_FRAME + 20], [0, 40, 14], {
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
      <LightBurst triggerFrame={LANDING_FRAME} />

      <div
        style={{
          textAlign: "center",
          transform: `scale(${settle}) translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 200,
            lineHeight: 1,
            textShadow: `0 0 ${glow}px ${theme.accent}`,
          }}
        >
          {pad(days)}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.accent,
            fontSize: 36,
            letterSpacing: 8,
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
            fontSize: 56,
            marginTop: 32,
          }}
        >
          {pad(hours)}:{pad(minutes)}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.text,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            marginTop: 28,
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
