// Very subtle film grain overlay, reused across the cinematic scenes.
export const FilmGrain: React.FC<{ opacity?: number }> = ({ opacity = 0.05 }) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none" }}>
    <filter id="bnr-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
    </filter>
    <rect width="100%" height="100%" filter="url(#bnr-grain)" />
  </svg>
);
