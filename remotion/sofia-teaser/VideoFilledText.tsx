import { useMemo } from "react";
import { interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "../concert-promo/theme";

// Renders `text` as a shape that the concert footage plays through —
// video clipped to the glyph outlines via an SVG clipPath, with a solid
// accent-colored copy underneath as a glow/outline so it stays readable
// against any footage brightness.
export const VideoFilledText: React.FC<{
  text: string;
  fontSize: number;
  width: number;
  height: number;
  clipId: string;
  videoSrc: string;
  videoStartFrom?: number;
}> = ({ text, fontSize, width, height, clipId, videoSrc, videoStartFrom = 0 }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, 90], [1, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const textProps = useMemo(
    () => ({
      x: width / 2,
      y: height / 2,
      textAnchor: "middle" as const,
      dominantBaseline: "central" as const,
      fontFamily: theme.headlineFont,
      fontWeight: 900,
      fontSize,
    }),
    [width, height, fontSize],
  );

  return (
    <div style={{ position: "relative", width, height, display: "inline-block" }}>
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <text {...textProps}>{text}</text>
          </clipPath>
        </defs>
      </svg>

      {/* Glow/outline layer so the shape reads even on bright footage */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, filter: `drop-shadow(0 0 26px ${theme.accent})` }}
      >
        <text {...textProps} fill={theme.accent}>
          {text}
        </text>
      </svg>

      <div style={{ width, height, clipPath: `url(#${clipId})`, overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrc}
          startFrom={videoStartFrom}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${zoom})`,
          }}
        />
      </div>
    </div>
  );
};
