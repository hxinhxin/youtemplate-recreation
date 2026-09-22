import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { INTRO_DURATION } from "./durations";
import { LightBurst } from "./LightBurst";
import { ImpactFlash } from "./ImpactFlash";
import { RadialRays } from "./RadialRays";

const words = concertInfo.act.split(" ");
const STAGGER = 4;

export const IntroCard: React.FC = () => {
  const frame = useCurrentFrame();

  const shakeMag = interpolate(frame, [0, 14], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeMag > 0 ? Math.sin(frame * 10) * shakeMag : 0;
  const shakeY = shakeMag > 0 ? Math.cos(frame * 8) * shakeMag : 0;

  const barWidth = interpolate(frame, [8 + words.length * STAGGER, 20 + words.length * STAGGER], [0, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const cityDelay = words.length * STAGGER;
  const cityOpacity = interpolate(frame, [cityDelay + 10, cityDelay + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glow = interpolate(frame, [0, 8, 30], [0, 55, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.background,
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}
    >
      <RadialRays />
      <LightBurst triggerFrame={0} />
      <ImpactFlash triggerFrame={0} />

      <div
        style={{
          transform: `translate(${shakeX}px, ${shakeY}px)`,
          textAlign: "center",
          padding: "0 60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "0 22px",
          }}
        >
          {words.map((word, i) => {
            const start = i * STAGGER;
            // Each word slams in on its own beat instead of the whole
            // line moving together — a stamped, assembled-in-pieces feel.
            const wordScale = interpolate(frame, [start, start + 8, start + 14], [0.3, 1.35, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(4)),
            });
            const wordOpacity = interpolate(frame, [start, start + 5], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <span
                key={word + i}
                style={{
                  display: "inline-block",
                  fontFamily: theme.headlineFont,
                  fontWeight: 900,
                  color: theme.text,
                  fontSize: 100,
                  lineHeight: 1.0,
                  textTransform: "uppercase",
                  textShadow: `0 0 ${glow}px ${theme.accent}`,
                  opacity: wordOpacity,
                  transform: `scale(${wordScale})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
        <div
          style={{
            width: barWidth,
            height: 6,
            background: theme.accent,
            margin: "22px auto",
            boxShadow: `0 0 18px ${theme.accent}`,
          }}
        />
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.accent,
            fontSize: 42,
            fontWeight: 700,
            letterSpacing: 7,
            textTransform: "uppercase",
            opacity: cityOpacity,
          }}
        >
          {concertInfo.city}
        </div>
      </div>
    </AbsoluteFill>
  );
};
