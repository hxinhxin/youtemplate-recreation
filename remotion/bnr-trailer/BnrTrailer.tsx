import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { BNR_CLIPS as CLIPS } from "./clips";
import { audioConfig } from "../concert-promo/audioConfig";
import { DroneOpen, droneClipSrc } from "./DroneOpen";
import { OpeningGlimpses } from "./OpeningGlimpses";
import { DaysHero } from "./DaysHero";
import { QuickCutMontage } from "./QuickCutMontage";
import { JoyStationReveal } from "./JoyStationReveal";
import { TextBeat } from "./TextBeat";
import { RevealClip } from "./RevealClip";
import { FinalDaysCard } from "./FinalDaysCard";
import { FinalTitle } from "./FinalTitle";
import { CrowdAudio } from "./CrowdAudio";
import { AudioHit } from "./AudioHit";
import { HERO_CLIP_INDEX, VENUE_CLIP_INDEX } from "./energyOrder";
import {
  BUILDUP_DURATION,
  BUILDUP_SLICE_DURATIONS,
  CONFETTI_FEATURE_DURATION,
  DAYS_HERO_DURATION,
  DRONE_OPEN_DURATION,
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
  JOY_STATION_DURATION,
  OPENING_DURATION,
  REVEAL_PAUSE_DURATION,
  SPIDERMAN_FEATURE_DURATION,
  TOTAL_DURATION,
  TRANSITION_DURATION,
} from "./durations";
import { TYPOGRAPHY_BEATS } from "./typographyBeats";
import {
  buildupTimeline,
  confettiFeatureTimeline,
  daysHeroTimeline,
  droneOpenTimeline,
  finalDaysCardTimeline,
  finalTitleTimeline,
  joyStationTimeline,
  openingTimeline,
  revealPauseTimeline,
  spidermanFeatureTimeline,
  typographyTimelines,
} from "./timeline";
import { buildVolumeCurve } from "./volumeCurve";

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

// Where the DaysHero climax (bass hit) lands, matching MaskedVideoNumber's
// default `climaxFrame = durationInFrames - 18`.
const daysHeroClimax = daysHeroTimeline.start + DAYS_HERO_DURATION - 18;
const bnrBeat = typographyTimelines[0].start;
const finalCtaBeat = finalTitleTimeline.start + 26;

// Crowd-audio coverage spans, computed from the timeline so the ambience
// runs continuously across scenes instead of a few isolated windows —
// abrupt on/off cuts were reading as the screams getting "cut out."
const lastTypographyTimeline = typographyTimelines[typographyTimelines.length - 1];
const revealToTypographyDuration =
  lastTypographyTimeline.start + lastTypographyTimeline.duration - revealPauseTimeline.start;
const finalSectionDuration = finalTitleTimeline.start + FINAL_TITLE_DURATION - finalDaysCardTimeline.start;

// One continuous track, not several songs stitched together — we only
// have the one piece of music. "DJ-style" movement instead comes from
// ducking it under crowd audio and layering riser/impact hits at the
// beats, rather than crossfading between different songs. Points are
// sorted and de-collided by buildVolumeCurve, so referencing each scene's
// own .start (safe by construction) instead of hand-computed end frames
// avoids the overlap math going wrong.
const { frames: volumeFrames, values: volumeValues } = buildVolumeCurve([
  [0, 0],
  [droneOpenTimeline.start + 20, 0.18], // stay low under the drone shot's own crowd sound
  [openingTimeline.start + 90, 0.65],
  [daysHeroClimax - 30, 0.65],
  [daysHeroClimax, 0.35],
  [daysHeroClimax + 9, 0.7],
  [buildupTimeline.start, 0.45], // duck under the crowd-explosion montage
  [joyStationTimeline.start, 0.58],
  [revealPauseTimeline.start, 0.68],
  [bnrBeat, 0.35], // duck for the BNR impact hit
  [bnrBeat + 10, 0.72],
  [finalCtaBeat - 2, 0.72],
  [finalCtaBeat, 0.4], // duck for the final drop
  [finalCtaBeat + 10, 0.78],
  [TOTAL_DURATION - 8, 0.78],
  [TOTAL_DURATION, 0], // hard cut to black, not a slow fade
]);
const trackVolume = (f: number) =>
  interpolate(f, volumeFrames, volumeValues, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const BnrTrailer: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Main track — one continuous piece, ducked/risen at the beats
          rather than crossfaded between multiple songs (we only have one). */}
      <Audio src={staticFile(audioConfig.src)} volume={trackVolume(frame)} />

      {/* Crowd audio beds — the clips' own embedded crowd/DJ sound, ducked
          under the music so the audience is actually audible. Long fades
          (see CrowdAudio's default) and near-continuous coverage across
          scenes, rather than a few isolated windows, so the crowd swells
          up/down instead of abruptly cutting. */}
      <Sequence from={droneOpenTimeline.start} durationInFrames={DRONE_OPEN_DURATION}>
        <CrowdAudio src={droneClipSrc} durationInFrames={DRONE_OPEN_DURATION} volume={0.22} />
      </Sequence>
      <Sequence from={openingTimeline.start} durationInFrames={OPENING_DURATION}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} durationInFrames={OPENING_DURATION} volume={0.16} />
      </Sequence>
      <Sequence from={daysHeroTimeline.start} durationInFrames={DAYS_HERO_DURATION}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} startFrom={20} durationInFrames={DAYS_HERO_DURATION} volume={0.22} />
      </Sequence>
      <Sequence from={buildupTimeline.start} durationInFrames={BUILDUP_DURATION}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} durationInFrames={BUILDUP_DURATION} volume={0.3} />
      </Sequence>
      <Sequence from={spidermanFeatureTimeline.start} durationInFrames={SPIDERMAN_FEATURE_DURATION}>
        <CrowdAudio src={CLIPS[11].src} durationInFrames={SPIDERMAN_FEATURE_DURATION} volume={0.28} fadeFrames={14} />
      </Sequence>
      <Sequence from={confettiFeatureTimeline.start} durationInFrames={CONFETTI_FEATURE_DURATION}>
        <CrowdAudio src={CLIPS[12].src} durationInFrames={CONFETTI_FEATURE_DURATION} volume={0.28} fadeFrames={14} />
      </Sequence>
      <Sequence from={joyStationTimeline.start} durationInFrames={JOY_STATION_DURATION}>
        <CrowdAudio src={CLIPS[VENUE_CLIP_INDEX].src} startFrom={30} durationInFrames={JOY_STATION_DURATION} volume={0.22} />
      </Sequence>
      <Sequence from={revealPauseTimeline.start} durationInFrames={revealToTypographyDuration}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} startFrom={60} durationInFrames={revealToTypographyDuration} volume={0.2} />
      </Sequence>
      <Sequence from={finalDaysCardTimeline.start} durationInFrames={finalSectionDuration}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} startFrom={100} durationInFrames={finalSectionDuration} volume={0.2} />
      </Sequence>

      {/* Riser + impact hits at the signature beats. */}
      <Sequence from={daysHeroClimax - 30} durationInFrames={36}>
        <AudioHit kind="riser" volume={0.55} />
      </Sequence>
      <Sequence from={daysHeroClimax} durationInFrames={20}>
        <AudioHit kind="impact" volume={0.6} />
      </Sequence>
      <Sequence from={bnrBeat} durationInFrames={20}>
        <AudioHit kind="impact" volume={0.5} />
      </Sequence>
      <Sequence from={finalCtaBeat - 30} durationInFrames={30}>
        <AudioHit kind="riser" volume={0.5} />
      </Sequence>
      <Sequence from={finalCtaBeat} durationInFrames={20}>
        <AudioHit kind="impact" volume={0.6} />
      </Sequence>

      <TransitionSeries>
        {/* SCENE 0 — drone establishing shot: the crowd pouring into the
            venue, wide and alive, before the trailer tightens into the
            darker opening glimpses. */}
        <TransitionSeries.Sequence durationInFrames={DRONE_OPEN_DURATION}>
          <DroneOpen durationInFrames={DRONE_OPEN_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("drone-to-opening")}

        {/* SCENE 1 — opening tension: near-black glimpses, not a bright
            montage. Builds toward "something is coming." */}
        <TransitionSeries.Sequence durationInFrames={OPENING_DURATION}>
          <OpeningGlimpses durationInFrames={OPENING_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("opening-to-hero")}

        {/* SCENE 2 — the signature shot: DAYS_LEFT filled with the most
            energetic crowd footage, light sweep reveal, bass-hit climax. */}
        <TransitionSeries.Sequence durationInFrames={DAYS_HERO_DURATION}>
          <DaysHero videoSrc={CLIPS[HERO_CLIP_INDEX].src} durationInFrames={DAYS_HERO_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("hero-to-buildup")}

        {/* SCENE 3 — crowd-explosion montage: very short, fast-accelerating
            cuts, cycling through the most energetic clips first. */}
        <TransitionSeries.Sequence durationInFrames={BUILDUP_DURATION}>
          <QuickCutMontage sliceDurations={BUILDUP_SLICE_DURATIONS} />
        </TransitionSeries.Sequence>

        {strobeCut("buildup-to-spiderman")}

        {/* SCENE 3.5a — dedicated feature shot for bnr-clip-02 (the
            costumed performer crowd-surfing), held well over a second
            instead of the quick-cut flash it got in the buildup montage. */}
        <TransitionSeries.Sequence durationInFrames={SPIDERMAN_FEATURE_DURATION}>
          <RevealClip clip={CLIPS[11]} index={0} durationInFrames={SPIDERMAN_FEATURE_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("spiderman-to-confetti")}

        {/* SCENE 3.5b — dedicated feature shot for bnr-clip-03 (the
            fisheye confetti/CO2 blast), same treatment. */}
        <TransitionSeries.Sequence durationInFrames={CONFETTI_FEATURE_DURATION}>
          <RevealClip clip={CLIPS[12]} index={1} durationInFrames={CONFETTI_FEATURE_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("confetti-to-venue")}

        {/* SCENE 4 — JOY STATION / SOFIA venue reveal, a major visual
            element in its own right. */}
        <TransitionSeries.Sequence durationInFrames={JOY_STATION_DURATION}>
          <JoyStationReveal durationInFrames={JOY_STATION_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("venue-to-pause")}

        {/* SCENE 5 — everything slows down: one cinematic pause on the
            event, then BNR / SOFIA / JOY STATION / SATURDAY one at a time. */}
        <TransitionSeries.Sequence durationInFrames={REVEAL_PAUSE_DURATION}>
          <RevealClip
            clip={{ ...CLIPS[HERO_CLIP_INDEX], startFrom: 270 }}
            index={0}
            durationInFrames={REVEAL_PAUSE_DURATION}
          />
        </TransitionSeries.Sequence>

        {strobeCut("pause-to-typography")}

        {TYPOGRAPHY_BEATS.map((beat, i) => (
          <Fragment key={beat.word}>
            <TransitionSeries.Sequence durationInFrames={beat.duration}>
              <TextBeat
                word={beat.word}
                durationInFrames={beat.duration}
                variant={beat.variant}
                videoSrc={CLIPS[beat.clipIndex].src}
                videoStartFrom={150 + beat.clipIndex * 10}
              />
            </TransitionSeries.Sequence>
            {i < TYPOGRAPHY_BEATS.length - 1 && strobeCut(`typography-${i}`)}
          </Fragment>
        ))}

        {strobeCut("typography-to-final")}

        {/* SCENE 6 — the countdown returns as the strongest visual, then
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
