import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { CLIPS } from "../concert-promo/clips";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";
import { FINAL_TITLE_DURATION } from "./durations";

const heroClip = CLIPS[0];

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

  const glow = interpolate(frame, [0, 10, 30], [0, 55, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={heroClip.src}
        startFrom={40}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${heroZoom})`,
        }}
      />

      <AbsoluteFill
        style={{
          background: `linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.55) 55%, rgba(5,5,5,0.85) 100%)`,
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: "0 50px" }}>
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
              color: theme.red,
              fontSize: 54,
              letterSpacing: 3,
            }}
          >
            {concertInfo.dateLabel}
          </div>

          <div
            style={{
              marginTop: 44,
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
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
