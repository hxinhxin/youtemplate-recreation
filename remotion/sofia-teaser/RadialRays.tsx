import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../concert-promo/theme";

// Slow-spinning sunburst behind the hero text — a concert-spotlight
// backdrop. Pure conic-gradient overlay, no filter on the footage.
export const RadialRays: React.FC<{ opacity?: number }> = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  const rotation = frame * 0.15;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        opacity,
        background: `conic-gradient(from ${rotation}deg, ${theme.accent} 0deg, transparent 12deg, transparent 24deg, ${theme.accent} 30deg, transparent 42deg, transparent 54deg, ${theme.accent} 60deg, transparent 72deg, transparent 84deg, ${theme.accent} 90deg, transparent 102deg, transparent 114deg, ${theme.accent} 120deg, transparent 132deg, transparent 144deg, ${theme.accent} 150deg, transparent 162deg, transparent 174deg, ${theme.accent} 180deg, transparent 192deg, transparent 204deg, ${theme.accent} 210deg, transparent 222deg, transparent 234deg, ${theme.accent} 240deg, transparent 252deg, transparent 264deg, ${theme.accent} 270deg, transparent 282deg, transparent 294deg, ${theme.accent} 300deg, transparent 312deg, transparent 324deg, ${theme.accent} 330deg, transparent 342deg, transparent 360deg)`,
      }}
    />
  );
};
