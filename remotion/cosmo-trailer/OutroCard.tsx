import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import { COSMO_CLIP_A2 } from "./clips";

const logoSrc = staticFile("images/cosmo-logo.png");

// Closing card: the wordmark large and centered, the tagline repeated
// small beneath it — a clean brand stamp to end on rather than cutting
// straight from the last club scene to black.
export const OutroCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.15, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const logoScale = interpolate(frame, [0, 10, 16, durationInFrames], [0.6, 1.1, 1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const logoOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [14, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [14, 24], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Hard cut to black at the very end rather than a slow fade.
  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden", opacity: fadeOut }}>
      <OffthreadVideo
        src={COSMO_CLIP_A2.src}
        startFrom={COSMO_CLIP_A2.startFrom}
        volume={0}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: bgOpacity,
          transform: `scale(${bgZoom})`,
          filter: "blur(12px) brightness(0.45) saturate(1.1)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(3,3,3,0.6) 100%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "0 40px" }}>
          <Img
            src={logoSrc}
            style={{
              width: 460,
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              filter: "drop-shadow(0 0 30px rgba(0,0,0,0.7))",
            }}
          />
          <div
            style={{
              marginTop: 30,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontFamily: theme.bodyFont,
              fontWeight: 700,
              color: theme.textMuted,
              fontSize: 34,
              letterSpacing: 8,
              textTransform: "uppercase",
            }}
          >
            ЕДНА ВЕЧЕР · 3 КЛУБА
          </div>
        </div>
      </AbsoluteFill>

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
