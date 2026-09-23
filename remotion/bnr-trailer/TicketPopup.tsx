import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "./theme";

// A second, mid-trailer flash of the ticket CTA — the final card is the
// only other place it appears, and that's a while after this scene, so
// this plants the link earlier too rather than making the viewer wait
// for the very end. Rendered as a standalone overlay (not a scene of its
// own in the TransitionSeries) so it floats on top of whatever footage
// is already playing without touching any existing scene's timing.
export const TicketPopup: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, 8, 14, durationInFrames - 8, durationInFrames], [0.5, 1.14, 1, 1, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const opacity = interpolate(frame, [0, 7, durationInFrames - 8, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const glow = 30 + Math.sin(frame / 7) * 14;
  const flash = interpolate(frame, [0, 3, 9], [0.5, 0.18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundColor: "#ffffff", opacity: flash }} />
      <AbsoluteFill
        style={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingBottom: 340,
        }}
      >
        <div style={{ textAlign: "center", opacity, transform: `scale(${scale})` }}>
          <div
            style={{
              fontFamily: theme.bodyFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 38,
              letterSpacing: 5,
              textTransform: "uppercase",
              textShadow: `0 0 ${glow}px ${theme.red}, 0 0 ${glow * 2}px ${theme.red}`,
            }}
          >
            {concertInfo.cta}
          </div>
          <div
            style={{
              marginTop: 16,
              display: "inline-block",
              fontFamily: theme.bodyFont,
              fontWeight: 900,
              color: theme.white,
              fontSize: 44,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              backgroundColor: theme.red,
              padding: "10px 32px",
              borderRadius: 100,
              boxShadow: `0 0 ${glow}px ${theme.red}, 0 0 ${glow * 2.5}px ${theme.red}88, 0 8px 24px rgba(0,0,0,0.5)`,
            }}
          >
            {concertInfo.ticketSite}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
