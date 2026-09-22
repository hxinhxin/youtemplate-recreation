import { AbsoluteFill, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { theme } from "./theme";
import { DAYS_LEFT } from "./daysLeft";
import { HERO_CLIP_INDEX } from "./energyOrder";
import { MaskedVideoNumber } from "./MaskedVideoNumber";
import { FilmGrain } from "./FilmGrain";

// Scene 6, first beat — the countdown returns as the strongest visual
// before the ticket card. Per the brief, the most energetic crowd
// footage plays inside the number again here too (same masked treatment
// as the Scene 2 hero reveal), with a dim/blurred backdrop of the same
// footage behind it so the frame is never a flat color.
export const FinalDaysCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const clip = CLIPS[HERO_CLIP_INDEX];

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [18, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={380}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${bgZoom})`,
          filter: "blur(7px) brightness(0.55) saturate(1.2)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 32%, rgba(5,5,5,0.7) 100%)" }}
      />

      <div style={{ textAlign: "center" }}>
        <MaskedVideoNumber
          text={String(DAYS_LEFT)}
          videoSrc={clip.src}
          videoStartFrom={400}
          durationInFrames={durationInFrames}
          climaxFrame={durationInFrames - 10}
        />

        <div
          style={{
            marginTop: -14,
            opacity: labelOpacity,
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.white,
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
