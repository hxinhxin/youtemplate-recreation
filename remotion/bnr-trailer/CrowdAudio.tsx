import { Audio, interpolate, useCurrentFrame } from "remotion";

// Plays a clip's own embedded audio (crowd noise, DJ, room tone) under the
// music with a short fade in/out, so the crowd is actually audible during
// its own footage instead of being buried under the track.
export const CrowdAudio: React.FC<{
  src: string;
  startFrom?: number;
  durationInFrames: number;
  volume?: number;
  fadeFrames?: number;
}> = ({ src, startFrom = 0, durationInFrames, volume = 0.55, fadeFrames = 24 }) => {
  const frame = useCurrentFrame();
  const envelope = interpolate(
    frame,
    [0, fadeFrames, durationInFrames - fadeFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return <Audio src={src} startFrom={startFrom} volume={envelope * volume} />;
};
