import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { concertInfo } from "./concertInfo";
import { DAYS_LEFT } from "./daysLeft";
import { LightSweep } from "./LightSweep";
import { MaskedVideoNumber } from "./MaskedVideoNumber";
import { FilmGrain } from "./FilmGrain";

// Scene 2 — the trailer's signature shot: a light sweep cues the reveal,
// then the huge DAYS_LEFT number appears with concert footage moving
// inside it, "DAYS LEFT" spaced out underneath, and a single bass-hit
// flash near the end as it hands off into the build-up montage.
export const DaysHero: React.FC<{ videoSrc: string; durationInFrames: number }> = ({
  videoSrc,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [30, 42], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
      <LightSweep startFrame={8} durationInFrames={20} />

      <div style={{ textAlign: "center" }}>
        <MaskedVideoNumber
          text={String(DAYS_LEFT)}
          videoSrc={videoSrc}
          videoStartFrom={20}
          durationInFrames={durationInFrames}
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
            fontWeight: 500,
            color: theme.textMuted,
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
