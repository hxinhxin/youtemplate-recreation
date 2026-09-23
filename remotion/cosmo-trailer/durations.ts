export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const TRANSITION_DURATION = 8;

// Scene 0 — title card: "ЕДНА ВЕЧЕР" / "3 КЛУБА" slam in over a muted,
// blurred COSMO b-roll, with the COSMO wordmark settling in beneath as
// the brand stamp for the whole piece.
export const TITLE_DURATION = 75;

// Scene 1 — COSMO, the home venue: the clip with the clearest, steadiest
// "COSMO" text on the stage screen, held a beat longer than the other
// two clubs since it opens and (later) closes the night.
export const CLUB_A_DURATION = 90;

// Scene 2 — second club: teal/cyan lighting, DJ booth visible. Short
// source clip (~4.4s), so most of it is used.
export const CLUB_B_DURATION = 75;

// Scene 3 — third club: white panel screens, calmer lounge-then-hands-up
// crowd shot — a different visual mood from the other two so the "3
// clubs" read as genuinely different rooms, not the same footage reused.
export const CLUB_C_DURATION = 75;

// Scene 4 — back to COSMO for the night's finish, using the OTHER COSMO
// source clip so this isn't a repeat of scene 1's exact footage.
export const CLUB_A2_DURATION = 75;

// Scene 5 — outro: COSMO wordmark full-size, tagline repeated small
// beneath it, hard cut to black.
export const OUTRO_DURATION = 60;

const TOTAL_ITEM_COUNT = 6;
const numTransitions = TOTAL_ITEM_COUNT - 1;
const ALL_DURATIONS_SUM =
  TITLE_DURATION + CLUB_A_DURATION + CLUB_B_DURATION + CLUB_C_DURATION + CLUB_A2_DURATION + OUTRO_DURATION;

export const TOTAL_DURATION = ALL_DURATIONS_SUM - numTransitions * TRANSITION_DURATION;
