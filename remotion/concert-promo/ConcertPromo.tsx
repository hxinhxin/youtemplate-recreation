import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { CLIPS } from "./clips";
import { INTRO_DURATION, OUTRO_DURATION, TOTAL_DURATION, TRANSITION_DURATION } from "./durations";
import { IntroCard } from "./IntroCard";
import { OutroCard } from "./OutroCard";
import { ClipWithOverlay } from "./ClipWithOverlay";
import { Sticker } from "./Sticker";
import { clipTimelines, introTimeline, outroTimeline } from "./timeline";
import { audioConfig } from "./audioConfig";

const fadeTransition = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={fade()}
  />
);

// Bookend transitions (intro<->clips, clips<->outro) stay a clean fade;
// cuts between clips alternate slide directions for punchier pacing.
const clipTransition = (key: string, i: number) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={slide({ direction: i % 2 === 0 ? "from-right" : "from-left" })}
  />
);

// A curated subset of the sticker pack — enough to add energy without
// cluttering the frame or fighting the text overlays for attention.
const midClip = clipTimelines[Math.floor(clipTimelines.length / 2)];

export const ConcertPromo: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      <Audio
        src={staticFile(audioConfig.src)}
        startFrom={Math.round(audioConfig.startFromSeconds * fps)}
        volume={(f) =>
          interpolate(
            f,
            [
              0,
              audioConfig.fadeInFrames,
              TOTAL_DURATION - audioConfig.fadeOutFrames,
              TOTAL_DURATION,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroCard />
        </TransitionSeries.Sequence>

        {fadeTransition("intro-to-clip1")}

        {CLIPS.map((clip, i) => (
          <Fragment key={clip.src}>
            <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
              <ClipWithOverlay clip={clip} index={i} />
            </TransitionSeries.Sequence>
            {i < CLIPS.length - 1 && clipTransition(`clip-${i}`, i)}
          </Fragment>
        ))}

        {fadeTransition("last-clip-to-outro")}

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      {/* Stickers layered on top of the transition series, each in its own
          time window so they pop in, hold, and fade out independently. */}
      <Sequence from={introTimeline.start + 8} durationInFrames={introTimeline.duration - 8}>
        <Sticker
          src={staticFile("stickers/sticker-pointing.png")}
          durationInFrames={introTimeline.duration - 8}
          width={260}
          rotate={-8}
          positionStyle={{ top: 110, right: 50 }}
        />
      </Sequence>

      <Sequence from={midClip.start + 20} durationInFrames={40}>
        <Sticker
          src={staticFile("stickers/sticker-face.png")}
          durationInFrames={40}
          width={220}
          rotate={-6}
          positionStyle={{ top: 90, left: 40 }}
        />
      </Sequence>

      <Sequence from={outroTimeline.start + 15} durationInFrames={outroTimeline.duration - 15}>
        <Sticker
          src={staticFile("stickers/sticker-sunglasses.png")}
          durationInFrames={outroTimeline.duration - 15}
          width={300}
          rotate={6}
          positionStyle={{ bottom: 90, right: 20 }}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
