import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { theme } from "./theme";
import { concertInfo } from "./concertInfo";
import { VENUE_CLIP_INDEX } from "./energyOrder";
import { FilmGrain } from "./FilmGrain";

// Scene 4 — after the crowd-explosion montage, everything briefly slows
// down for a dedicated venue reveal: JOY STATION as a major visual
// element (not a small subtitle), then SOFIA underneath (bolded with a
// text-stroke since there's no heavier Cyrillic weight available), over
// a strong wide stage/crowd shot.
export const JoyStationReveal: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const clip = CLIPS[VENUE_CLIP_INDEX];

  // Zoom rate roughly matched to the other scenes — was 1 -> 1.12 (by far
  // the slowest push in the trailer), which measured as long stretches of
  // near-static frames. A slow drift is added on top so there's motion
  // even where the zoom curve alone would read as still.
  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const drift = Math.sin(frame / 24) * 14;

  const venueScale = interpolate(frame, [0, 10, 16, durationInFrames], [0.55, 1.15, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const venueOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 10, 26], [0, 45, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const cityOpacity = interpolate(frame, [16, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cityY = interpolate(frame, [16, 24], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        // Was startFrom=30 (1s in) — that stretch of the source clip is
        // comparatively dark and calm. Moved to 270 (9s in), a
        // consistently brighter, more dynamic stretch (lit LED panels,
        // people dancing) confirmed via a frame scan of the source.
        startFrom={270}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom}) translateX(${drift}px)`,
        }}
      />

      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to top, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.2) 45%, rgba(5,5,5,0.45) 100%)",
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "0 40px" }}>
          <div
            style={{
              transform: `scale(${venueScale})`,
              opacity: venueOpacity,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 86,
              lineHeight: 1.02,
              letterSpacing: 2,
              textTransform: "uppercase",
              textShadow: `0 0 ${glow}px ${theme.red}`,
            }}
          >
            {concertInfo.venue}
          </div>

          <div
            style={{
              marginTop: 18,
              opacity: cityOpacity,
              transform: `translateY(${cityY}px)`,
              fontFamily: theme.bodyFont,
              fontWeight: 700,
              WebkitTextStroke: `1.5px ${theme.white}`,
              color: theme.white,
              fontSize: 40,
              letterSpacing: 10,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.city}
          </div>
        </div>
      </AbsoluteFill>

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
