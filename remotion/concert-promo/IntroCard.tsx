import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";
import { INTRO_DURATION } from "./durations";

export const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  // Pop in over the first 15 frames, then a slow continuous drift for the
  // rest of the card's hold so it doesn't sit completely still.
  const scale = interpolate(frame, [0, 15, INTRO_DURATION], [0.9, 1, 1.05], {
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
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 96,
            lineHeight: 1.05,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.name}
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            marginTop: 24,
            color: theme.accent,
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.date}
        </div>
      </div>
    </AbsoluteFill>
  );
};
