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
import {
  BREAK_APART_FRAMES,
  COUNTDOWN_DURATIONS,
  FINAL_TITLE_DURATION,
  OPENING_SLICE_DURATIONS,
  REVEAL_CLIP_DURATION,
  TOTAL_DURATION,
  TRANSITION_DURATION,
  TYPOGRAPHY_WORDS,
  TYPOGRAPHY_WORD_DURATION,
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

export const BnrTrailer: React.FC = () => {
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
        {/* SCENE 1 — intro montage. No literal tournament footage exists,
            so it runs on the concert clips per your call; "BNR" flashes
            briefly near the end. */}
        <TransitionSeries.Sequence
          durationInFrames={OPENING_SLICE_DURATIONS.reduce((a, b) => a + b, 0)}
        >
          <QuickCutMontage sliceDurations={OPENING_SLICE_DURATIONS} brandFlash />
        </TransitionSeries.Sequence>

        {strobeCut("opening-to-countdown")}

        {/* SCENE 2 + 3 — 3 -> 2 -> 1, each numeral filled with a different
            clip; "1" shatters/expands into the reveal in its own final
            frames (Scene 3's "zoom through the number"). */}
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

        {/* SCENE 4 — concert reveal: clips only, no text. */}
        {CLIPS.map((clip, i) => (
          <Fragment key={clip.src}>
            <TransitionSeries.Sequence durationInFrames={REVEAL_CLIP_DURATION}>
              <RevealClip clip={clip} index={i} durationInFrames={REVEAL_CLIP_DURATION} />
            </TransitionSeries.Sequence>
            {i < CLIPS.length - 1 && strobeCut(`reveal-${i}`)}
          </Fragment>
        ))}

        {strobeCut("reveal-to-typography")}

        {/* SCENE 5 — event typography: BNR / SOFIA / SATURDAY, one at a time. */}
        {TYPOGRAPHY_WORDS.map((word, i) => (
          <Fragment key={word}>
            <TransitionSeries.Sequence durationInFrames={TYPOGRAPHY_WORD_DURATION}>
              <TextBeat word={word} durationInFrames={TYPOGRAPHY_WORD_DURATION} />
            </TransitionSeries.Sequence>
            {i < TYPOGRAPHY_WORDS.length - 1 && strobeCut(`typography-${i}`)}
          </Fragment>
        ))}

        {strobeCut("typography-to-final")}

        {/* SCENE 6 — final event card. */}
        <TransitionSeries.Sequence durationInFrames={FINAL_TITLE_DURATION}>
          <FinalTitle />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
