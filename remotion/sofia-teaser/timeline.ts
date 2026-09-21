import { CLIPS } from "../concert-promo/clips";
import { COUNTDOWN_DURATION, INTRO_DURATION, OUTRO_DURATION, TRANSITION_DURATION } from "./durations";

export type TimelineEntry = { start: number; duration: number };

const buildTimeline = (durations: number[]): TimelineEntry[] => {
  let cursor = 0;
  return durations.map((duration, i) => {
    const start = i === 0 ? 0 : cursor - TRANSITION_DURATION;
    cursor = start + duration;
    return { start, duration };
  });
};

const itemDurations = [
  COUNTDOWN_DURATION,
  INTRO_DURATION,
  ...CLIPS.map((clip) => clip.durationInFrames),
  OUTRO_DURATION,
];

const timeline = buildTimeline(itemDurations);

export const countdownTimeline = timeline[0];
export const introTimeline = timeline[1];
export const clipTimelines = timeline.slice(2, 2 + CLIPS.length);
export const outroTimeline = timeline[timeline.length - 1];
