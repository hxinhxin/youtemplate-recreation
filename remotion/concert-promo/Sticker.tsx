import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const Sticker: React.FC<{
  src: string;
  durationInFrames: number;
  width: number;
  rotate?: number;
  positionStyle: React.CSSProperties;
}> = ({ src, durationInFrames, width, rotate = 0, positionStyle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Lower damping so the spring visibly overshoots past 1x before settling
  // — a punchier bounce-in instead of a soft clamp to full size.
  const pop = spring({ frame, fps, config: { damping: 8, stiffness: 260, mass: 0.6 } });
  const exitFrames = 12;
  const exit = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const breathe = 1 + Math.sin(frame / 9) * 0.05;
  const scale = pop * exit * breathe;
  const wiggle = Math.sin(frame / 5) * 4;

  return (
    <div style={{ position: "absolute", ...positionStyle }}>
      <Img
        src={src}
        style={{
          width,
          transform: `scale(${scale}) rotate(${rotate + wiggle}deg)`,
          transformOrigin: "center",
          filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.55))",
        }}
      />
    </div>
  );
};
