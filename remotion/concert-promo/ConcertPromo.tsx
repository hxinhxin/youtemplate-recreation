import { Fragment } from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { CLIPS } from "./clips";
import { INTRO_DURATION, OUTRO_DURATION, TRANSITION_DURATION } from "./durations";
import { IntroCard } from "./IntroCard";
import { OutroCard } from "./OutroCard";
import { ClipWithOverlay } from "./ClipWithOverlay";

const transition = (
  <TransitionSeries.Transition
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={fade()}
  />
);

export const ConcertPromo: React.FC = () => {
  return (
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
  );
};
