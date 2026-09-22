import { Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { WIDTH, HEIGHT } from "./durations";

// The hero countdown digit: concert footage clipped to the shape of the
// glyph via an SVG clipPath (the video exists INSIDE the number, not
// behind a transparent layer on top of it). Restrained on purpose — a
// thin white outline, a soft sheen, one static reflection band, a subtle
// red accent glow, and film grain. No chromatic-aberration/glitch tricks.
export const MaskedVideoNumber: React.FC<{
  text: string;
  videoSrc: string;
  videoStartFrom?: number;
  durationInFrames: number;
  climaxFrame?: number;
}> = ({ text, videoSrc, videoStartFrom = 0, durationInFrames, climaxFrame }) => {
  const frame = useCurrentFrame();
  const clipId = "days-hero-clip";
  const boxW = WIDTH;
  const boxH = HEIGHT * 0.5;
  const fontSize = text.length > 1 ? 620 : 900;

  // Cinematic reveal: scale/opacity/blur settle in together, then a slow
  // continuous camera push for the rest of the shot.
  const revealProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const revealScale = interpolate(revealProgress, [0, 1], [0.72, 1]);
  const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
  const revealBlur = interpolate(revealProgress, [0, 1], [18, 0]);

  const pushIn = interpolate(frame, [26, durationInFrames], [1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const footageZoom = interpolate(frame, [0, durationInFrames], [1, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // A single subtle shake right at the climax (bass hit), not throughout.
  const climax = climaxFrame ?? durationInFrames - 18;
  const climaxWindow = frame - climax;
  const climaxShakeMag = interpolate(climaxWindow, [0, 12], [7, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = climaxWindow >= 0 && climaxShakeMag > 0 ? Math.sin(frame * 8) * climaxShakeMag : 0;
  const climaxFlash = interpolate(climaxWindow, [0, 2, 8], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = revealScale * pushIn;

  const textProps = {
    x: boxW / 2,
    y: boxH / 2,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontFamily: theme.headlineFont,
    fontWeight: 900,
    fontSize,
  };

  return (
    <div
      style={{
        position: "relative",
        width: boxW,
        height: boxH,
        transform: `scale(${scale}) translateX(${shakeX}px)`,
        opacity: revealOpacity,
        filter: `blur(${revealBlur}px)`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <text {...textProps}>{text}</text>
          </clipPath>
        </defs>
      </svg>

      {/* Soft shadow duplicate for a slight 3D lift off the background */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 8, left: 5, opacity: 0.45 }}>
        <text {...textProps} fill="#000000">
          {text}
        </text>
      </svg>

      {/* Subtle red accent glow — deliberately restrained */}
      <svg
        width={boxW}
        height={boxH}
        style={{ position: "absolute", top: 0, left: 0, filter: `drop-shadow(0 0 28px ${theme.red}66)` }}
      >
        <text {...textProps} fill={theme.red}>
          {text}
        </text>
      </svg>

      {/* Video clipped to the glyph shape */}
      <div
        style={{ width: boxW, height: boxH, clipPath: `url(#${clipId})`, overflow: "hidden", position: "relative" }}
      >
        <OffthreadVideo
          src={videoSrc}
          startFrom={videoStartFrom}
          style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${footageZoom})` }}
        />

        {/* Glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 32%)",
            mixBlendMode: "screen",
          }}
        />

        {/* One static reflection band */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "-8%",
            width: "38%",
            height: "18%",
            background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent)",
            transform: "rotate(-16deg)",
            mixBlendMode: "screen",
          }}
        />

        {/* Depth shading at the base */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 28%)",
          }}
        />

        {climaxFlash > 0 && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", opacity: climaxFlash }} />
        )}
      </div>

      {/* Thin white glass outline, drawn last so it stays crisp */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 0, left: 0 }}>
        <text {...textProps} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={2}>
          {text}
        </text>
      </svg>
    </div>
  );
};
