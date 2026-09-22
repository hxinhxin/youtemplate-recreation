import { TYPOGRAPHY_BEATS } from "./typographyBeats";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Scene 1 — opening tension (0-4s target): near-black glimpses.
export const OPENING_DURATION = 110;

// Scene 2 — the days-left hero reveal (4-10s target): light sweep +
// masked video number + bass-hit climax.
export const DAYS_HERO_DURATION = 160;

// Scene 3 — build-up / crowd-explosion montage (10-16s target): very
// short slices (~0.2-0.6s each = 6-18 frames at 30fps).
export const BUILDUP_SLICE_DURATIONS = [18, 16, 14, 12, 10, 16, 14, 12, 10, 8, 16, 12, 10];
export const BUILDUP_DURATION = BUILDUP_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

// Scene 4 — JOY STATION / SOFIA venue reveal (16-19s target).
export const JOY_STATION_DURATION = 80;

// Scene 5 — BNR reveal (19-21s target): a brief cinematic pause on the
// event, then each word appears on its own beat (see typographyBeats.ts
// for the per-word duration/variant/voiceover).
export const REVEAL_PAUSE_DURATION = 16;
export const TYPOGRAPHY_WORDS = TYPOGRAPHY_BEATS.map((b) => b.word);
const TYPOGRAPHY_TOTAL_DURATION = TYPOGRAPHY_BEATS.reduce((a, b) => a + b.duration, 0);

// Scene 6 — final card (21-25s target): the countdown returns, then the
// ticket info.
export const FINAL_DAYS_CARD_DURATION = 45;
export const FINAL_TITLE_DURATION = 85;

// Total item count in the top-level TransitionSeries: opening(1) +
// daysHero(1) + buildup(1) + joyStation(1) + revealPause(1) +
// typography(4) + finalDaysCard(1) + finalTitle(1).
const TOTAL_ITEM_COUNT = 1 + 1 + 1 + 1 + 1 + TYPOGRAPHY_BEATS.length + 1 + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  OPENING_DURATION +
  DAYS_HERO_DURATION +
  BUILDUP_DURATION +
  JOY_STATION_DURATION +
  REVEAL_PAUSE_DURATION +
  TYPOGRAPHY_TOTAL_DURATION +
  FINAL_DAYS_CARD_DURATION +
  FINAL_TITLE_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
