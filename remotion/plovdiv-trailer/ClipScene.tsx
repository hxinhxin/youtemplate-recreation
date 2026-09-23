import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import type { PlovdivClip } from "./clips";

// Full-bleed venue footage — Ken Burns zoom, a punch-in on entry, and a
// soft dark vignette. Native audio (crowd + PA) plays through rather
// than a separate track, since no music was supplied for this piece.
export const ClipScene: React.FC<{ clip: PlovdivClip; index: number; durationInFrames: number; volume?: number }> = ({
  clip,
  index,
  durationInFrames,
  volume = 0.85,
}) => {
  const frame = useCurrentFrame();

  const zoomingIn = index % 2 === 0;
  const drift = interpolate(frame, [0, durationInFrames], zoomingIn ? [1, 1.22] : [1.22, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const impact = interpolate(frame, [0, 8], [1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const audioFade = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={clip.startFrom}
        volume={volume * audioFade}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${drift * impact})`,
        }}
      />

      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 55%, rgba(3,3,3,0.45) 100%)",
        }}
      />

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
