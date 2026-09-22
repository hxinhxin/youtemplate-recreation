import { CLIPS } from "../concert-promo/clips";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Scene 1 — intro montage (0-5s target): short slices that shrink as they
// go, building speed. Rendered as one custom component (hard cuts + flash
// internally), so it counts as a single TransitionSeries item. No separate
// tournament footage exists, so this runs on the concert clips.
export const OPENING_SLICE_DURATIONS = [30, 25, 22, 19, 17, 15, 13, 9];
export const OPENING_DURATION = OPENING_SLICE_DURATIONS.reduce((a, b) => a + b, 0);

// Scene 2 — countdown 3 -> 2 -> 1 (5-9s target), each faster than the last.
// The break-apart/zoom-through reveal (Scene 3) happens inside the last
// frames of "1".
export const COUNTDOWN_DURATIONS = [45, 35, 28];
export const BREAK_APART_FRAMES = 14;

// Scene 4 — concert reveal (10-17s target): clips only, no text.
export const REVEAL_CLIP_DURATION = 35;

// Scene 5 — event typography (17-21s target): BNR / SOFIA / SATURDAY,
// each its own beat, no footage interleaved.
export const TYPOGRAPHY_WORD_DURATION = 40;
export const TYPOGRAPHY_WORDS = ["BNR", "SOFIA", "SATURDAY"] as const;

// Scene 6 — final card (21-25s target).
export const FINAL_TITLE_DURATION = 120;

// Total item count in the top-level TransitionSeries: opening(1) +
// countdown(3) + reveal(CLIPS.length) + typography(3) + final(1).
const TOTAL_ITEM_COUNT =
  1 + COUNTDOWN_DURATIONS.length + CLIPS.length + TYPOGRAPHY_WORDS.length + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  OPENING_DURATION +
  COUNTDOWN_DURATIONS.reduce((a, b) => a + b, 0) +
  CLIPS.length * REVEAL_CLIP_DURATION +
  TYPOGRAPHY_WORDS.length * TYPOGRAPHY_WORD_DURATION +
  FINAL_TITLE_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
