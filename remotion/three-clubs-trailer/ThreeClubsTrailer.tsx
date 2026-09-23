import { Fragment } from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { TitleCard } from "./TitleCard";
import { ChapterBump } from "./ChapterBump";
import { ClipScene } from "./ClipScene";
import { OutroCard } from "./OutroCard";
import { VENUES } from "./venues";
import { BUMP_DURATION, OUTRO_DURATION, TITLE_DURATION, TRANSITION_DURATION } from "./durations";
import { theme } from "./theme";

const strobeCut = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={pushCut({
      flashColor: "#ffffff",
      flashOpacity: 0.22,
      flashFrames: 2,
      outgoingScale: 1.05,
      incomingStartScale: 1.1,
      incomingEndScale: 1.0,
    })}
  />
);

// One video for the whole night out — a single title card, then each
// venue in visit order (a quick logo bump introducing it, then its
// clip highlights), then one shared outro with every venue's logo.
// Adding a third venue is just adding it to venues.ts — this component
// (and durations.ts's TOTAL_DURATION) doesn't need to change.
export const ThreeClubsTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_DURATION}>
          <TitleCard durationInFrames={TITLE_DURATION} />
        </TransitionSeries.Sequence>

        {VENUES.map((venue, venueIndex) => (
          <Fragment key={venue.key}>
            {strobeCut(`to-${venue.key}-bump`)}

            <TransitionSeries.Sequence durationInFrames={BUMP_DURATION}>
              <ChapterBump venue={venue} durationInFrames={BUMP_DURATION} />
            </TransitionSeries.Sequence>

            {venue.clips.map((clip, clipIndex) => (
              <Fragment key={`${venue.key}-${clipIndex}`}>
                {strobeCut(`${venue.key}-cut-${clipIndex}`)}

                <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
                  <ClipScene clip={clip} index={venueIndex * 10 + clipIndex} />
                </TransitionSeries.Sequence>
              </Fragment>
            ))}
          </Fragment>
        ))}

        {strobeCut("to-outro")}

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroCard durationInFrames={OUTRO_DURATION} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
