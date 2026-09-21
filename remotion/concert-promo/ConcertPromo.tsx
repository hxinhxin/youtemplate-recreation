import { Fragment } from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CLIPS } from "./clips";
import { INTRO_DURATION, OUTRO_DURATION, TRANSITION_DURATION } from "./durations";
import { IntroCard } from "./IntroCard";
import { OutroCard } from "./OutroCard";
import { ClipWithOverlay } from "./ClipWithOverlay";
import { Sticker } from "./Sticker";
import { clipTimelines, introTimeline, outroTimeline } from "./timeline";

const transition = (
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={fade()}
  />
);

// A curated subset of the sticker pack — enough to add energy without
// cluttering the frame or fighting the text overlays for attention.
const midClip = clipTimelines[Math.floor(clipTimelines.length / 2)];

export const ConcertPromo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={INTRO_DURATION}>
          <IntroCard />
        </TransitionSeries.Sequence>

        {transition}

        {CLIPS.map((clip, i) => (
          <Fragment key={clip.src}>
            <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
              <ClipWithOverlay clip={clip} />
            </TransitionSeries.Sequence>
            {i < CLIPS.length - 1 && transition}
          </Fragment>
        ))}

        {transition}

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
