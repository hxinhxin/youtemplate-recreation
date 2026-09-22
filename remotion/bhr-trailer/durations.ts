import { CLIPS } from "../concert-promo/clips";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Opening montage: short slices that shrink as they go, building speed.
// Rendered as one custom component (hard cuts + flash internally), so it
// counts as a single TransitionSeries item.
export const OPENING_SLICE_DURATIONS = [16, 13, 11, 9, 8, 7, 6];
export const OPENING_DURATION = OPENING_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

// Countdown: 3 -> 2 -> 1, each faster than the last. The break-apart
// reveal happens inside the last few frames of "1".
export const COUNTDOWN_DURATIONS = [26, 20, 18];
export const BREAK_APART_FRAMES = 10;

// Concert reveal: clips + 3 text beats (BHR / SOFIA / SATURDAY), see
// revealBeats.ts for the actual interleaved order/content.
export const REVEAL_CLIP_DURATION = 40;
export const TEXT_BEAT_DURATION = 22;
export const REVEAL_TEXT_BEAT_COUNT = 3;
const REVEAL_TOTAL_DURATION_SUM =
  CLIPS.length * REVEAL_CLIP_DURATION + REVEAL_TEXT_BEAT_COUNT * TEXT_BEAT_DURATION;
const REVEAL_ITEM_COUNT = CLIPS.length + REVEAL_TEXT_BEAT_COUNT;

// Final quick-cut burst before the title card — same custom-component
// treatment as the opening montage.
export const FINAL_BURST_SLICE_DURATIONS = [7, 6, 5, 5];
export const FINAL_BURST_DURATION = FINAL_BURST_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

export const FINAL_TITLE_DURATION = 90;

// Total item count in the top-level TransitionSeries: opening(1) +
// countdown(3) + reveal(10) + burst(1) + title(1).
const TOTAL_ITEM_COUNT = 1 + COUNTDOWN_DURATIONS.length + REVEAL_ITEM_COUNT + 1 + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  OPENING_DURATION +
  COUNTDOWN_DURATIONS.reduce((a, b) => a + b, 0) +
  REVEAL_TOTAL_DURATION_SUM +
  FINAL_BURST_DURATION +
  FINAL_TITLE_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
