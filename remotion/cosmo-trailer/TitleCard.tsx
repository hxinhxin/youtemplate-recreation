import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import { COSMO_CLIP_A } from "./clips";

const logoSrc = staticFile("images/cosmo-logo.png");

// Opening card: "ЕДНА ВЕЧЕР" / "3 КЛУБА" slam in over a dimmed, blurred
// loop of the COSMO room, then the wordmark settles in beneath as the
// brand stamp for the whole piece. Background audio is muted here (the
// full crowd/music hits only once the first club scene cuts in) so the
// title reads as a quiet breath before the night starts.
export const TitleCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const line1Scale = interpolate(frame, [4, 12, 18, durationInFrames], [0.5, 1.12, 1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const line1Opacity = interpolate(frame, [4, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1Blur = interpolate(frame, [4, 14], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line2Scale = interpolate(frame, [16, 24, 30, durationInFrames], [0.5, 1.12, 1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const line2Opacity = interpolate(frame, [16, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Blur = interpolate(frame, [16, 26], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const logoOpacity = interpolate(frame, [30, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoY = interpolate(frame, [30, 42], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={COSMO_CLIP_A.src}
        startFrom={COSMO_CLIP_A.startFrom}
        volume={0}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: bgOpacity,
          transform: `scale(${bgZoom})`,
          filter: "blur(10px) brightness(0.55) saturate(1.1)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(3,3,3,0.55) 100%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "0 36px" }}>
          <div
            style={{
              opacity: line1Opacity,
              transform: `scale(${line1Scale})`,
              filter: line1Blur ? `blur(${line1Blur}px)` : undefined,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 88,
              letterSpacing: 4,
              lineHeight: 1.05,
              textTransform: "uppercase",
              textShadow: "0 0 30px rgba(255,255,255,0.25)",
            }}
          >
            ЕДНА ВЕЧЕР
          </div>

          <div
            style={{
              marginTop: 14,
              opacity: line2Opacity,
              transform: `scale(${line2Scale})`,
              filter: line2Blur ? `blur(${line2Blur}px)` : undefined,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 108,
              letterSpacing: 4,
              lineHeight: 1.05,
              textTransform: "uppercase",
              textShadow: "0 0 30px rgba(255,255,255,0.25)",
            }}
          >
            3 КЛУБА
          </div>

          <div
            style={{
              marginTop: 46,
              opacity: logoOpacity,
              transform: `translateY(${logoY}px)`,
            }}
          >
            <Img
              src={logoSrc}
              style={{
                width: 320,
                filter: "drop-shadow(0 0 22px rgba(0,0,0,0.7))",
              }}
            />
          </div>
        </div>
      </AbsoluteFill>

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
