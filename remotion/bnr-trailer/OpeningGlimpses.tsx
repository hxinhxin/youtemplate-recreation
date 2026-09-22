import { AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { theme } from "./theme";
import { ENERGY_ORDER } from "./energyOrder";

// Footage plays continuously throughout — cutting between the most
// energetic clips at these frames, never dropping to black between cuts.
// Each cut gets a quick brightness pulse for a "flash of memory" feel,
// with the base grade dark/moody for tension, but the video is always on
// screen. Cycles through ENERGY_ORDER so the earliest cuts are the most
// alive footage.
const CUT_STARTS = [0, 20, 38, 54, 68, 80, 90, 98, 104];

export const OpeningGlimpses: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const cuts = CUT_STARTS.filter((s) => s < durationInFrames);
  let cutIndex = 0;
  for (let i = 0; i < cuts.length; i++) {
    if (frame >= cuts[i]) cutIndex = i;
  }
  const cutStart = cuts[cutIndex];
  const localFrame = frame - cutStart;
  const clipIndex = ENERGY_ORDER[cutIndex % ENERGY_ORDER.length];

  // Quick blur-to-sharp snap + brightness pulse on every cut.
  const cutBlur = interpolate(localFrame, [0, 4], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashPulse = interpolate(localFrame, [0, 1, 6], [0.55, 0.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Base darkness eases up slightly as the section builds (tension ->
  // anticipation), but never goes fully black. Lightened from 0.6/0.4 —
  // it was crushing the footage too dark.
  const darkness = interpolate(frame, [0, durationInFrames], [0.32, 0.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // A low rumble-shake builds in over the last stretch, like tension
  // right before the reveal.
  const rumble = interpolate(frame, [durationInFrames - 24, durationInFrames], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 6) * rumble;

  const zoom = interpolate(localFrame, [0, 20], [1.08, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={CLIPS[clipIndex].src}
        startFrom={150 + clipIndex * 15}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // The darkness overlay below does the "moody" reduction — the
          // source itself stays bright so there's real footage to dim,
          // not a source that's already dark.
          filter: `blur(${cutBlur}px) contrast(1.2) saturate(0.85) brightness(1.15)`,
          transform: `translateX(${shakeX}px) scale(${zoom})`,
        }}
      />

      {/* Moody dark grade — never fully opaque, footage always reads through */}
      <AbsoluteFill style={{ backgroundColor: "#000000", opacity: darkness }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(5,5,5,0.42) 100%)",
        }}
      />

      {/* Brightness pulse on every cut */}
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashPulse }} />
    </AbsoluteFill>
  );
};
