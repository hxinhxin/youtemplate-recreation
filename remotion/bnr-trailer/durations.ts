export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Scene 1 — opening tension (0-4s target): near-black glimpses.
export const OPENING_DURATION = 120;

// Scene 2 — the days-left hero reveal (4-10s target): light sweep +
// masked video number + bass-hit climax.
export const DAYS_HERO_DURATION = 180;

// Scene 3 — build-up montage (10-17s target): very short slices
// (~0.2-0.6s each = 6-18 frames at 30fps), speeding up as they go.
export const BUILDUP_SLICE_DURATIONS = [
  18, 16, 14, 12, 10, 16, 14, 12, 10, 8, 16, 12, 10, 18, 14,
];
export const BUILDUP_DURATION = BUILDUP_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

// Scene 4 — BNR reveal (17-21s target): a brief cinematic pause on the
// event, then each word appears on its own beat.
export const REVEAL_PAUSE_DURATION = 20;
export const TYPOGRAPHY_WORD_DURATION = 33;
export const TYPOGRAPHY_WORDS = ["BNR", "SOFIA", "SATURDAY"] as const;

// Scene 5 — final card (21-25s target): the countdown returns, then the
// ticket info.
export const FINAL_DAYS_CARD_DURATION = 50;
export const FINAL_TITLE_DURATION = 90;

// Total item count in the top-level TransitionSeries: opening(1) +
// daysHero(1) + buildup(1) + revealPause(1) + typography(3) +
// finalDaysCard(1) + finalTitle(1).
const TOTAL_ITEM_COUNT = 1 + 1 + 1 + 1 + TYPOGRAPHY_WORDS.length + 1 + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  OPENING_DURATION +
  DAYS_HERO_DURATION +
  BUILDUP_DURATION +
  REVEAL_PAUSE_DURATION +
  TYPOGRAPHY_WORDS.length * TYPOGRAPHY_WORD_DURATION +
  FINAL_DAYS_CARD_DURATION +
  FINAL_TITLE_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
