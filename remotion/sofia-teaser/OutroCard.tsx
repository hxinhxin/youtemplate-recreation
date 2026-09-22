import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { OUTRO_DURATION } from "./durations";
import { LightBurst } from "./LightBurst";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 12, 18, OUTRO_DURATION], [0.6, 1.15, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  // CTA line gets its own delayed pop and a pulsing glow to draw the eye.
  const ctaPop = interpolate(frame, [22, 30], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const ctaOpacity = interpolate(frame, [22, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaGlow = 20 + Math.sin(frame / 6) * 10;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <LightBurst triggerFrame={0} />

      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: "0 60px" }}>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 68,
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.venue}
        </div>

        <div
          style={{
            marginTop: 20,
            fontFamily: theme.bodyFont,
            color: theme.textMuted,
            fontSize: 34,
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.day} · {concertInfo.dateLabel}
        </div>

        <div
          style={{
            marginTop: 52,
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.accent,
            fontSize: 48,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: ctaOpacity,
            transform: `scale(${ctaPop})`,
            textShadow: `0 0 ${ctaGlow}px ${theme.accent}`,
          }}
        >
          {concertInfo.cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
