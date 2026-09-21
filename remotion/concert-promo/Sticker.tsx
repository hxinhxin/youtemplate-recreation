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

  const pop = spring({ frame, fps, config: { damping: 11, stiffness: 200, mass: 0.5 } });
  const exitFrames = 12;
  const exit = interpolate(
    frame,
    [durationInFrames - exitFrames, durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const breathe = 1 + Math.sin(frame / 9) * 0.04;
  const scale = Math.min(pop, 1) * exit * breathe;
  const wiggle = Math.sin(frame / 5) * 3;

  return (
    <div style={{ position: "absolute", ...positionStyle }}>
      <Img
        src={src}
        style={{
          width,
          transform: `scale(${scale}) rotate(${rotate + wiggle}deg)`,
          transformOrigin: "center",
        }}
      />
    </div>
  );
};
