import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ opacity, textAlign: "center", padding: "0 60px" }}>
        <div
          style={{
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.text,
            fontSize: 64,
            lineHeight: 1.1,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.venue}
        </div>

        <div
          style={{
            marginTop: 32,
            fontFamily: theme.bodyFont,
            color: theme.textMuted,
            fontSize: 32,
            fontWeight: 500,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {concertInfo.lineup.map((act) => (
            <div key={act}>{act}</div>
          ))}
        </div>

        <div
          style={{
            marginTop: 48,
            fontFamily: theme.headlineFont,
            fontWeight: 900,
            color: theme.accent,
            fontSize: 44,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.cta}
        </div>
      </div>
    </AbsoluteFill>
  );
};
