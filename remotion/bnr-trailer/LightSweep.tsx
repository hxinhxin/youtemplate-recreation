import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

// A single bright vertical light beam sweeping across the frame — the cue
// that something is about to be revealed. Local to the parent Sequence's
// frame numbering.
export const LightSweep: React.FC<{ startFrame?: number; durationInFrames?: number }> = ({
  startFrame = 0,
  durationInFrames = 22,
}) => {
  const frame = useCurrentFrame();
  const local = frame - startFrame;
  if (local < 0 || local > durationInFrames) return null;

  const progress = local / durationInFrames;
  const xPercent = interpolate(progress, [0, 1], [-25, 125]);
  const opacity = interpolate(progress, [0, 0.15, 0.85, 1], [0, 0.85, 0.85, 0]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: `${xPercent}%`,
          width: "12%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)",
          opacity,
          filter: "blur(8px)",
          transform: "skewX(-14deg)",
        }}
      />
    </AbsoluteFill>
  );
};
