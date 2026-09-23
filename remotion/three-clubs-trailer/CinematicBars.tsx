import { AbsoluteFill } from "remotion";

// Thin black letterbox bars top and bottom, held for the whole video —
// the fastest way to read "trailer" instead of "phone clip" on a
// vertical frame.
export const CinematicBars: React.FC = () => {
  const barStyle = {
    position: "absolute" as const,
    left: 0,
    right: 0,
    height: 84,
    backgroundColor: "#000000",
  };

  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ ...barStyle, top: 0 }} />
      <div style={{ ...barStyle, bottom: 0 }} />
    </AbsoluteFill>
  );
};
