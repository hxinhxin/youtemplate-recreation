import { MIXED_CLIPS } from "./venues";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Title card: "ЕДНА ВЕЧЕР" / "3 КЛУБА" — once, for the whole night, not
// per venue.
export const TITLE_DURATION = 85;

// Outro: every venue's logo together, tagline repeated small beneath —
// this is now the only place a logo appears, at the very end.
export const OUTRO_DURATION = 60;

// Total TransitionSeries item count: title(1) + one item per mixed clip
// + outro(1). Computed from MIXED_CLIPS so adding a clip to venues.ts
// (to an existing venue or a new one) automatically extends the
// timeline correctly.
const TOTAL_ITEM_COUNT = 1 + MIXED_CLIPS.length + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;

const clipsDurationsSum = MIXED_CLIPS.reduce((sum, c) => sum + c.durationInFrames, 0);
const ALL_DURATIONS_SUM = TITLE_DURATION + clipsDurationsSum + OUTRO_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
