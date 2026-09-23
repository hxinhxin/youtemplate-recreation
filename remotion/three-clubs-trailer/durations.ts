import { VENUES } from "./venues";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Title card: "ЕДНА ВЕЧЕР" / "3 КЛУБА" — once, for the whole night, not
// per venue.
export const TITLE_DURATION = 70;

// Chapter bump before each venue's clips — a quick logo-only beat that
// introduces "now at COSMO" / "now at Plovdiv Event Center" etc.
export const BUMP_DURATION = 22;

// Outro: every venue's logo together, tagline repeated small beneath.
export const OUTRO_DURATION = 60;

// Total TransitionSeries item count: title(1) + outro(1) + per venue
// (1 bump + N clips). Computed from VENUES so adding a third venue's
// clips to venues.ts automatically extends the timeline correctly.
const venueItemCount = VENUES.reduce((sum, v) => sum + 1 + v.clips.length, 0);
const TOTAL_ITEM_COUNT = 1 + venueItemCount + 1;
const numTransitions = TOTAL_ITEM_COUNT - 1;

const venueDurationsSum = VENUES.reduce(
  (sum, v) => sum + BUMP_DURATION + v.clips.reduce((s, c) => s + c.durationInFrames, 0),
  0,
);
const ALL_DURATIONS_SUM = TITLE_DURATION + venueDurationsSum + OUTRO_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
