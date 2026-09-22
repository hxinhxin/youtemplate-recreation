import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import type { ClipConfig } from "../concert-promo/clips";
import { theme } from "./theme";

// Full-bleed concert footage for the reveal section — sweeping Ken Burns
// zoom, a punch-in on entry, and a dark/red vignette for mood. No caption
// per clip, keeping with "minimal, clean" typography used only for the
// dedicated word beats.
export const RevealClip: React.FC<{ clip: ClipConfig; index: number; durationInFrames: number }> = ({
  clip,
  index,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const zoomingIn = index % 2 === 0;
  const drift = interpolate(frame, [0, durationInFrames], zoomingIn ? [1, 1.25] : [1.25, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const impact = interpolate(frame, [0, 8], [1.15, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={clip.startFrom ?? 0}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${drift * impact})`,
        }}
      />

      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 55%, rgba(5,5,5,0.4) 100%), linear-gradient(to top, ${theme.redDeep}2b 0%, transparent 35%)`,
        }}
      />
    </AbsoluteFill>
  );
};
