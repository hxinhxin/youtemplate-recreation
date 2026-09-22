import { Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { WIDTH, HEIGHT } from "./durations";

// A single countdown numeral, filled with concert footage (clipped via SVG
// text), with a glass sheen highlight, a moving light streak, an edge glow,
// a camera push-in, and (when `breakApart` is set) a shatter/expand
// dissolve in the final frames that hands off into the reveal.
export const GlassNumber: React.FC<{
  digit: string;
  videoSrc: string;
  videoStartFrom?: number;
  durationInFrames: number;
  breakApart?: boolean;
  breakApartFrames?: number;
}> = ({ digit, videoSrc, videoStartFrom = 0, durationInFrames, breakApart = false, breakApartFrames = 10 }) => {
  const frame = useCurrentFrame();

  const clipId = `glass-number-${digit}`;
  const fontSize = 1000;
  const boxW = WIDTH;
  const boxH = HEIGHT * 0.55;

  // Camera push-in toward the number across its whole time on screen.
  const pushIn = interpolate(frame, [0, durationInFrames], [0.82, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // Entrance pop.
  const entrance = interpolate(frame, [0, 8], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });

  // Light streak sweeping across the glass, on a loop-ish diagonal.
  const streakOffset = interpolate(frame, [0, durationInFrames], [-60, 160], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Footage zoom inside the numeral.
  const footageZoom = interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const breakApartStart = durationInFrames - breakApartFrames;
  const breakProgress = breakApart
    ? interpolate(frame, [breakApartStart, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      })
    : 0;

  const breakScale = 1 + breakProgress * 2.2;
  const breakOpacity = 1 - breakProgress;
  const glitchX = breakProgress > 0 ? Math.sin(frame * 7) * breakProgress * 30 : 0;

  const scale = pushIn * entrance * breakScale;

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
        transform: `scale(${scale}) translateX(${glitchX}px)`,
        opacity: breakOpacity,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <text {...textProps}>{digit}</text>
          </clipPath>
        </defs>
      </svg>

      {/* Deep shadow duplicate, offset for pseudo-3D extrusion */}
      <svg
        width={boxW}
        height={boxH}
        style={{ position: "absolute", top: 10, left: 6, opacity: 0.6 }}
      >
        <text {...textProps} fill="#000000">
          {digit}
        </text>
      </svg>

      {/* Red glow layer */}
      <svg
        width={boxW}
        height={boxH}
        style={{ position: "absolute", top: 0, left: 0, filter: `drop-shadow(0 0 50px ${theme.red})` }}
      >
        <text {...textProps} fill={theme.red}>
          {digit}
        </text>
      </svg>

      {/* Video clipped to the numeral shape */}
      <div style={{ width: boxW, height: boxH, clipPath: `url(#${clipId})`, overflow: "hidden", position: "relative" }}>
        <OffthreadVideo
          src={videoSrc}
          startFrom={videoStartFrom}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${footageZoom})`,
          }}
        />

        {/* Glass sheen highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, transparent 35%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Moving light streak */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(100deg, transparent ${streakOffset - 12}%, rgba(255,255,255,0.75) ${streakOffset}%, transparent ${streakOffset + 12}%)`,
            mixBlendMode: "screen",
          }}
        />

        {/* Bottom edge shading for depth */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 30%)",
          }}
        />
      </div>
    </div>
  );
};
