import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { CLIPS } from "../concert-promo/clips";
import { audioConfig } from "../concert-promo/audioConfig";
import { GlassNumber } from "./GlassNumber";
import { QuickCutMontage } from "./QuickCutMontage";
import { TextBeat } from "./TextBeat";
import { RevealClip } from "./RevealClip";
import { FinalTitle } from "./FinalTitle";
import { REVEAL_BEATS } from "./revealBeats";
import {
  BREAK_APART_FRAMES,
  COUNTDOWN_DURATIONS,
  FINAL_BURST_SLICE_DURATIONS,
  FINAL_TITLE_DURATION,
  OPENING_SLICE_DURATIONS,
  TOTAL_DURATION,
  TRANSITION_DURATION,
} from "./durations";

// Strobe-flash punch-cut — the brief explicitly wants flashes and hard
// cuts synced to the beat throughout this trailer, unlike the softer
// no-flash cuts used in the other two videos.
const strobeCut = (key: string) => (
  <TransitionSeries.Transition
    key={key}
    timing={linearTiming({ durationInFrames: TRANSITION_DURATION })}
    presentation={pushCut({
      flashColor: "#ffffff",
      flashOpacity: 0.55,
      flashFrames: 2,
      outgoingScale: 1.08,
      incomingStartScale: 1.15,
      incomingEndScale: 1.0,
    })}
  />
);

const countdownDigits = ["3", "2", "1"];

export const BhrTrailer: React.FC = () => {
  return (
    <AbsoluteFill>
      <Audio
        src={staticFile(audioConfig.src)}
        volume={(f) =>
          interpolate(
            f,
            [0, audioConfig.fadeInFrames, TOTAL_DURATION - audioConfig.fadeOutFrames, TOTAL_DURATION],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />

      <TransitionSeries>
        {/* Opening tension-builder, no literal tournament footage available
            — reuses the concert clips as the intense cold open. */}
        <TransitionSeries.Sequence
          durationInFrames={OPENING_SLICE_DURATIONS.reduce((a, b) => a + b, 0)}
        >
          <QuickCutMontage sliceDurations={OPENING_SLICE_DURATIONS} />
        </TransitionSeries.Sequence>

        {strobeCut("opening-to-countdown")}

        {/* 3 -> 2 -> 1, each numeral filled with a different clip */}
        {countdownDigits.map((digit, i) => (
          <Fragment key={digit}>
            <TransitionSeries.Sequence durationInFrames={COUNTDOWN_DURATIONS[i]}>
              <AbsoluteFill
                style={{ backgroundColor: "#050505", justifyContent: "center", alignItems: "center" }}
              >
                <GlassNumber
                  digit={digit}
                  videoSrc={CLIPS[i % CLIPS.length].src}
                  videoStartFrom={i * 25}
                  durationInFrames={COUNTDOWN_DURATIONS[i]}
                  breakApart={i === countdownDigits.length - 1}
                  breakApartFrames={BREAK_APART_FRAMES}
                />
              </AbsoluteFill>
            </TransitionSeries.Sequence>
            {i < countdownDigits.length - 1 && strobeCut(`countdown-${i}`)}
          </Fragment>
        ))}

        {strobeCut("countdown-to-reveal")}

        {/* Concert reveal: clips + BHR / SOFIA / SATURDAY word beats */}
        {REVEAL_BEATS.map((beat, i) => (
          <Fragment key={i}>
            <TransitionSeries.Sequence durationInFrames={beat.duration}>
              {beat.type === "clip" ? (
                <RevealClip
                  clip={CLIPS[beat.clipIndex % CLIPS.length]}
                  index={beat.clipIndex}
                  durationInFrames={beat.duration}
                />
              ) : (
                <TextBeat word={beat.word} durationInFrames={beat.duration} />
              )}
            </TransitionSeries.Sequence>
            {i < REVEAL_BEATS.length - 1 && strobeCut(`reveal-${i}`)}
          </Fragment>
        ))}

        {strobeCut("reveal-to-burst")}

        <TransitionSeries.Sequence
          durationInFrames={FINAL_BURST_SLICE_DURATIONS.reduce((a, b) => a + b, 0)}
        >
          <QuickCutMontage sliceDurations={FINAL_BURST_SLICE_DURATIONS} clipOffset={2} />
        </TransitionSeries.Sequence>

        {strobeCut("burst-to-title")}

        <TransitionSeries.Sequence durationInFrames={FINAL_TITLE_DURATION}>
          <FinalTitle />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
