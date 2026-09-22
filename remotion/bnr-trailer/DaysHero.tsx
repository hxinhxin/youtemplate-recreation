import { AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { concertInfo } from "./concertInfo";
import { DAYS_LEFT } from "./daysLeft";
import { LightSweep } from "./LightSweep";
import { MaskedVideoNumber } from "./MaskedVideoNumber";
import { FilmGrain } from "./FilmGrain";

// Scene 2 — the trailer's signature shot: a light sweep cues the reveal,
// then the huge DAYS_LEFT number appears with concert footage moving
// inside it, "DAYS LEFT" spaced out underneath, and a bass-hit climax
// where the number expands and pushes through into the crowd (breakApart)
// — never a flat cut from a static card. The backdrop is always dim,
// blurred concert footage, never a solid color, so the frame stays alive
// even outside the glyph.
export const DaysHero: React.FC<{ videoSrc: string; durationInFrames: number }> = ({
  videoSrc,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [30, 42], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      {/* Dim, blurred concert footage behind everything — the backdrop is
          never a flat color, just atmospheric rather than sharp so the
          masked number reads as the focal point. */}
      <OffthreadVideo
        src={videoSrc}
        startFrom={300}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${bgZoom})`,
          filter: "blur(8px) brightness(0.6) saturate(1.2)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 32%, rgba(5,5,5,0.72) 100%)" }}
      />

      <LightSweep startFrame={8} durationInFrames={20} />

      <div style={{ textAlign: "center" }}>
        <MaskedVideoNumber
          text={String(DAYS_LEFT)}
          videoSrc={videoSrc}
          videoStartFrom={270}
          durationInFrames={durationInFrames}
          breakApart
          breakApartFrames={16}
        />

        <div
          style={{
            marginTop: -20,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.white,
            fontSize: 40,
            letterSpacing: 10,
          }}
        >
          DAYS LEFT
        </div>

        <div
          style={{
            marginTop: 14,
            opacity: labelOpacity,
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.white,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          UNTIL {concertInfo.brand}
        </div>
      </div>

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
