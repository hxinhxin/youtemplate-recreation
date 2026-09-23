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
  const drift = interpolate(frame, [0, durationInFrames], zoomingIn ? [1, 1.3] : [1.3, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Harder punch-in on every cut — bigger overshoot, snappier settle —
  // so each clip lands with more force instead of just fading up.
  const impact = interpolate(frame, [0, 10], [1.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.6)),
  });

  // A quick handheld-style jolt on landing — direction alternates by
  // index so it doesn't read as a repeating tic — settling out fast.
  const shakeSign = index % 2 === 0 ? 1 : -1;
  const shakeDecay = interpolate(frame, [0, 8], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shakeX = shakeSign * 16 * shakeDecay;
  const shakeY = -shakeSign * 10 * shakeDecay;

  const audioFade = interpolate(
    frame,
    [0, 10, durationInFrames - 10, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // A quick white flash riding in with the punch-in reinforces the hit
  // beyond what the transition's own flash already gives.
  const hitFlash = interpolate(frame, [0, 3, 9], [0.42, 0.14, 0], {
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
          transform: `translate(${shakeX}px, ${shakeY}px) scale(${drift * impact})`,
          filter: "contrast(1.15) saturate(1.32) brightness(1.03)",
        }}
      />

      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.62) 100%)" }}
      />

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: hitFlash }} />

      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};
