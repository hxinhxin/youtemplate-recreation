export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Title card: wordmark + tagline over a muted, blurred loop of the venue.
export const TITLE_DURATION = 75;

// Five highlight scenes, one per source clip.
export const CLIP_1_DURATION = 90;
export const CLIP_2_DURATION = 75;
export const CLIP_3_DURATION = 60;
export const CLIP_4_DURATION = 75;
export const CLIP_5_DURATION = 60;

// Outro: wordmark large and centered, tagline repeated small beneath.
export const OUTRO_DURATION = 60;

const TOTAL_ITEM_COUNT = 7;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  TITLE_DURATION +
  CLIP_1_DURATION +
  CLIP_2_DURATION +
  CLIP_3_DURATION +
  CLIP_4_DURATION +
  CLIP_5_DURATION +
  OUTRO_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
