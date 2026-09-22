import { AbsoluteFill, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "./FilmGrain";

export const droneClipSrc = staticFile("videos/bnr-drone-01.mov");

// Scene 0 — the very first thing the viewer sees: a wide aerial shot of
// the crowd pouring into the venue. Establishing scale before the trailer
// cuts into the tighter, darker opening glimpses. A quick fade up from
// black at the start (never a hard cut in), full-bleed and always moving
// (slow continuous push-in), so it never reads as a still photo.
export const DroneOpen: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      <OffthreadVideo
        src={droneClipSrc}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: fadeIn,
          transform: `scale(${zoom})`,
          filter: "contrast(1.1) saturate(1.05) brightness(1.05)",
        }}
      />

      {/* Light vignette only — this is the establishing shot, keep the
          scale and the crowd clearly readable rather than moody-dark. */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(5,5,5,0.3) 100%), linear-gradient(to top, rgba(5,5,5,0.28) 0%, transparent 30%)",
          opacity: fadeIn,
        }}
      />

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
