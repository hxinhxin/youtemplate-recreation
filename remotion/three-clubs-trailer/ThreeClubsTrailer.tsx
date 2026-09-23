import { Fragment } from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { TitleCard } from "./TitleCard";
import { ClipScene } from "./ClipScene";
import { OutroCard } from "./OutroCard";
import { CinematicBars } from "./CinematicBars";
import { MIXED_CLIPS } from "./venues";
import { OUTRO_DURATION, TITLE_DURATION, TRANSITION_DURATION } from "./durations";
import { theme } from "./theme";

// Harder, brighter flash and a bigger push on every cut than a subtle
// trailer would use — this is the rhythm the whole edit is built around.
const strobeCut = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={pushCut({
      flashColor: "#ffffff",
      flashOpacity: 0.4,
      flashFrames: 3,
      outgoingScale: 1.1,
      incomingStartScale: 1.22,
      incomingEndScale: 1.0,
    })}
  />
);

// One video for the whole night out — a single title card, then every
// venue's clips round-robined together (see venues.ts's MIXED_CLIPS) so
// the cut bounces between venues instead of playing them as separate
// blocks, then one shared outro with every venue's logo. Adding a clip
// (to an existing venue or a new one) in venues.ts is all it takes —
// this component and durations.ts's TOTAL_DURATION don't need to change.
export const ThreeClubsTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_DURATION}>
          <TitleCard durationInFrames={TITLE_DURATION} />
        </TransitionSeries.Sequence>

        {MIXED_CLIPS.map((clip, index) => (
          <Fragment key={`${clip.venueKey}-${index}`}>
            {strobeCut(`cut-${index}`)}

            <TransitionSeries.Sequence durationInFrames={clip.durationInFrames}>
              <ClipScene clip={clip} index={index} />
            </TransitionSeries.Sequence>
          </Fragment>
        ))}

        {strobeCut("to-outro")}

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroCard durationInFrames={OUTRO_DURATION} />
        </TransitionSeries.Sequence>
      </TransitionSeries>

      <CinematicBars />
    </AbsoluteFill>
  );
};
