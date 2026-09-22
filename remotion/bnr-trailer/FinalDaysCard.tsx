import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { theme } from "./theme";
import { DAYS_LEFT } from "./daysLeft";
import { HERO_CLIP_INDEX } from "./energyOrder";
import { MaskedVideoNumber } from "./MaskedVideoNumber";
import { FilmGrain } from "./FilmGrain";

// Scene 6, first beat — the countdown returns as the strongest visual
// before the ticket card. Per the brief, the most energetic crowd
// footage plays inside the number again here too (same masked treatment
// as the Scene 2 hero reveal, just a shorter beat).
export const FinalDaysCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const labelOpacity = interpolate(frame, [18, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <MaskedVideoNumber
          text={String(DAYS_LEFT)}
          videoSrc={CLIPS[HERO_CLIP_INDEX].src}
          videoStartFrom={90}
          durationInFrames={durationInFrames}
          climaxFrame={durationInFrames - 10}
        />

        <div
          style={{
            marginTop: -14,
            opacity: labelOpacity,
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.red,
            fontSize: 30,
            letterSpacing: 9,
          }}
        >
          DAYS LEFT
        </div>
      </div>

      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};
