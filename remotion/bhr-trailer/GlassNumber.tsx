import { Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { WIDTH, HEIGHT } from "./durations";

// A single countdown numeral, filled with concert footage (clipped via SVG
// text), with a glass sheen highlight, a static reflection band, a moving
// light streak, a white glass outline, a red edge glow, pseudo-3D shadow,
// a brief chromatic-aberration ghost on entry, a motion-blur snap, a
// camera push-in, and (when `breakApart` is set) a shatter/expand
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

  // Motion-blur snap: sharp-to-blurred-to-sharp on entry, like the number
  // is slamming into focus.
  const entryBlur = interpolate(frame, [0, 6, 12], [14, 4, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Chromatic-aberration ghost: red/cyan offset copies of the outline that
  // converge into the sharp white outline within the first ~10 frames.
  const chromaSpread = interpolate(frame, [0, 10], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
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

  const breakScale = 1 + breakProgress * 2.5;
  const breakOpacity = 1 - breakProgress;
  const breakBlur = breakProgress * 18;
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
        filter: `blur(${entryBlur + breakBlur}px)`,
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
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 10, left: 6, opacity: 0.6 }}>
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

      {/* Chromatic-aberration ghosts (fade to nothing by frame ~10) */}
      {chromaSpread > 0.5 && (
        <>
          <svg
            width={boxW}
            height={boxH}
            style={{ position: "absolute", top: 0, left: -chromaSpread, opacity: 0.5, mixBlendMode: "screen" }}
          >
            <text {...textProps} fill="#ff2b4a" fillOpacity={0}>
              {digit}
            </text>
            <text {...textProps} fill="none" stroke="#ff2b4a" strokeWidth={4}>
              {digit}
            </text>
          </svg>
          <svg
            width={boxW}
            height={boxH}
            style={{ position: "absolute", top: 0, left: chromaSpread, opacity: 0.5, mixBlendMode: "screen" }}
          >
            <text {...textProps} fill="none" stroke="#2bd6ff" strokeWidth={4}>
              {digit}
            </text>
          </svg>
        </>
      )}

      {/* White glass outline */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 0, left: 0 }}>
        <text {...textProps} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={3}>
          {digit}
        </text>
      </svg>

      {/* Video clipped to the numeral shape */}
      <div
        style={{ width: boxW, height: boxH, clipPath: `url(#${clipId})`, overflow: "hidden", position: "relative" }}
      >
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
            background: "linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 35%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Static reflection band, like light catching a glass surface */}
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "-10%",
            width: "45%",
            height: "22%",
            background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.5), transparent)",
            transform: "rotate(-18deg)",
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
