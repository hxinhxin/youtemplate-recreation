import { AbsoluteFill, Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { DAYS_LEFT } from "./daysLeft";
import { LightSweep } from "./LightSweep";
import { MaskedVideoNumber } from "./MaskedVideoNumber";
import { FilmGrain } from "./FilmGrain";

// Scene 2 — the trailer's signature shot: a light sweep cues the reveal,
// then the huge DAYS_LEFT number appears with concert footage moving
// inside it, "DAYS LEFT" spaced out underneath, then "ЗАВРЪЩАНЕТО" lands
// as its own hero typographic beat (same scale/weight family as JOY
// STATION, not a small subtitle), and a bass-hit climax where the number
// expands and pushes through into the crowd (breakApart) — never a flat
// cut from a static card. The backdrop is always dim, blurred concert
// footage, never a solid color, so the frame stays alive even outside
// the glyph.
export const DaysHero: React.FC<{ videoSrc: string; durationInFrames: number }> = ({
  videoSrc,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();

  const bgZoom = interpolate(frame, [0, durationInFrames], [1.1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelOpacity = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const labelY = interpolate(frame, [30, 42], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "ЗАВРЪЩАНЕТО" is a second hero typographic beat in this scene, not a
  // small subtitle — same "slam" entrance language as JOY STATION
  // (scale overshoot + settle, pulsing glow), just timed to land a beat
  // after "ДНИ ОСТАВАТ" settles instead of appearing simultaneously.
  const heroWordScale = interpolate(frame, [34, 44, 50, durationInFrames], [0.55, 1.15, 1, 1.04], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });
  const heroWordOpacity = interpolate(frame, [34, 42], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const heroWordGlow = interpolate(frame, [34, 44, 60], [0, 45, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.background, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
      {/* Dim, blurred concert footage behind everything — the backdrop is
          never a flat color, just atmospheric rather than sharp so the
          masked number reads as the focal point. */}
      <OffthreadVideo
        src={videoSrc}
        startFrom={300}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${bgZoom})`,
          filter: "blur(6px) brightness(0.85) saturate(1.2)",
        }}
      />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, transparent 36%, rgba(5,5,5,0.4) 100%)" }}
      />

      <LightSweep startFrame={8} durationInFrames={20} />

      <div style={{ textAlign: "center" }}>
        <MaskedVideoNumber
          text={String(DAYS_LEFT)}
          videoSrc={videoSrc}
          videoStartFrom={270}
          durationInFrames={durationInFrames}
          breakApart
          breakApartFrames={16}
        />

        <div
          style={{
            marginTop: -20,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.white,
            fontSize: 40,
            letterSpacing: 10,
          }}
        >
          ДНИ ОСТАВАТ
        </div>
      </div>

      {/* Positioned absolutely (not in the flex-centered flow above) —
          a plain in-flow sibling here was mysteriously never painting,
          seemingly a layout/compositing quirk with this scene's
          transform-heavy content; an absolutely-positioned element right
          under the "DAYS LEFT" label renders reliably. A small "ДО"
          kicker restores the "3 ДНИ ОСТАВАТ ДО ЗАВРЪЩАНЕТО" phrase
          without shrinking the hero word back down to a subtitle size. */}
      <div
        style={{
          position: "absolute",
          top: 1470,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: heroWordOpacity,
          fontFamily: theme.bodyFont,
          fontWeight: 700,
          color: theme.white,
          fontSize: 26,
          letterSpacing: 8,
          textTransform: "uppercase",
        }}
      >
        ДО
      </div>

      {/* Sized and treated as a hero word (same fontSize/weight/glow
          family as JOY STATION), not a small subtitle. */}
      <div
        style={{
          position: "absolute",
          top: 1518,
          left: 0,
          right: 0,
          textAlign: "center",
          padding: "0 30px",
          transform: `scale(${heroWordScale})`,
          opacity: heroWordOpacity,
          fontFamily: theme.headlineFont,
          fontWeight: 900,
          WebkitTextStroke: `2px ${theme.white}`,
          color: theme.white,
          fontSize: 80,
          lineHeight: 1.02,
          letterSpacing: 1,
          textTransform: "uppercase",
          textShadow: `0 0 ${heroWordGlow}px ${theme.red}`,
        }}
      >
        ЗАВРЪЩАНЕТО
      </div>

      <FilmGrain opacity={0.04} />
    </AbsoluteFill>
  );
};
