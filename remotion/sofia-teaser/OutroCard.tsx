import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { OUTRO_DURATION } from "./durations";
import { LightBurst } from "./LightBurst";
import { ImpactFlash } from "./ImpactFlash";
import { RadialRays } from "./RadialRays";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 10, 18, OUTRO_DURATION], [0.45, 1.25, 1, 1.05], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3.5)),
  });

  const shakeMag = interpolate(frame, [0, 14], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeMag > 0 ? Math.sin(frame * 10) * shakeMag : 0;
  const shakeY = shakeMag > 0 ? Math.cos(frame * 8) * shakeMag : 0;

  // CTA line gets its own delayed pop and a pulsing glow to draw the eye.
  const ctaPop = interpolate(frame, [22, 30], [0.6, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(4)),
  });
  const ctaOpacity = interpolate(frame, [22, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaGlow = 26 + Math.sin(frame / 5) * 16;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <RadialRays />
      <LightBurst triggerFrame={0} />
      <ImpactFlash triggerFrame={0} />

      <div
        style={{
          opacity,
          transform: `scale(${scale}) translate(${shakeX}px, ${shakeY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 72,
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
            fontSize: 50,
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
