import { AbsoluteFill, interpolate, OffthreadVideo, Sequence, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { theme } from "./theme";
import { ENERGY_ORDER } from "./energyOrder";

// One slice's video, in its own <Sequence> so useCurrentFrame() here is
// local to this slice (resets to 0 at the slice's start) — needed because
// OffthreadVideo's `startFrom` combines with the LOCAL frame of its
// nearest Sequence, not the whole scene's frame. Without this wrapper,
// every slice after the first was seeking into the source using the full
// scene-elapsed frame count added on top of `startFrom`, drifting further
// wrong with each slice (this was the actual cause of random unrelated
// footage flashing during this montage).
const Slice: React.FC<{ clipSrc: string; clipStartFrom: number; sliceIndex: number; sliceDuration: number }> = ({
  clipSrc,
  clipStartFrom,
  sliceIndex,
  sliceDuration,
}) => {
  const localFrame = useCurrentFrame();

  // Blur/flash peaks lowered (8px/0.7 -> 5px/0.3) — the very first frame
  // of every slice (max blur + a near-solid-white flash at once) was
  // blowing out to an almost-solid white frame, reading as a static
  // "photo" flash rather than a video cut.
  const blur = interpolate(localFrame, [0, 3], [5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(localFrame, [0, sliceDuration], [1.08, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const flashOpacity = interpolate(localFrame, [0, 1, 3], [0.3, 0.12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={clipSrc}
        // Bounded to a 40-frame window so repeated appearances of the same
        // clip show different footage without risking an offset that runs
        // past the end of a short source clip (some are only ~2-3s).
        startFrom={clipStartFrom + ((sliceIndex * 20) % 40)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `blur(${blur}px) contrast(1.06) saturate(0.95)`,
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};

// Scene 3 — the build-up montage: each slice gets progressively shorter
// (fed via `sliceDurations`, ~0.2-0.6s each), with a brief motion-blur
// snap on entry and a white flash at every cut. Kept restrained — a
// gentle punch-in only, no rotation wobble or heavy tint — so it reads
// as expensive trailer editing rather than a busy effects reel. Cycles
// through clips in `clipOrder` (defaults to ENERGY_ORDER, the most alive
// crowd footage first) rather than plain sequential order.
export const QuickCutMontage: React.FC<{
  sliceDurations: number[];
  clipOrder?: number[];
}> = ({ sliceDurations, clipOrder = ENERGY_ORDER }) => {
  let cursor = 0;
  const slices = sliceDurations.map((duration, i) => {
    const start = cursor;
    cursor += duration;
    const clip = CLIPS[clipOrder[i % clipOrder.length]];
    return { start, duration, clip };
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      {slices.map((slice, i) => (
        <Sequence key={i} from={slice.start} durationInFrames={slice.duration} layout="none">
          <Slice
            clipSrc={slice.clip.src}
            clipStartFrom={slice.clip.startFrom ?? 0}
            sliceIndex={i}
            sliceDuration={slice.duration}
          />
        </Sequence>
      ))}

      {/* Dark/red vignette — mood accent without regrading the footage itself */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 55%, rgba(5,5,5,0.4) 100%), linear-gradient(to top, ${theme.redDeep}26 0%, transparent 30%)`,
        }}
      />
    </AbsoluteFill>
  );
};
