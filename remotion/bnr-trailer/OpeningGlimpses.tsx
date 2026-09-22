import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
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

// One cut's video, in its own <Sequence> so useCurrentFrame() here is
// local to this cut (resets to 0 at the cut's start) — needed because
// OffthreadVideo's `startFrom` is combined with the LOCAL frame of its
// nearest Sequence, not the whole scene's frame. Without this wrapper,
// every cut after the first was seeking into the source using the full
// scene-elapsed frame count added on top of `startFrom`, drifting further
// wrong with each cut (this was the actual cause of random unrelated
// footage — e.g. a DJ-deck close-up — flashing during this scene).
const Cut: React.FC<{ clipIndex: number }> = ({ clipIndex }) => {
  const localFrame = useCurrentFrame();

  const cutBlur = interpolate(localFrame, [0, 4], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashPulse = interpolate(localFrame, [0, 1, 6], [0.55, 0.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const zoom = interpolate(localFrame, [0, 20], [1.08, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={CLIPS[clipIndex].src}
        startFrom={150 + clipIndex * 15}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          // The darkness overlay (rendered by the parent) does the
          // "moody" reduction — the source itself stays bright so
          // there's real footage to dim, not a source that's already
          // dark.
          filter: `blur(${cutBlur}px) contrast(1.2) saturate(0.85) brightness(1.15)`,
          transform: `scale(${zoom})`,
        }}
      />
      {/* Brightness pulse on every cut */}
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashPulse }} />
    </AbsoluteFill>
  );
};

export const OpeningGlimpses: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const cutStarts = CUT_STARTS.filter((s) => s < durationInFrames);
  const cuts = cutStarts.map((start, i) => ({
    start,
    duration: (i + 1 < cutStarts.length ? cutStarts[i + 1] : durationInFrames) - start,
    clipIndex: ENERGY_ORDER[i % ENERGY_ORDER.length],
  }));

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

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translateX(${shakeX}px)` }}>
        {cuts.map((cut, i) => (
          <Sequence key={i} from={cut.start} durationInFrames={cut.duration} layout="none">
            <Cut clipIndex={cut.clipIndex} />
          </Sequence>
        ))}
      </AbsoluteFill>

      {/* Moody dark grade — never fully opaque, footage always reads through */}
      <AbsoluteFill style={{ backgroundColor: "#000000", opacity: darkness }} />
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 35%, rgba(5,5,5,0.42) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
