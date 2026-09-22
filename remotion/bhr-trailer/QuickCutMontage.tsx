import { AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { theme } from "./theme";

// A rapid hard-cut montage: each slice gets progressively shorter (fed
// via `sliceDurations`), with a brief motion-blur-style entry (a quick
// blur that snaps to sharp) and a white flash at every cut. Used for both
// the opening tension-builder and the final pre-title burst.
export const QuickCutMontage: React.FC<{
  sliceDurations: number[];
  clipOffset?: number;
}> = ({ sliceDurations, clipOffset = 0 }) => {
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

  const clip = CLIPS[(activeIndex + clipOffset) % CLIPS.length];
  const sliceDuration = sliceDurations[activeIndex];

  // Quick blur-to-sharp snap on every cut, mimicking a whip/motion blur.
  const blur = interpolate(localFrame, [0, 3], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Punch-in scale on every slice.
  const scale = interpolate(localFrame, [0, sliceDuration], [1.1, 1.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(localFrame, [0, 1, 3], [0.8, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={(clip.startFrom ?? 0) + activeIndex * 20}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          filter: `blur(${blur}px) contrast(1.08) saturate(0.95)`,
        }}
      />

      {/* Red-tinted vignette overlay — mood accent without regrading the footage itself */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.75) 100%), linear-gradient(to top, ${theme.redDeep}33 0%, transparent 30%)`,
        }}
      />

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};
