import { AbsoluteFill, Easing, interpolate, OffthreadVideo, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ClipConfig } from "../concert-promo/clips";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { ImpactFlash } from "./ImpactFlash";

export const ClipWithOverlay: React.FC<{ clip: ClipConfig; index: number }> = ({
  clip,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Wider Ken Burns drift for a bigger sense of motion.
  const zoomingIn = index % 2 === 0;
  const drift = interpolate(
    frame,
    [0, clip.durationInFrames],
    zoomingIn ? [1, 1.28] : [1.28, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // Punch-in on entry: the clip slams in oversized then settles, stacked
  // on top of the slow drift above.
  const impact = interpolate(frame, [0, 10], [1.16, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const scale = drift * impact;

  // Quick shake on the cut itself — position only, never a filter on the
  // footage — so every clip lands with a hit instead of a soft dissolve.
  const shakeMag = interpolate(frame, [0, 8], [8, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeMag > 0 ? Math.sin(frame * 12) * shakeMag : 0;
  const shakeY = shakeMag > 0 ? Math.cos(frame * 9) * shakeMag : 0;

  const textIn = spring({ frame, fps, config: { damping: 12, stiffness: 200 } });
  const textY = interpolate(textIn, [0, 1], [50, 0]);
  const textOpacity = interpolate(textIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      {/* One hit-flash on the very first clip, where the footage first
          reveals itself — not repeated on every cut so it stays a beat,
          not a strobe over the whole compilation. */}
      {index === 0 && <ImpactFlash triggerFrame={0} peak={0.7} />}

      <OffthreadVideo
        src={clip.src}
        startFrom={clip.startFrom ?? 0}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale}) translate(${shakeX}px, ${shakeY}px)`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          background: "linear-gradient(to top, rgba(10,10,15,0.9) 0%, rgba(10,10,15,0) 42%)",
        }}
      >
        <div
          style={{
            padding: "0 48px 96px",
            transform: `translateY(${textY}px)`,
            opacity: textOpacity,
          }}
        >
          <div
            style={{
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.text,
              fontSize: 46,
              textTransform: "uppercase",
              textShadow: `0 0 24px ${theme.accent}`,
            }}
          >
            {concertInfo.act}
          </div>
          <div
            style={{
              fontFamily: theme.bodyFont,
              marginTop: 8,
              color: theme.accent,
              fontSize: 27,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.day} · {concertInfo.venue}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
