import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { TitleCard } from "./TitleCard";
import { ClipScene } from "./ClipScene";
import { OutroCard } from "./OutroCard";
import { PLOVDIV_CLIP_1, PLOVDIV_CLIP_2, PLOVDIV_CLIP_3, PLOVDIV_CLIP_4, PLOVDIV_CLIP_5 } from "./clips";
import {
  CLIP_1_DURATION,
  CLIP_2_DURATION,
  CLIP_3_DURATION,
  CLIP_4_DURATION,
  CLIP_5_DURATION,
  OUTRO_DURATION,
  TITLE_DURATION,
  TRANSITION_DURATION,
} from "./durations";
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

export const PlovdivTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_DURATION}>
          <TitleCard durationInFrames={TITLE_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("title-to-clip1")}

        <TransitionSeries.Sequence durationInFrames={CLIP_1_DURATION}>
          <ClipScene clip={PLOVDIV_CLIP_1} index={0} durationInFrames={CLIP_1_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clip1-to-clip2")}

        <TransitionSeries.Sequence durationInFrames={CLIP_2_DURATION}>
          <ClipScene clip={PLOVDIV_CLIP_2} index={1} durationInFrames={CLIP_2_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clip2-to-clip3")}

        <TransitionSeries.Sequence durationInFrames={CLIP_3_DURATION}>
          <ClipScene clip={PLOVDIV_CLIP_3} index={2} durationInFrames={CLIP_3_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clip3-to-clip4")}

        <TransitionSeries.Sequence durationInFrames={CLIP_4_DURATION}>
          <ClipScene clip={PLOVDIV_CLIP_4} index={3} durationInFrames={CLIP_4_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clip4-to-clip5")}

        <TransitionSeries.Sequence durationInFrames={CLIP_5_DURATION}>
          <ClipScene clip={PLOVDIV_CLIP_5} index={4} durationInFrames={CLIP_5_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clip5-to-outro")}

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroCard durationInFrames={OUTRO_DURATION} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
