import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { theme } from "./theme";
import { DAYS_LEFT } from "./daysLeft";
import { FilmGrain } from "./FilmGrain";

const heroClip = CLIPS[0];

// Scene 6, first beat — the countdown returns as the strongest visual
// before the ticket card. This time the footage sits dim behind the
// number rather than clipped inside it, per the brief's distinction
// between the two countdown treatments.
export const FinalDaysCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.08], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(frame, [0, 12, 18], [0.6, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 10, 24], [0, 40, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={heroClip.src}
        startFrom={70}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.35,
          transform: `scale(${zoom})`,
        }}
      />

      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.92) 80%)" }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", transform: `scale(${scale})`, opacity }}>
          <div
            style={{
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 340,
              lineHeight: 1,
              textShadow: `0 0 ${glow}px ${theme.red}`,
            }}
          >
            {DAYS_LEFT}
          </div>
          <div
            style={{
              marginTop: 4,
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
      </AbsoluteFill>

      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};
