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
  confettiFeatureTimeline,
  daysHeroTimeline,
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

// Voiceover lines that speak the same words as they land on screen —
// timed to each word's own fade-in beat rather than the scene start, so
// the voice and the text arrive together. Durations are the actual
// rendered clip lengths (rounded up to whole frames at 30fps).
const SOFIA_VO_START = joyStationTimeline.start + 16; // city text fade-in
const SOFIA_VO_DURATION = 58;
const ZAVRASHTANETO_VO_START = daysHeroTimeline.start + 34; // hero word fade-in
const ZAVRASHTANETO_VO_DURATION = 58;
const TAZI_SABOTA_VO_START = typographyTimelines[1].start; // "ТАЗИ СЪБОТА" beat
const TAZI_SABOTA_VO_DURATION = 68;

// Ducks the main music track under each voiceover line so the words stay
// intelligible, then recovers once the line finishes — mirrors the
// riser/impact ducking already used at the two climaxes.
const { frames: duckFrames, values: duckValues } = buildVolumeCurve([
  [0, 1],
  [SOFIA_VO_START - 8, 1],
  [SOFIA_VO_START, 0.4],
  [SOFIA_VO_START + SOFIA_VO_DURATION, 0.4],
  [SOFIA_VO_START + SOFIA_VO_DURATION + 10, 1],
  [ZAVRASHTANETO_VO_START - 8, 1],
  [ZAVRASHTANETO_VO_START, 0.4],
  [ZAVRASHTANETO_VO_START + ZAVRASHTANETO_VO_DURATION, 0.4],
  [ZAVRASHTANETO_VO_START + ZAVRASHTANETO_VO_DURATION + 10, 1],
  [TAZI_SABOTA_VO_START - 8, 1],
  [TAZI_SABOTA_VO_START, 0.4],
  [TAZI_SABOTA_VO_START + TAZI_SABOTA_VO_DURATION, 0.4],
  [TAZI_SABOTA_VO_START + TAZI_SABOTA_VO_DURATION + 10, 1],
  [TOTAL_DURATION, 1],
]);
const musicDuck = (f: number) =>
  interpolate(f, duckFrames, duckValues, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Redesigned for a clean, "one thing at a time" cinematic mix instead of
// everything playing simultaneously. Only TWO moments get a full
// riser+impact+crowd-reaction stack (the DaysHero climax and the final
// drop) — every other beat is the music alone, breathing up and down.
// Each build has real space beforehand (a genuine low point, not just a
// small dip) so the impact actually lands, and volume points sit a few
// frames ahead of the visual cut they lead into rather than lining up
// exactly, so the next section audibly starts before the cut lands.
const { frames: volumeFrames, values: volumeValues } = buildVolumeCurve([
  [0, 0],
  [10, 0.22], // low, atmospheric under the drone open
  [joyStationTimeline.start + 26, 0.5], // rising through the venue reveal
  [daysHeroTimeline.start + 12, 0.72], // building through the countdown
  [daysHeroClimax - 32, 0.72], // hold before pulling back
  [daysHeroClimax - 22, 0.25], // SPACE — short tension, let the riser breathe
  [daysHeroClimax, 0.2], // duck hard so the impact cuts through clean
  [daysHeroClimax + 18, 0.78], // recover strong, leads into the next scene
  [openingTimeline.start + 26, 0.45], // pull back for the quiet tension scene
  [buildupTimeline.start - 6, 0.55], // lean into the crowd-explosion a beat early
  [buildupTimeline.start + 14, 0.72], // no crowd layer here anymore, music carries it
  [buildupTimeline.start + 100, 0.72],
  [revealPauseTimeline.start - 4, 0.48], // breathe out for the cinematic pause
  [bnrBeat + 6, 0.55],
  [typographyTimelines[1].start + 4, 0.62],
  [spidermanFeatureTimeline.start + 12, 0.72], // rebuilding energy
  [confettiFeatureTimeline.start + 6, 0.78],
  [finalCtaBeat - 32, 0.78], // hold before the final pull-back
  [finalCtaBeat - 20, 0.3], // SPACE — short tension before the final riser
  [finalCtaBeat, 0.22], // duck hard for the final impact
  [finalCtaBeat + 16, 0.5], // stay low while the crowd reaction owns the moment
  [finalCtaBeat + 32, 0.85], // big final recovery for the closing CTA hold
  [TOTAL_DURATION, 0], // hard cut to black, not a slow fade
]);
const trackVolume = (f: number) =>
  interpolate(f, volumeFrames, volumeValues, { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const BnrTrailer: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      {/* Main track — one continuous piece, ducked/risen at the beats
          rather than crossfaded between multiple songs (we only have one).
          Also ducked under each voiceover line via musicDuck. */}
      <Audio src={staticFile(audioConfig.src)} volume={trackVolume(frame) * musicDuck(frame)} />

      {/* Voiceover — speaks the same words as they land on screen, in a
          voice cloned from the reference the client sent. Each line is
          timed to that word's own fade-in beat (see the VO constants
          above), not the scene start, so voice and text arrive together. */}
      <Sequence from={SOFIA_VO_START} durationInFrames={SOFIA_VO_DURATION}>
        <Audio src={staticFile("audio/vo/vo_sofia.mp3")} volume={1} />
      </Sequence>
      <Sequence from={ZAVRASHTANETO_VO_START} durationInFrames={ZAVRASHTANETO_VO_DURATION}>
        <Audio src={staticFile("audio/vo/vo_zavrashtaneto.mp3")} volume={1} />
      </Sequence>
      <Sequence from={TAZI_SABOTA_VO_START} durationInFrames={TAZI_SABOTA_VO_DURATION}>
        <Audio src={staticFile("audio/vo/vo_tazi_sabota.mp3")} volume={1} />
      </Sequence>

      {/* Crowd audio — down to ONE moment now, not two. The buildup-montage
          surge was cut entirely (that scene already carries plenty of
          energy from the music + fast cuts alone, and stacking a crowd
          layer on top of that was still reading as too busy). What's left
          is a single, quieter scream reserved for the biggest visual
          moment — the final drop — rather than any use of it elsewhere. */}
      <Sequence from={finalCtaBeat - 4} durationInFrames={44}>
        <CrowdAudio src={CLIPS[HERO_CLIP_INDEX].src} startFrom={480} durationInFrames={44} volume={0.35} fadeFrames={16} />
      </Sequence>

      {/* Riser + impact hits — only at the two real climaxes now. There
          used to be a third, bare impact hit at the BNR typography beat
          with no riser leading into it; the beat already has its own
          visual "slam" entrance, so the extra hit was noise without a
          clear purpose rather than an intentional beat. Each riser is
          exactly riser.wav's own length (36 frames) so it plays out in
          full instead of getting cut off mid-swell. */}
      <Sequence from={daysHeroClimax - 30} durationInFrames={36}>
        <AudioHit kind="riser" volume={0.5} />
      </Sequence>
      <Sequence from={daysHeroClimax} durationInFrames={20}>
        <AudioHit kind="impact" volume={0.6} />
      </Sequence>
      <Sequence from={finalCtaBeat - 30} durationInFrames={36}>
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
            cuts, cycling through the most energetic clips first. Custom
            clipOrder (ENERGY_ORDER with clip-10 dropped) — clip-10 also
            appears in OpeningGlimpses just ~3s earlier in the trailer, so
            using the default order flashed the same shot twice in quick
            succession. */}
        <TransitionSeries.Sequence durationInFrames={BUILDUP_DURATION}>
          <QuickCutMontage sliceDurations={BUILDUP_SLICE_DURATIONS} clipOrder={[3, 5, 10, 6, 9, 4, 2, 1]} />
        </TransitionSeries.Sequence>

        {strobeCut("buildup-to-pause")}

        {/* SCENE 5 (moved earlier) — everything slows down: one cinematic
            pause on the event, then BANDATA NA RUBA / ТАЗИ СЪБОТА one at a
            time (venue/city dropped — JoyStationReveal already covers
            them). Moved up from after the venue reveal so the event
            name/date show up much sooner in the trailer instead of being
            backloaded near the very end. */}
        <TransitionSeries.Sequence durationInFrames={REVEAL_PAUSE_DURATION}>
          {/* clip-08 (index 6) rather than the hero clip — DaysHero,
              the typography beats and FinalTitle already each have their
              own dedicated clip, so this pause gets its own too instead
              of repeating footage already shown. */}
          <RevealClip
            clip={{ ...CLIPS[6], startFrom: 150 }}
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
