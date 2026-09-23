import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import type { Venue } from "./venues";

// Same white-glow treatment used for the Plovdiv wordmark in
// plovdiv-trailer/TitleCard.tsx — subtle enough that it barely changes
// the already-white COSMO mark, but keeps Plovdiv's black text legible
// over dark footage without recoloring the brand.
const LOGO_GLOW =
  "drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 0 16px rgba(255,255,255,0.5)) drop-shadow(0 0 36px rgba(255,255,255,0.3))";

// A quick, logo-only beat that introduces the next venue — "now at
// COSMO" / "now at Plovdiv Event Center" — before its clips play.
export const ChapterBump: React.FC<{ venue: Venue; durationInFrames: number }> = ({ venue, durationInFrames }) => {
  const frame = useCurrentFrame();
  const bgClip = venue.clips[0];

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const logoScale = interpolate(frame, [2, 10, 16, durationInFrames], [0.5, 1.12, 1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const logoOpacity = interpolate(frame, [2, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={bgClip.src}
        startFrom={bgClip.startFrom}
        volume={0}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: bgOpacity,
          transform: `scale(${bgZoom})`,
          filter: "blur(9px) brightness(0.5) saturate(1.1)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(3,3,3,0.55) 100%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
            filter: LOGO_GLOW,
          }}
        >
          <Img src={venue.logoSrc} style={{ width: venue.logoWidth }} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
