import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import type { VenueClip } from "./venues";

export const ClipScene: React.FC<{ clip: VenueClip; index: number; volume?: number }> = ({
  clip,
  index,
  volume = 0.85,
}) => {
  const frame = useCurrentFrame();
  const durationInFrames = clip.durationInFrames;

  const zoomingIn = index % 2 === 0;
  const drift = interpolate(frame, [0, durationInFrames], zoomingIn ? [1, 1.24] : [1.24, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Harder punch-in on every cut — bigger overshoot, snappier settle —
  // so each clip lands with more force instead of just fading up.
  const impact = interpolate(frame, [0, 11], [1.32, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.4)),
  });

  const audioFade = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // A quick white flash riding in with the punch-in reinforces the hit
  // beyond what the transition's own flash already gives.
  const hitFlash = interpolate(frame, [0, 3, 9], [0.35, 0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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
          filter: "contrast(1.12) saturate(1.25) brightness(1.02)",
        }}
      />

      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.6) 100%)" }}
      />

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: hitFlash }} />

      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};
