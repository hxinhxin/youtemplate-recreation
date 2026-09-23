import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { FilmGrain } from "../bnr-trailer/FilmGrain";
import { VENUES } from "./venues";

// Opening card for the whole night — "ЕДНА ВЕЧЕР" / "3 КЛУБА" — once,
// not per venue. Background is the first venue's own footage, muted and
// blurred, so the title still feels grounded in real footage rather
// than sitting on a flat color.
export const TitleCard: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const bgClip = VENUES[0].clips[0];

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.15, 1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bgOpacity = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: "clamp" });
  const flash = interpolate(frame, [0, 4, 12], [1, 0.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line1Scale = interpolate(frame, [4, 13, 19, durationInFrames], [0.28, 1.16, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(4)),
  });
  const line1Opacity = interpolate(frame, [4, 11], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line1Blur = interpolate(frame, [4, 14], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const line2Scale = interpolate(frame, [17, 26, 32, durationInFrames], [0.28, 1.16, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(4)),
  });
  const line2Opacity = interpolate(frame, [17, 24], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2Blur = interpolate(frame, [17, 27], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ruleWidth = interpolate(frame, [30, 42], [0, 220], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const ruleOpacity = interpolate(frame, [30, 38], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
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
          filter: "blur(11px) brightness(0.5) saturate(1.25) contrast(1.1)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.68) 100%)" }}
      />
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flash }} />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", padding: "0 36px" }}>
          <div
            style={{
              opacity: line1Opacity,
              transform: `scale(${line1Scale})`,
              filter: line1Blur ? `blur(${line1Blur}px)` : undefined,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 96,
              letterSpacing: 5,
              lineHeight: 1.05,
              textTransform: "uppercase",
              textShadow: "0 0 40px rgba(255,255,255,0.45), 0 0 90px rgba(255,255,255,0.22)",
            }}
          >
            ЕДНА ВЕЧЕР
          </div>

          <div
            style={{
              marginTop: 14,
              opacity: line2Opacity,
              transform: `scale(${line2Scale})`,
              filter: line2Blur ? `blur(${line2Blur}px)` : undefined,
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 118,
              letterSpacing: 5,
              lineHeight: 1.05,
              textTransform: "uppercase",
              textShadow: "0 0 40px rgba(255,255,255,0.45), 0 0 90px rgba(255,255,255,0.22)",
            }}
          >
            3 КЛУБА
          </div>

          <div
            style={{
              marginTop: 22,
              width: ruleWidth,
              height: 3,
              opacity: ruleOpacity,
              marginLeft: "auto",
              marginRight: "auto",
              backgroundColor: theme.white,
              boxShadow: "0 0 16px rgba(255,255,255,0.7)",
            }}
          />
        </div>
      </AbsoluteFill>

      <FilmGrain opacity={0.05} />
    </AbsoluteFill>
  );
};
