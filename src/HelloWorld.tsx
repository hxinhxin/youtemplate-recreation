import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const HelloWorld: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#007BFF",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1 style={{ color: "#fff", fontSize: 80, opacity }}>
        Welcome to Our Website
      </h1>
    </AbsoluteFill>
  );
};
