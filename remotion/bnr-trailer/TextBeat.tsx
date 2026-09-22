import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";

// Minimal, powerful single-word reveal card — large bold lettering with a
// hard slam-in and a subtle continuous drift, per the brief's "keep
// typography minimal, clean and powerful."
export const TextBeat: React.FC<{ word: string; durationInFrames: number }> = ({
  word,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 8, 14, durationInFrames], [0.5, 1.15, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 8, 20], [0, 50, 20], {
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
          transform: `scale(${scale})`,
          opacity,
          fontFamily: theme.headlineFont,
          fontWeight: 900,
          color: theme.white,
          fontSize: 140,
          letterSpacing: 4,
          textTransform: "uppercase",
          textShadow: `0 0 ${glow}px ${theme.red}`,
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};
