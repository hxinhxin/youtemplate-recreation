import { AbsoluteFill, OffthreadVideo } from "remotion";
import type { ClipConfig } from "./clips";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";

export const ClipWithOverlay: React.FC<{ clip: ClipConfig }> = ({ clip }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <OffthreadVideo
        src={clip.src}
        startFrom={clip.startFrom ?? 0}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* Lower-third: keeps the concert name/date on screen through the footage */}
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          background:
            "linear-gradient(to top, rgba(10,10,15,0.85) 0%, rgba(10,10,15,0) 40%)",
        }}
      >
        <div style={{ padding: "0 48px 96px" }}>
          <div
            style={{
              fontFamily: theme.headlineFont,
              fontWeight: 900,
              color: theme.text,
              fontSize: 44,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.name}
          </div>
          <div
            style={{
              fontFamily: theme.bodyFont,
              marginTop: 8,
              color: theme.accent,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            {concertInfo.date} · {concertInfo.venue}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
