import { CLIPS } from "./clips";

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export const INTRO_DURATION = 45; // 1.5s
export const OUTRO_DURATION = 75; // 2.5s
export const TRANSITION_DURATION = 15; // 0.5s

const numTransitions = CLIPS.length + 1; // before first clip, between clips, before outro
const clipsTotal = CLIPS.reduce((sum, clip) => sum + clip.durationInFrames, 0);

export const TOTAL_DURATION =
  INTRO_DURATION + clipsTotal + OUTRO_DURATION - numTransitions * TRANSITION_DURATION;
