import { AbsoluteFill, Easing, Img, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import { VENUES } from "./venues";

const LOGO_GLOW =
  "drop-shadow(0 0 3px rgba(255,255,255,0.85)) drop-shadow(0 0 16px rgba(255,255,255,0.5)) drop-shadow(0 0 36px rgba(255,255,255,0.3))";

// Closing card — every venue's logo stacked together (in visit order),
// tagline repeated small beneath, hard cut to black. Adding a third
// venue to venues.ts adds it here automatically.
export const OutroCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const lastVenue = VENUES[VENUES.length - 1];
  const bgClip = lastVenue.clips[lastVenue.clips.length - 1];

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.15, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const logosOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const logosScale = interpolate(frame, [0, 10, 16, durationInFrames], [0.7, 1.06, 1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });

  const taglineOpacity = interpolate(frame, [14, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const taglineY = interpolate(frame, [14, 24], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const fadeOut = interpolate(frame, [durationInFrames - 8, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden", opacity: fadeOut }}>
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
          filter: "blur(12px) brightness(0.45) saturate(1.1)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 25%, rgba(3,3,3,0.6) 100%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "0 60px" }}>
          <div
            style={{
              opacity: logosOpacity,
              transform: `scale(${logosScale})`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 44,
            }}
          >
            {VENUES.map((venue) => (
              <Img
                key={venue.key}
                src={venue.logoSrc}
                style={{ width: venue.logoWidth * 0.72, filter: LOGO_GLOW }}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 40,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              fontFamily: theme.bodyFont,
              fontWeight: 700,
              color: theme.textMuted,
              fontSize: 30,
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
