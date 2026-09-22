import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import type { TextVariant } from "./typographyBeats";

// Single-word reveal card. Crowd footage plays continuously behind the
// text (Ken Burns zoom + a partial gradient, never a solid color) so the
// typography reads as overlaid on the event rather than a black card.
export const TextBeat: React.FC<{
  word: string;
  durationInFrames: number;
  variant?: TextVariant;
  videoSrc: string;
  videoStartFrom?: number;
}> = ({ word, durationInFrames, variant = "slam", videoSrc, videoStartFrom = 0 }) => {
  const frame = useCurrentFrame();

  const zoom = interpolate(frame, [0, durationInFrames], [1, 1.16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const opacity = interpolate(frame, [0, 6], [0, 1], { extrapolateRight: "clamp" });
  const glow = interpolate(frame, [0, 8, 20], [0, 50, 20], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let transform = "";
  let blur = 0;
  let letterSpacing = 4;

  if (variant === "slam") {
    const scale = interpolate(frame, [0, 8, 14, durationInFrames], [0.5, 1.15, 1, 1.04], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(3)),
    });
    blur = interpolate(frame, [0, 8], [10, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    letterSpacing = 4 + interpolate(frame, [0, 12], [0, 4], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    transform = `scale(${scale})`;
  } else if (variant === "slideLeft") {
    const x = interpolate(frame, [0, 14, 20], [420, -18, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    blur = interpolate(frame, [0, 10], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    transform = `translateX(${x}px)`;
  } else if (variant === "dropTop") {
    const y = interpolate(frame, [0, 14, 20, 26], [-500, 30, -10, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    transform = `translateY(${y}px)`;
  } else if (variant === "scaleRotate") {
    const scale = interpolate(frame, [0, 16], [0.2, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2.5)),
    });
    const rotate = interpolate(frame, [0, 16], [-25, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
    transform = `scale(${scale}) rotate(${rotate}deg)`;
  }

  // Longer words (e.g. "JOY STATION", "Bandata na Ruba") get a smaller
  // size so they never overflow the 1080px canvas.
  const fontSize = word.length > 12 ? 70 : word.length > 8 ? 92 : word.length > 5 ? 118 : 140;

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, overflow: "hidden" }}>
      <OffthreadVideo
        src={videoSrc}
        startFrom={videoStartFrom}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${zoom})`,
          filter: "contrast(1.2) saturate(1.15) brightness(1.3)",
        }}
      />

      {/* Partial gradient for legibility — never fully opaque */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(5,5,5,0.6) 0%, rgba(5,5,5,0.25) 40%, rgba(5,5,5,0.65) 100%)",
        }}
      />

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform,
            opacity,
            filter: blur ? `blur(${blur}px)` : undefined,
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.white,
            fontSize,
            letterSpacing,
            textTransform: "uppercase",
            textShadow: `0 0 ${glow}px ${theme.red}`,
            textAlign: "center",
            padding: "0 40px",
          }}
        >
          {word}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
