import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { concertInfo } from "./concertInfo";
import { theme } from "../concert-promo/theme";
import { CLIPS } from "../concert-promo/clips";
import { LightBurst } from "./LightBurst";
import { ImpactFlash } from "./ImpactFlash";
import { RadialRays } from "./RadialRays";
import { VideoFilledText } from "./VideoFilledText";

const heroClip = CLIPS[0];

// Computed once at module load — a snapshot of "time remaining" as of
// whenever this is rendered, since the video itself is a fixed export.
const target = new Date(concertInfo.targetDate).getTime();
const diffMs = Math.max(target - Date.now(), 0);
const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
const totalHours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
const totalMinutes = Math.floor((diffMs / (1000 * 60)) % 60);

const pad = (n: number) => Math.max(0, Math.round(n)).toString().padStart(2, "0");

const LANDING_FRAME = 30;

export const Countdown: React.FC = () => {
  const frame = useCurrentFrame();

  // Numbers tick up rapidly into place — a "counter" reveal rather than a
  // literal ticking clock, since this is a fixed render.
  const progress = interpolate(frame, [0, LANDING_FRAME], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const days = progress * totalDays;
  const hours = progress * totalHours;
  const minutes = progress * totalMinutes;

  // Bigger overshoot on landing — punches out past 1.4x before settling.
  const settle = interpolate(frame, [LANDING_FRAME, LANDING_FRAME + 5, LANDING_FRAME + 16], [1, 1.4, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(3)),
  });

  // Bigger, longer screen shake right on impact.
  const shakeWindow = frame - LANDING_FRAME;
  const shakeMag = interpolate(shakeWindow, [0, 18], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = shakeMag > 0 ? Math.sin(shakeWindow * 9) * shakeMag : 0;
  const shakeY = shakeMag > 0 ? Math.cos(shakeWindow * 11) * shakeMag : 0;

  const labelOpacity = interpolate(frame, [LANDING_FRAME + 6, LANDING_FRAME + 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const glow = interpolate(frame, [LANDING_FRAME, LANDING_FRAME + 5, LANDING_FRAME + 20], [0, 60, 20], {
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
      <LightBurst triggerFrame={LANDING_FRAME} />
      <ImpactFlash triggerFrame={LANDING_FRAME} />

      <div
        style={{
          textAlign: "center",
          transform: `scale(${settle}) translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        <div style={{ filter: `drop-shadow(0 0 ${glow}px ${theme.accent})` }}>
          <VideoFilledText
            text={pad(days)}
            fontSize={220}
            width={620}
            height={260}
            clipId="countdown-days-clip"
            videoSrc={heroClip.src}
          />
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            fontWeight: 700,
            color: theme.accent,
            fontSize: 38,
            letterSpacing: 9,
            marginTop: 8,
          }}
        >
          DAYS TO GO
        </div>
        <div style={{ marginTop: 32 }}>
          <VideoFilledText
            text={`${pad(hours)}:${pad(minutes)}`}
            fontSize={58}
            width={340}
            height={80}
            clipId="countdown-hhmm-clip"
            videoSrc={heroClip.src}
            videoStartFrom={60}
          />
        </div>
        <div
          style={{
            fontFamily: theme.bodyFont,
            color: theme.text,
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: 4,
            marginTop: 28,
            opacity: labelOpacity,
            textTransform: "uppercase",
          }}
        >
          {concertInfo.day} · {concertInfo.venue}
        </div>
      </div>
    </AbsoluteFill>
  );
};
