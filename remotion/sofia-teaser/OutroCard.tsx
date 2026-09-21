import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { OUTRO_DURATION } from "./durations";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 15, OUTRO_DURATION], [0.92, 1, 1.03], {
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
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: "0 60px" }}>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 64,
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
            fontSize: 32,
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.day} · {concertInfo.dateLabel}
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.accent,
            fontSize: 44,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
