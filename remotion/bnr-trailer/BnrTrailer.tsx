import { Fragment } from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { pushCut } from "@remotion/transitions/push-cut";
import { BNR_CLIPS as CLIPS } from "./clips";
import { audioConfig } from "../concert-promo/audioConfig";
import { DroneOpen } from "./DroneOpen";
import { OpeningGlimpses } from "./OpeningGlimpses";
import { DaysHero } from "./DaysHero";
import { QuickCutMontage } from "./QuickCutMontage";
import { JoyStationReveal } from "./JoyStationReveal";
import { TextBeat } from "./TextBeat";
import { RevealClip } from "./RevealClip";
import { FinalTitle } from "./FinalTitle";
import { CrowdAudio } from "./CrowdAudio";
import { AudioHit } from "./AudioHit";
import { HERO_CLIP_INDEX } from "./energyOrder";
import {
  BUILDUP_DURATION,
  BUILDUP_SLICE_DURATIONS,
  CONFETTI_FEATURE_DURATION,
  DAYS_HERO_DURATION,
  DRONE_OPEN_DURATION,
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
  daysHeroTimeline,
  droneOpenTimeline,
  finalTitleTimeline,
  joyStationTimeline,
  openingTimeline,
  revealPauseTimeline,
  typographyTimelines,
} from "./timeline";
import { buildVolumeCurve } from "./volumeCurve";

// Punch-cut with a flash — used at every beat so cuts feel synced to the
// music, but kept restrained (short flash, modest scale) per the brief's
// "avoid excessive effects." Flash opacity lowered from 0.4 -> 0.22 — the
// brighter flash was reading as a camera-flash "photo" freeze rather than
// a video cut.
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

// Where the DaysHero climax (bass hit) lands, matching MaskedVideoNumber's
// default `climaxFrame = durationInFrames - 18`.
const daysHeroClimax = daysHeroTimeline.start + DAYS_HERO_DURATION - 18;
const bnrBeat = typographyTimelines[0].start;
const finalCtaBeat = finalTitleTimeline.start + 26;

// One continuous track, not several songs stitched together — we only
// have the one piece of music. "DJ-style" movement instead comes from
// ducking it under crowd audio and layering riser/impact hits at the
// beats, rather than crossfading between different songs. Points are
// sorted and de-collided by buildVolumeCurve, so referencing each scene's
// own .start (safe by construction) instead of hand-computed end frames
// avoids the overlap math going wrong.
const { frames: volumeFrames, values: volumeValues } = buildVolumeCurve([
  [0, 0],
  [droneOpenTimeline.start + 20, 0.25], // stay low under the drone shot's own crowd sound
  [openingTimeline.start + 90, 0.8],
  [daysHeroClimax - 30, 0.8],
  [daysHeroClimax, 0.5],
  [daysHeroClimax + 9, 0.85],
  [buildupTimeline.start, 0.6], // duck under the crowd-explosion montage
  [joyStationTimeline.start, 0.75],
  [revealPauseTimeline.start, 0.85],
  [bnrBeat, 0.5], // duck for the BNR impact hit
  [bnrBeat + 10, 0.88],
  [finalCtaBeat - 2, 0.88],
  [finalCtaBeat, 0.55], // duck for the final drop
  [finalCtaBeat + 10, 0.92],
  [TOTAL_DURATION - 8, 0.92],
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

      {/* Crowd audio bed — ONE single source's embedded audio, playing
          continuously under the whole trailer, kept low enough that the
          mp3 track is unmistakably the main audio. Previously this
          switched between 5 different clips' own audio (each a different
          moment of the live DJ set), which meant several different
          pieces of music colliding with the main track at once — that
          was the actual cause of the mix sounding cacophonic, not just
          the volume levels. One continuous source avoids that clash
          entirely. Lowered 0.14 -> 0.07 so it reads as background crowd
          texture (some screaming still audible) rather than a second
          competing track. */}
      <Sequence from={droneOpenTimeline.start} durationInFrames={TOTAL_DURATION - droneOpenTimeline.start}>
        <CrowdAudio
          src={CLIPS[HERO_CLIP_INDEX].src}
          durationInFrames={TOTAL_DURATION - droneOpenTimeline.start}
          volume={0.07}
          fadeFrames={40}
        />
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

        {strobeCut("drone-to-venue")}

        {/* SCENE 4 (moved up) — JOY STATION / SOFIA venue reveal, now
            establishing where before the countdown urgency of DaysHero. */}
        <TransitionSeries.Sequence durationInFrames={JOY_STATION_DURATION}>
          <JoyStationReveal durationInFrames={JOY_STATION_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("venue-to-hero")}

        {/* SCENE 2 — the signature shot: DAYS_LEFT filled with the most
            energetic crowd footage, light sweep reveal, bass-hit climax. */}
        <TransitionSeries.Sequence durationInFrames={DAYS_HERO_DURATION}>
          <DaysHero videoSrc={CLIPS[HERO_CLIP_INDEX].src} durationInFrames={DAYS_HERO_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("hero-to-opening")}

        {/* SCENE 1 — opening tension: near-black glimpses, not a bright
            montage. Now a breather after the countdown reveal, building
            back up toward the crowd-explosion montage. */}
        <TransitionSeries.Sequence durationInFrames={OPENING_DURATION}>
          <OpeningGlimpses durationInFrames={OPENING_DURATION} />
        </TransitionSeries.Sequence>

        {strobeCut("opening-to-buildup")}

        {/* SCENE 3 — crowd-explosion montage: very short, fast-accelerating
            cuts, cycling through the most energetic clips first. */}
        <TransitionSeries.Sequence durationInFrames={BUILDUP_DURATION}>
          <QuickCutMontage sliceDurations={BUILDUP_SLICE_DURATIONS} />
        </TransitionSeries.Sequence>

        {strobeCut("buildup-to-pause")}

        {/* SCENE 5 (moved earlier) — everything slows down: one cinematic
            pause on the event, then BANDATA NA RUBA / ТАЗИ СЪБОТА one at a
            time (venue/city dropped — JoyStationReveal already covers
            them). Moved up from after the venue reveal so the event
            name/date show up much sooner in the trailer instead of being
            backloaded near the very end. */}
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
                logo={beat.logo}
              />
            </TransitionSeries.Sequence>
            {i < TYPOGRAPHY_BEATS.length - 1 && strobeCut(`typography-${i}`)}
          </Fragment>
        ))}

        {strobeCut("typography-to-spiderman")}

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

        {strobeCut("confetti-to-final")}

        {/* SCENE 6 — the ticket card. The countdown number isn't repeated
            here anymore — DaysHero already delivers that beat, and
            bringing it back was one repeat too many. */}
        <TransitionSeries.Sequence durationInFrames={FINAL_TITLE_DURATION}>
          <FinalTitle />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
