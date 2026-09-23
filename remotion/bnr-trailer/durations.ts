import { TYPOGRAPHY_BEATS } from "./typographyBeats";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Scene 0 — drone establishing shot: a wide aerial of the crowd pouring
// into the venue, as the very first thing the viewer sees. Source clip is
// only ~2.8s (84 frames), so this stays short rather than freezing/looping.
// Trimmed 70 -> 52 -> 36: still lingering too long before the trailer
// actually gets going.
export const DRONE_OPEN_DURATION = 36;

// Scene 1 — opening tension (0-4s target): near-black glimpses. Trimmed
// 110 -> 100 to shorten the overall trailer a bit — still lands exactly
// on OpeningGlimpses' last cut start (100), so every cut keeps its full
// floor duration (10 frames), no truncated/flickery final cut.
export const OPENING_DURATION = 100;

// Scene 2 — the days-left hero reveal (4-10s target): light sweep +
// masked video number + bass-hit climax. Trimmed from 160 -> 110 (the
// number was holding on screen too long), then bumped to 134: the "UNTIL
// BANDATA NA RUBA" subtitle fades in at frame 42, so at 110 it was only
// visible for 68 frames (~2.3s) before the cut — now visible for at
// least 90 frames (3s). Bumped again to 160: the new trailer-style
// "ЗАВРЪЩАНЕТО" voice line runs longer than the old one, and it needs to
// finish before the climax riser starts (see ZAVRASHTANETO_VO_DURATION
// in BnrTrailer.tsx) so the voice doesn't talk over the bass drop.
export const DAYS_HERO_DURATION = 160;

// Scene 3 — build-up / crowd-explosion montage (10-16s target): very
// short slices (~0.2-0.6s each = 6-18 frames at 30fps). Trimmed from 13
// slices to 9 — ENERGY_ORDER only has 9 ranked clips, so the extra 4
// slices were wrapping back around and repeating clips already shown
// earlier in this same montage. Trimmed again 9 -> 8: clip-10 (ranked
// position 6) also appears in OpeningGlimpses just ~3s earlier in the
// trailer, so the same shot was flashing twice in quick succession —
// dropped its slice here and passed a matching 8-entry clipOrder
// (below, in BnrTrailer.tsx) rather than reusing another clip already
// used once in this same montage.
export const BUILDUP_SLICE_DURATIONS = [18, 16, 14, 12, 10, 16, 12, 10];
export const BUILDUP_DURATION = BUILDUP_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

// Scene 3.5 — two dedicated feature shots for bnr-clip-02/03 (the
// costumed-performer crowd-surf and the fisheye confetti blast), each
// held well over a second rather than the ~0.3-0.5s flash they got as
// buildup-montage slices. Trimmed slightly (45->36, 42->34) to shorten
// the overall trailer — still well over a second each.
export const SPIDERMAN_FEATURE_DURATION = 36;
export const CONFETTI_FEATURE_DURATION = 34;

// Scene 4 — JOY STATION / SOFIA venue reveal (16-19s target). Trimmed
// 80 -> 68 to shorten the overall trailer — city text is fully settled
// by frame 24, still leaving a comfortable hold before the cut.
export const JOY_STATION_DURATION = 68;

// Scene 5 — BNR reveal (19-21s target): a brief cinematic pause on the
// event, then each word appears on its own beat (see typographyBeats.ts
// for the per-word duration/variant/voiceover).
export const REVEAL_PAUSE_DURATION = 16;
export const TYPOGRAPHY_WORDS = TYPOGRAPHY_BEATS.map((b) => b.word);
const TYPOGRAPHY_TOTAL_DURATION = TYPOGRAPHY_BEATS.reduce((a, b) => a + b.duration, 0);

// Scene 6 — final title/ticket card. The countdown number used to come
// back here too ("DAYS LEFT" a second time), but that was one repeat
// too many — DaysHero already delivers that beat, so this scene was
// removed and the confetti feature now cuts straight to FinalTitle.
// Trimmed 85 -> 72 to shorten the overall trailer — the CTA/site lines
// finish fading in by frame 50, still leaving a solid hold.
export const FINAL_TITLE_DURATION = 72;

// Total item count in the top-level TransitionSeries: droneOpen(1) +
// opening(1) + daysHero(1) + buildup(1) + spidermanFeature(1) +
// confettiFeature(1) + joyStation(1) + revealPause(1) + typography(N) +
// finalTitle(1).
const TOTAL_ITEM_COUNT = 1 + 1 + 1 + 1 + 1 + 1 + 1 + 1 + TYPOGRAPHY_BEATS.length + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  DRONE_OPEN_DURATION +
  OPENING_DURATION +
  DAYS_HERO_DURATION +
  BUILDUP_DURATION +
  SPIDERMAN_FEATURE_DURATION +
  CONFETTI_FEATURE_DURATION +
  JOY_STATION_DURATION +
  REVEAL_PAUSE_DURATION +
  TYPOGRAPHY_TOTAL_DURATION +
  FINAL_TITLE_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
