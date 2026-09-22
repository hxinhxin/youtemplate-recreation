import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import type { TextVariant } from "./typographyBeats";

// Minimal, powerful single-word reveal card. Each of the 4 typography
// beats gets its own entrance style (variant) instead of repeating the
// same animation, so BNR / SOFIA / JOY STATION / SATURDAY each land
// differently.
export const TextBeat: React.FC<{
  word: string;
  durationInFrames: number;
  variant?: TextVariant;
}> = ({ word, durationInFrames, variant = "slam" }) => {
  const frame = useCurrentFrame();

  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 8, 20], [0, 50, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let transform = "";
  let blur = 0;
  let letterSpacing = 4;

  if (variant === "slam") {
    const scale = interpolate(frame, [0, 8, 14, durationInFrames], [0.5, 1.15, 1, 1.04], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(3)),
    });
    blur = interpolate(frame, [0, 8], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    letterSpacing = 4 + interpolate(frame, [0, 12], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    transform = `scale(${scale})`;
  } else if (variant === "slideLeft") {
    // Slides in fast from the right, settles with a slight overshoot.
    const x = interpolate(frame, [0, 14, 20], [420, -18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    blur = interpolate(frame, [0, 10], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    transform = `translateX(${x}px)`;
  } else if (variant === "dropTop") {
    // Drops from above with a small bounce, like it fell into place.
    const y = interpolate(frame, [0, 14, 20, 26], [-500, 30, -10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    transform = `translateY(${y}px)`;
  } else if (variant === "scaleRotate") {
    // Spins in from tiny, settling with no rotation.
    const scale = interpolate(frame, [0, 16], [0.2, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2.5)),
    });
    const rotate = interpolate(frame, [0, 16], [-25, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    transform = `scale(${scale}) rotate(${rotate}deg)`;
  }

  // Longer words (e.g. "JOY STATION") get a smaller size so they never
  // overflow the 1080px canvas.
  const fontSize = word.length > 8 ? 92 : word.length > 5 ? 118 : 140;

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
          transform,
          opacity,
          filter: blur ? `blur(${blur}px)` : undefined,
          fontFamily: theme.headlineFont,
          fontWeight: 900,
          color: theme.white,
          fontSize,
          letterSpacing,
          textTransform: "uppercase",
          textShadow: `0 0 ${glow}px ${theme.red}`,
          textAlign: "center",
          padding: "0 40px",
        }}
      >
        {word}
      </div>
    </AbsoluteFill>
  );
};
