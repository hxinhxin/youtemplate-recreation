import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { BNR_CLIPS as CLIPS } from "./clips";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";
import { FINAL_TITLE_DURATION } from "./durations";
import { FilmGrain } from "./FilmGrain";
import { HERO_CLIP_INDEX } from "./energyOrder";

// Was hardcoded to CLIPS[0] (the static DJ-gear clip, no crowd) — switched
// to the ranked hero clip so the final card's backdrop is actually alive.
const heroClip = CLIPS[HERO_CLIP_INDEX];

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

  const siteOpacity = interpolate(frame, [40, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

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

      {/* Split into two groups spread across the frame — packing all 4
          lines into one tight block read as "too much text" crammed in
          one spot at the very end. The CTA/site pair now sits down
          toward the middle of the frame instead of hugging the title. */}
      <AbsoluteFill style={{ flexDirection: "column", justifyContent: "space-evenly", alignItems: "center", padding: "0 50px" }}>
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
            {concertInfo.brand} IN {concertInfo.city}
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
              fontWeight: 700,
              color: theme.white,
              fontSize: 34,
              letterSpacing: 4,
              textTransform: "uppercase",
              textShadow: `0 0 ${ctaGlow}px ${theme.red}`,
            }}
          >
            {concertInfo.cta}
          </div>

          <div
            style={{
              marginTop: 14,
              opacity: siteOpacity,
              fontFamily: theme.bodyFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 30,
              letterSpacing: 3,
              textDecoration: "underline",
              textUnderlineOffset: 6,
            }}
          >
            {concertInfo.ticketSite}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
