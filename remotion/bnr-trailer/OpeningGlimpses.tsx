import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { theme } from "./theme";
import { concertInfo } from "./concertInfo";

type Glimpse = { start: number; duration: number; clipIndex: number };

// Sparse at first, getting closer together as the section builds —
// brief flashes of footage against near-total black, like memories
// rather than a bright montage. Not simultaneous shots; only one glimpse
// is ever on screen at once.
const GLIMPSE_STARTS = [14, 34, 52, 68, 82, 94, 104, 112];

export const OpeningGlimpses: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const glimpses: Glimpse[] = GLIMPSE_STARTS.filter((s) => s < durationInFrames - 4).map((start, i) => ({
    start,
    duration: 5 + (i % 2),
    clipIndex: i % CLIPS.length,
  }));

  const active = glimpses.find((g) => frame >= g.start && frame < g.start + g.duration);
  const glimpseOpacity = active
    ? interpolate(frame - active.start, [0, 1, active.duration - 1, active.duration], [0, 1, 1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // A low rumble-shake builds in over the last stretch, like tension
  // right before the reveal.
  const rumble = interpolate(frame, [durationInFrames - 24, durationInFrames], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = Math.sin(frame * 6) * rumble;

  // A minimal "BNR" flash near the very end, per the brief.
  const brandWindow = durationInFrames - 16;
  const brandOpacity = interpolate(
    frame,
    [brandWindow, brandWindow + 4, durationInFrames - 4, durationInFrames],
    [0, 0.9, 0.9, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const brandScale = interpolate(frame, [brandWindow, brandWindow + 6], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      {active && (
        <OffthreadVideo
          src={CLIPS[active.clipIndex].src}
          startFrom={active.clipIndex * 15}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: glimpseOpacity,
            filter: "contrast(1.15) saturate(0.85) brightness(0.8)",
            transform: `translateX(${shakeX}px) scale(1.05)`,
          }}
        />
      )}

      {/* Deep vignette keeps the frame mostly dark even during a glimpse */}
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse at center, transparent 15%, rgba(5,5,5,0.92) 85%)",
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: brandOpacity,
            transform: `scale(${brandScale})`,
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.white,
            fontSize: 90,
            letterSpacing: 8,
            textShadow: `0 0 30px ${theme.red}`,
          }}
        >
          {concertInfo.brand}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
