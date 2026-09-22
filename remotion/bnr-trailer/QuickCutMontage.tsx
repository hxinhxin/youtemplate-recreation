import { AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { theme } from "./theme";
import { ENERGY_ORDER } from "./energyOrder";

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
  const frame = useCurrentFrame();

  let cursor = 0;
  let activeIndex = 0;
  let localFrame = 0;
  for (let i = 0; i < sliceDurations.length; i++) {
    if (frame < cursor + sliceDurations[i]) {
      activeIndex = i;
      localFrame = frame - cursor;
      break;
    }
    cursor += sliceDurations[i];
    activeIndex = i;
    localFrame = frame - cursor;
  }

  const clip = CLIPS[clipOrder[activeIndex % clipOrder.length]];
  const sliceDuration = sliceDurations[activeIndex];

  // Quick blur-to-sharp snap on every cut, mimicking a whip/motion blur.
  const blur = interpolate(localFrame, [0, 3], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(localFrame, [0, sliceDuration], [1.08, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(localFrame, [0, 1, 3], [0.7, 0.25, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        // Bounded to a 40-frame window so repeated appearances of the same
        // clip show different footage without risking an offset that runs
        // past the end of a short source clip (some are only ~2-3s).
        startFrom={(clip.startFrom ?? 0) + ((activeIndex * 20) % 40)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `blur(${blur}px) contrast(1.06) saturate(0.95)`,
        }}
      />

      {/* Dark/red vignette — mood accent without regrading the footage itself */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 45%, rgba(5,5,5,0.7) 100%), linear-gradient(to top, ${theme.redDeep}26 0%, transparent 30%)`,
        }}
      />

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};
