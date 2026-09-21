import { AbsoluteFill, interpolate, OffthreadVideo, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { ClipConfig } from "./clips";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";

export const ClipWithOverlay: React.FC<{ clip: ClipConfig; index: number }> = ({
  clip,
  index,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Ken Burns drift: alternate zoom-in/zoom-out per clip so consecutive
  // cuts don't repeat the same motion. Purely a transform, no color change.
  const zoomingIn = index % 2 === 0;
  const scale = interpolate(
    frame,
    [0, clip.durationInFrames],
    zoomingIn ? [1, 1.12] : [1.12, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const textIn = spring({ frame, fps, config: { damping: 14, stiffness: 160 } });
  const textY = interpolate(textIn, [0, 1], [40, 0]);
  const textOpacity = interpolate(textIn, [0, 1], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={clip.startFrom ?? 0}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
        }}
      />

      {/* Lower-third: keeps the concert name/date on screen through the footage */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          background:
            "linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0) 40%)",
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
              fontSize: 44,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.name}
          </div>
          <div
            style={{
              fontFamily: theme.bodyFont,
              marginTop: 8,
              color: theme.accent,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.date} · {concertInfo.venue}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
