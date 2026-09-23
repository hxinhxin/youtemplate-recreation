import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { TitleCard } from "./TitleCard";
import { ClubClip } from "./ClubClip";
import { OutroCard } from "./OutroCard";
import { COSMO_CLIP_A, COSMO_CLIP_A2, COSMO_CLIP_B, COSMO_CLIP_C } from "./clips";
import {
  CLUB_A2_DURATION,
  CLUB_A_DURATION,
  CLUB_B_DURATION,
  CLUB_C_DURATION,
  OUTRO_DURATION,
  TITLE_DURATION,
  TRANSITION_DURATION,
} from "./durations";
import { theme } from "./theme";

// Same restrained punch-cut used throughout bnr-trailer — a short white
// flash and a small scale kick, not a flashy wipe.
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

export const CosmoTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: theme.background }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={TITLE_DURATION}>
          <TitleCard durationInFrames={TITLE_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("title-to-clubA")}

        {/* Club 1 — COSMO, opening the night. */}
        <TransitionSeries.Sequence durationInFrames={CLUB_A_DURATION}>
          <ClubClip clip={COSMO_CLIP_A} index={0} durationInFrames={CLUB_A_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clubA-to-clubB")}

        {/* Club 2 — teal/cyan room, DJ booth visible. */}
        <TransitionSeries.Sequence durationInFrames={CLUB_B_DURATION}>
          <ClubClip clip={COSMO_CLIP_B} index={1} durationInFrames={CLUB_B_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clubB-to-clubC")}

        {/* Club 3 — white panel screens, different mood again. */}
        <TransitionSeries.Sequence durationInFrames={CLUB_C_DURATION}>
          <ClubClip clip={COSMO_CLIP_C} index={2} durationInFrames={CLUB_C_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clubC-to-clubA2")}

        {/* Back to COSMO to close the night — different source clip from
            scene 1 so it isn't a repeat of the same footage. */}
        <TransitionSeries.Sequence durationInFrames={CLUB_A2_DURATION}>
          <ClubClip clip={COSMO_CLIP_A2} index={3} durationInFrames={CLUB_A2_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("clubA2-to-outro")}

        <TransitionSeries.Sequence durationInFrames={OUTRO_DURATION}>
          <OutroCard durationInFrames={OUTRO_DURATION} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
