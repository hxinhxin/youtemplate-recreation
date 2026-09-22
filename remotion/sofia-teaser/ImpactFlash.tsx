import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// A near-instant white hit-flash at the moment of impact — 3 frames total,
// gone before it reads as a color shift. Classic trailer "punch" device.
export const ImpactFlash: React.FC<{ triggerFrame: number; peak?: number }> = ({
  triggerFrame,
  peak = 0.85,
}) => {
  const frame = useCurrentFrame();
  const local = frame - triggerFrame;
  const opacity = interpolate(local, [0, 1, 3], [0, peak, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (opacity <= 0) return null;

  return (
    <AbsoluteFill
      style={{ pointerEvents: "none", backgroundColor: "#ffffff", opacity }}
    />
  );
};
