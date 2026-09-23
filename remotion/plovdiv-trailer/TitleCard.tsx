import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, staticFile, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import { PLOVDIV_CLIP_2 } from "./clips";

const logoSrc = staticFile("images/plovdiv-logo.png");

// The logo keeps its real brand colors (black wordmark, red play icon)
// rather than being recolored white — a stacked white drop-shadow glow
// is what keeps the black text legible over dark club footage instead.
const LOGO_GLOW =
  "drop-shadow(0 0 3px rgba(255,255,255,0.9)) drop-shadow(0 0 18px rgba(255,255,255,0.55)) drop-shadow(0 0 40px rgba(255,255,255,0.35))";

// Opening card: the Plovdiv Event Center wordmark slams in over a
// dimmed, blurred loop of the venue's own branded stage screen, with
// the campaign tagline settling in beneath it.
export const TitleCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });

  const logoScale = interpolate(frame, [4, 14, 20, durationInFrames], [0.5, 1.1, 1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const logoOpacity = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const logoBlur = interpolate(frame, [4, 16], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const taglineOpacity = interpolate(frame, [24, 34], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [24, 34], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={PLOVDIV_CLIP_2.src}
        startFrom={PLOVDIV_CLIP_2.startFrom}
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
        <div style={{ textAlign: "center", padding: "0 60px" }}>
          <div
            style={{
              opacity: logoOpacity,
              transform: `scale(${logoScale})`,
              filter: logoBlur ? `blur(${logoBlur}px) ${LOGO_GLOW}` : LOGO_GLOW,
            }}
          >
            <Img src={logoSrc} style={{ width: 460 }} />
          </div>

          <div
            style={{
              marginTop: 34,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontFamily: theme.bodyFont,
              fontWeight: 700,
              color: theme.white,
              fontSize: 34,
              letterSpacing: 8,
              textTransform: "uppercase",
              textShadow: "0 0 24px rgba(0,0,0,0.6)",
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
