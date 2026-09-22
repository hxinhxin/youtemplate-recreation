import { Easing, interpolate, OffthreadVideo, useCurrentFrame } from "remotion";
import { theme } from "./theme";
import { WIDTH, HEIGHT } from "./durations";

// The hero countdown digit: concert footage clipped to the shape of the
// glyph via an SVG clipPath (the video exists INSIDE the number, not
// behind a transparent layer on top of it). A thin white outline, a soft
// sheen, a sweeping reflection band, a subtle red accent glow, and film
// grain — kept premium, not glitchy, but constantly moving: a breathing
// pulse, a slow rotation wobble, a stronger camera push, and a periodic
// light sweep on top of the one-time reveal and climax.
export const MaskedVideoNumber: React.FC<{
  text: string;
  videoSrc: string;
  videoStartFrom?: number;
  durationInFrames: number;
  climaxFrame?: number;
  // When set, the number surges and its outline/glow/shadow fade away in
  // the final `breakApartFrames`, leaving just the growing video — so the
  // cut into the next (full-bleed) scene reads as pushing THROUGH the
  // number into the footage, not a static card cutting away.
  breakApart?: boolean;
  breakApartFrames?: number;
}> = ({
  text,
  videoSrc,
  videoStartFrom = 0,
  durationInFrames,
  climaxFrame,
  breakApart = false,
  breakApartFrames = 16,
}) => {
  const frame = useCurrentFrame();
  const clipId = "days-hero-clip";
  const boxW = WIDTH;
  const boxH = HEIGHT * 0.5;
  const fontSize = text.length > 1 ? 620 : 900;

  // Cinematic reveal: scale/opacity/blur settle in together.
  const revealProgress = interpolate(frame, [0, 26], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const revealScale = interpolate(revealProgress, [0, 1], [0.72, 1]);
  const revealOpacity = interpolate(revealProgress, [0, 1], [0, 1]);
  const revealBlur = interpolate(revealProgress, [0, 1], [18, 0]);

  // Stronger, continuous camera push for the rest of the shot.
  const pushIn = interpolate(frame, [26, durationInFrames], [1, 1.28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // A subtle breathing pulse and rotation wobble on top of the push, so the
  // number never sits perfectly still.
  const breathe = 1 + Math.sin(frame / 14) * 0.025;
  const wobble = Math.sin(frame / 22) * 1.6;

  const footageZoom = interpolate(frame, [0, durationInFrames], [1, 1.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // A light streak that sweeps across the glass repeatedly (not just once).
  const streakCycle = 46;
  const streakProgress = (frame % streakCycle) / streakCycle;
  const streakOffset = interpolate(streakProgress, [0, 1], [-40, 140]);

  // A soft rhythmic pulse on the red glow, like it's breathing with a beat.
  const beatPulse = 22 + Math.sin(frame / 9) * 10;

  // A single stronger shake + scale punch right at the climax (bass hit).
  const climax = climaxFrame ?? durationInFrames - 18;
  const climaxWindow = frame - climax;
  const climaxShakeMag = interpolate(climaxWindow, [0, 14], [11, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shakeX = climaxWindow >= 0 && climaxShakeMag > 0 ? Math.sin(frame * 8) * climaxShakeMag : 0;
  const shakeY = climaxWindow >= 0 && climaxShakeMag > 0 ? Math.cos(frame * 7) * climaxShakeMag * 0.6 : 0;
  const climaxPunch = interpolate(climaxWindow, [0, 6, 16], [1, 1.12, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(2)),
  });
  const climaxFlash = interpolate(climaxWindow, [0, 2, 8], [0, 0.5, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // The "push through" surge: only active when breakApart is set, in the
  // final breakApartFrames. Scale surges hard; the outline/glow/shadow
  // fade out faster than the video so only the growing footage remains by
  // the time the cut lands, selling "moving through the number."
  const breakStart = durationInFrames - breakApartFrames;
  const breakProgress = breakApart
    ? interpolate(frame, [breakStart, durationInFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.cubic),
      })
    : 0;
  const breakScale = 1 + breakProgress * 1.6;
  const chromeOpacity = 1 - Math.min(breakProgress * 1.6, 1); // outline/glow/shadow fade first
  const breakBlur = breakProgress * 6;

  const scale = revealScale * pushIn * breathe * climaxPunch * breakScale;

  const textProps = {
    x: boxW / 2,
    y: boxH / 2,
    textAnchor: "middle" as const,
    dominantBaseline: "central" as const,
    fontFamily: theme.headlineFont,
    fontWeight: 900,
    fontSize,
  };

  return (
    <div
      style={{
        position: "relative",
        width: boxW,
        height: boxH,
        transform: `scale(${scale}) rotate(${wobble}deg) translate(${shakeX}px, ${shakeY}px)`,
        opacity: revealOpacity,
        filter: `blur(${revealBlur + breakBlur}px)`,
      }}
    >
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <text {...textProps}>{text}</text>
          </clipPath>
        </defs>
      </svg>

      {/* Soft shadow duplicate for a slight 3D lift off the background */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 8, left: 5, opacity: 0.45 * chromeOpacity }}>
        <text {...textProps} fill="#000000">
          {text}
        </text>
      </svg>

      {/* Red accent glow — pulses gently instead of sitting static */}
      <svg
        width={boxW}
        height={boxH}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          opacity: chromeOpacity,
          filter: `drop-shadow(0 0 ${beatPulse}px ${theme.red}66)`,
        }}
      >
        <text {...textProps} fill={theme.red}>
          {text}
        </text>
      </svg>

      {/* Video clipped to the glyph shape */}
      <div
        style={{ width: boxW, height: boxH, clipPath: `url(#${clipId})`, overflow: "hidden", position: "relative" }}
      >
        <OffthreadVideo
          src={videoSrc}
          startFrom={videoStartFrom}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${footageZoom})`,
            // Bright and contrasty on purpose — the footage inside the
            // glyph needs to read clearly, not as a dark texture.
            filter: "contrast(1.2) saturate(1.15) brightness(1.25)",
          }}
        />

        {/* Glass sheen */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 32%)",
            mixBlendMode: "screen",
          }}
        />

        {/* Sweeping reflection band, repeating instead of a single static pass */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: `${streakOffset}%`,
            width: "38%",
            height: "18%",
            background: "linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent)",
            transform: "rotate(-16deg)",
            mixBlendMode: "screen",
          }}
        />

        {/* Depth shading at the base — kept light so the footage stays
            clearly visible, not a dark texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.22) 0%, transparent 22%)",
          }}
        />

        {climaxFlash > 0 && (
          <div style={{ position: "absolute", inset: 0, backgroundColor: "#ffffff", opacity: climaxFlash }} />
        )}
      </div>

      {/* Thin white glass outline, drawn last so it stays crisp */}
      <svg width={boxW} height={boxH} style={{ position: "absolute", top: 0, left: 0, opacity: chromeOpacity }}>
        <text {...textProps} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={2}>
          {text}
        </text>
      </svg>
    </div>
  );
};
