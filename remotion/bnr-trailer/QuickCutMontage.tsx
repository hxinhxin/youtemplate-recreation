import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { theme } from "./theme";

// A rapid hard-cut montage: each slice gets progressively shorter (fed
// via `sliceDurations`), with a brief motion-blur-style entry (a quick
// blur that snaps to sharp), a slight rotation wobble, and a white flash
// at every cut. Used for both the opening tension-builder and the final
// pre-title burst.
export const QuickCutMontage: React.FC<{
  sliceDurations: number[];
  clipOffset?: number;
  brandFlash?: boolean;
}> = ({ sliceDurations, clipOffset = 0, brandFlash = false }) => {
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

  // Punch-in scale on every slice, with a slight rotation wobble alternating
  // direction per slice for extra kinetic energy.
  const scale = interpolate(localFrame, [0, sliceDuration], [1.15, 1.28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rotationDirection = activeIndex % 2 === 0 ? 1 : -1;
  const rotation =
    rotationDirection *
    interpolate(localFrame, [0, sliceDuration], [1.5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const flashOpacity = interpolate(localFrame, [0, 1, 3], [0.8, 0.3, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const totalDuration = sliceDurations.reduce((a, b) => a + b, 0);
  const brandWindowStart = totalDuration - 22;
  const brandScale = interpolate(frame, [brandWindowStart, brandWindowStart + 6, totalDuration - 6, totalDuration], [0.6, 1.1, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const brandOpacity = interpolate(frame, [brandWindowStart, brandWindowStart + 5, totalDuration - 6, totalDuration], [0, 1, 1, 0], {
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
          transform: `scale(${scale}) rotate(${rotation}deg)`,
          filter: `blur(${blur}px) contrast(1.08) saturate(0.95)`,
        }}
      />

      {/* Red-tinted vignette overlay — mood accent without regrading the footage itself */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.75) 100%), linear-gradient(to top, ${theme.redDeep}33 0%, transparent 30%)`,
        }}
      />

      {brandFlash && (
        <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
          <div
            style={{
              transform: `scale(${brandScale})`,
              opacity: brandOpacity,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 120,
              letterSpacing: 6,
              textShadow: `0 0 40px ${theme.red}`,
            }}
          >
            BNR
          </div>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flashOpacity }} />
    </AbsoluteFill>
  );
};
