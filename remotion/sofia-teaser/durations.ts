import { CLIPS } from "../concert-promo/clips";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const COUNTDOWN_DURATION = 60; // 2s ticking countdown graphic
export const INTRO_DURATION = 45; // 1.5s act/venue reveal
export const OUTRO_DURATION = 75; // 2.5s CTA card
export const TRANSITION_DURATION = 15; // 0.5s

const items = [COUNTDOWN_DURATION, INTRO_DURATION, ...CLIPS.map((c) => c.durationInFrames), OUTRO_DURATION];
const numTransitions = items.length - 1;
const itemsTotal = items.reduce((sum, d) => sum + d, 0);

export const TOTAL_DURATION = itemsTotal - numTransitions * TRANSITION_DURATION;
