import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { CLIPS } from "../concert-promo/clips";
import { audioConfig } from "../concert-promo/audioConfig";
import { OpeningGlimpses } from "./OpeningGlimpses";
import { DaysHero } from "./DaysHero";
import { QuickCutMontage } from "./QuickCutMontage";
import { TextBeat } from "./TextBeat";
import { RevealClip } from "./RevealClip";
import { FinalDaysCard } from "./FinalDaysCard";
import { FinalTitle } from "./FinalTitle";
import {
  BUILDUP_SLICE_DURATIONS,
  DAYS_HERO_DURATION,
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
  OPENING_DURATION,
  REVEAL_PAUSE_DURATION,
  TOTAL_DURATION,
  TRANSITION_DURATION,
  TYPOGRAPHY_WORDS,
  TYPOGRAPHY_WORD_DURATION,
} from "./durations";

// Punch-cut with a flash — used at every beat so cuts feel synced to the
// music, but kept restrained (short flash, modest scale) per the brief's
// "avoid excessive effects."
const strobeCut = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={pushCut({
      flashColor: "#ffffff",
      flashOpacity: 0.4,
      flashFrames: 2,
      outgoingScale: 1.05,
      incomingStartScale: 1.1,
      incomingEndScale: 1.0,
    })}
  />
);

export const BnrTrailer: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile(audioConfig.src)}
        volume={(f) =>
          interpolate(
            f,
            // Slow ~3s ambient build before the beat comes in, per
            // "start with silence... slowly introduce the music."
            [0, 90, TOTAL_DURATION - audioConfig.fadeOutFrames, TOTAL_DURATION],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />

      <TransitionSeries>
        {/* SCENE 1 — opening tension: near-black glimpses, not a bright
            montage. Builds toward "something is coming." */}
        <TransitionSeries.Sequence durationInFrames={OPENING_DURATION}>
          <OpeningGlimpses durationInFrames={OPENING_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("opening-to-hero")}

        {/* SCENE 2 — the signature shot: DAYS_LEFT filled with concert
            footage, light sweep reveal, bass-hit climax. */}
        <TransitionSeries.Sequence durationInFrames={DAYS_HERO_DURATION}>
          <DaysHero videoSrc={CLIPS[0].src} durationInFrames={DAYS_HERO_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("hero-to-buildup")}

        {/* SCENE 3 — build-up montage: very short, fast-accelerating cuts. */}
        <TransitionSeries.Sequence
          durationInFrames={BUILDUP_SLICE_DURATIONS.reduce((a, b) => a + b, 0)}
        >
          <QuickCutMontage sliceDurations={BUILDUP_SLICE_DURATIONS} clipOffset={1} />
        </TransitionSeries.Sequence>

        {strobeCut("buildup-to-reveal")}

        {/* SCENE 4 — everything slows down: one cinematic pause on the
            event, then BNR / SOFIA / SATURDAY one at a time. */}
        <TransitionSeries.Sequence durationInFrames={REVEAL_PAUSE_DURATION}>
          <RevealClip clip={CLIPS[2 % CLIPS.length]} index={0} durationInFrames={REVEAL_PAUSE_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("pause-to-typography")}

        {TYPOGRAPHY_WORDS.map((word, i) => (
          <Fragment key={word}>
            <TransitionSeries.Sequence durationInFrames={TYPOGRAPHY_WORD_DURATION}>
              <TextBeat word={word} durationInFrames={TYPOGRAPHY_WORD_DURATION} />
            </TransitionSeries.Sequence>
            {i < TYPOGRAPHY_WORDS.length - 1 && strobeCut(`typography-${i}`)}
          </Fragment>
        ))}

        {strobeCut("typography-to-final")}

        {/* SCENE 5 — the countdown returns as the strongest visual, then
            the ticket card. */}
        <TransitionSeries.Sequence durationInFrames={FINAL_DAYS_CARD_DURATION}>
          <FinalDaysCard durationInFrames={FINAL_DAYS_CARD_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("final-days-to-title")}

        <TransitionSeries.Sequence durationInFrames={FINAL_TITLE_DURATION}>
          <FinalTitle />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
