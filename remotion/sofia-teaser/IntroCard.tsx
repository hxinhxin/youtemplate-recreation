import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { INTRO_DURATION } from "./durations";
import { LightBurst } from "./LightBurst";
import { ImpactFlash } from "./ImpactFlash";
import { RadialRays } from "./RadialRays";

export const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  // Hard overshoot slam-in instead of a gentle fade-up.
  const scale = interpolate(frame, [0, 9, 16, INTRO_DURATION], [0.4, 1.3, 1, 1.08], {
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

  const barWidth = interpolate(frame, [8, 20], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const glow = interpolate(frame, [0, 8, 30], [0, 55, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
            fontSize: 100,
            lineHeight: 1.0,
            textTransform: "uppercase",
            textShadow: `0 0 ${glow}px ${theme.accent}`,
          }}
        >
          {concertInfo.act}
        </div>
        <div
          style={{
            width: barWidth,
            height: 6,
            background: theme.accent,
            margin: "22px auto",
            boxShadow: `0 0 18px ${theme.accent}`,
          }}
        />
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.accent,
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: 7,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};
