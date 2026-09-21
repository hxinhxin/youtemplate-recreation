import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { iris } from "@remotion/transitions/iris";
import { pushCut } from "@remotion/transitions/push-cut";
import { CLIPS } from "./clips";
import {
  HEIGHT,
  INTRO_DURATION,
  OUTRO_DURATION,
  TOTAL_DURATION,
  TRANSITION_DURATION,
  WIDTH,
} from "./durations";
import { IntroCard } from "./IntroCard";
import { OutroCard } from "./OutroCard";
import { ClipWithOverlay } from "./ClipWithOverlay";
import { Sticker } from "./Sticker";
import { clipTimelines, introTimeline, outroTimeline } from "./timeline";
import { audioConfig } from "./audioConfig";

// Punchy scale-cut with the flash disabled (flashOpacity: 0) so the cut
// stays snappy without ever tinting a frame — no color grading touched.
const punch = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={pushCut({ flashOpacity: 0 })}
  />
);

// Cuts between clips alternate a circular iris reveal with the punch-cut
// so no two transitions in a row feel the same — no sliding or flipping,
// just a punchy zoom/reveal pair.
const clipTransition = (key: string, i: number) =>
  i % 2 === 0 ? (
    <TransitionSeries.Transition
      key={key}
      timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
      presentation={iris({ width: WIDTH, height: HEIGHT })}
    />
  ) : (
    punch(key)
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

        {punch("intro-to-clip1")}

        {CLIPS.map((clip, i) => (
          <Fragment key={clip.src}>
            <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
              <ClipWithOverlay clip={clip} index={i} />
            </TransitionSeries.Sequence>
            {i < CLIPS.length - 1 && clipTransition(`clip-${i}`, i)}
          </Fragment>
        ))}

        {punch("last-clip-to-outro")}

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
