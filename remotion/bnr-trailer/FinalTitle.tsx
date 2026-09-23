import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";
import { FINAL_TITLE_DURATION } from "./durations";
import { FilmGrain } from "./FilmGrain";

// Was hardcoded to CLIPS[0] (the static DJ-gear clip, no crowd) — switched
// to real crowd footage so the final card's backdrop is actually alive.
// Uses clip-03 (index 2) specifically rather than the hero clip (clip-04)
// — that one's already the dedicated backdrop for DaysHero, the reveal
// pause and the typography beats, so the final card gets its own instead
// of repeating footage seen several times already.
const heroClip = CLIPS[2];

export const FinalTitle: React.FC = () => {
  const frame = useCurrentFrame();

  const heroZoom = interpolate(frame, [0, FINAL_TITLE_DURATION], [1, 1.1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 10, 18, FINAL_TITLE_DURATION], [0.4, 1.2, 1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3.5)),
  });
  const titleOpacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });

  const dateOpacity = interpolate(frame, [16, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const ctaOpacity = interpolate(frame, [28, 38], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaGlow = 22 + Math.sin(frame / 6) * 12;

  // The ticket link is the whole point of this card — it gets its own
  // punchy entrance (overshoot scale, not just a fade) and a continuous
  // pulse afterward so it keeps drawing the eye like a real CTA button
  // rather than sitting flat once it's landed.
  const siteOpacity = interpolate(frame, [40, 48], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const siteEntranceScale = interpolate(frame, [40, 48, 54], [0.5, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const sitePulse = frame > 54 ? 1 + Math.sin((frame - 54) / 9) * 0.035 : 1;
  const siteScale = siteEntranceScale * sitePulse;
  const siteGlow = 36 + Math.sin(frame / 9) * 16;

  const glow = interpolate(frame, [0, 10, 30], [0, 55, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={heroClip.src}
        startFrom={340}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${heroZoom})`,
          filter: "contrast(1.12) saturate(1.1) brightness(1.1)",
        }}
      />

      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(5,5,5,0.48) 0%, rgba(5,5,5,0.18) 55%, rgba(5,5,5,0.42) 100%)`,
        }}
      />

      {/* Subtle red light leak drifting across the frame */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${30 + Math.sin(frame / 40) * 20}% ${20 + Math.cos(frame / 55) * 10}%, ${theme.red}22 0%, transparent 45%)`,
          mixBlendMode: "screen",
        }}
      />

      <FilmGrain />

      {/* Split into two groups pushed toward opposite thirds of the frame
          — packing all 4 lines into one tight block read as "too much
          text" crammed in one spot at the very end. Title/date sit high,
          CTA/site sit low, with the footage breathing in between. */}
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "180px 50px 220px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              transform: `scale(${titleScale})`,
              opacity: titleOpacity,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 76,
              lineHeight: 1.05,
              textTransform: "uppercase",
              textShadow: `0 0 ${glow}px ${theme.red}`,
            }}
          >
            {concertInfo.brand} В {concertInfo.city}
          </div>

          <div
            style={{
              marginTop: 26,
              opacity: dateOpacity,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 54,
              letterSpacing: 3,
            }}
          >
            {concertInfo.day} · {concertInfo.dateLabel}
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              opacity: ctaOpacity,
              fontFamily: theme.bodyFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 52,
              letterSpacing: 6,
              textTransform: "uppercase",
              textShadow: `0 0 ${ctaGlow}px ${theme.red}, 0 0 ${ctaGlow * 2}px ${theme.red}`,
            }}
          >
            {concertInfo.cta}
          </div>

          <div
            style={{
              marginTop: 22,
              opacity: siteOpacity,
              transform: `scale(${siteScale})`,
              display: "inline-block",
              fontFamily: theme.bodyFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 58,
              letterSpacing: 2,
              textTransform: "uppercase",
              backgroundColor: theme.red,
              padding: "14px 42px",
              borderRadius: 100,
              boxShadow: `0 0 ${siteGlow}px ${theme.red}, 0 0 ${siteGlow * 2.5}px ${theme.red}88, 0 10px 30px rgba(0,0,0,0.5)`,
            }}
          >
            {concertInfo.ticketSite}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
