import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { INTRO_DURATION } from "./durations";
import { LightBurst } from "./LightBurst";

export const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  // Hard overshoot slam-in instead of a gentle fade-up.
  const scale = interpolate(frame, [0, 10, 16, INTRO_DURATION], [0.5, 1.2, 1, 1.06], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2.5)),
  });

  const barWidth = interpolate(frame, [10, 22], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const glow = interpolate(frame, [0, 10, 30], [0, 36, 16], {
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
      <LightBurst triggerFrame={0} />

      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: "0 60px" }}>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 96,
            lineHeight: 1.02,
            textTransform: "uppercase",
            textShadow: `0 0 ${glow}px ${theme.accent}`,
          }}
        >
          {concertInfo.act}
        </div>
        <div
          style={{
            width: barWidth,
            height: 5,
            background: theme.accent,
            margin: "20px auto",
          }}
        />
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.accent,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};
