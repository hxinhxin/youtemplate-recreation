import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../concert-promo/theme";

// A brief radial glow pulse for hype beats (countdown landing, cuts).
// Pure opacity/scale on an overlay layer — doesn't touch the footage
// itself, so it never shifts color grading.
export const LightBurst: React.FC<{ triggerFrame: number; color?: string }> = ({
  triggerFrame,
  color = theme.accent,
}) => {
  const frame = useCurrentFrame();
  const local = frame - triggerFrame;
  const opacity = interpolate(local, [0, 3, 14], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(local, [0, 14], [0.6, 1.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: `radial-gradient(circle at 50% 45%, ${color} 0%, transparent 60%)`,
        transform: `scale(${scale})`,
      }}
    />
  );
};
