import { CLIPS } from "./clips";
import { INTRO_DURATION, OUTRO_DURATION, TRANSITION_DURATION } from "./durations";

export type TimelineEntry = { start: number; duration: number };

// Mirrors how @remotion/transitions/TransitionSeries lays out a uniform
// series of {sequence, transition, sequence, transition, ...}: each item
// after the first starts `TRANSITION_DURATION` frames before the previous
// one ends, since that's the crossfade overlap.
const buildTimeline = (durations: number[]): TimelineEntry[] => {
  let cursor = 0;
  return durations.map((duration, i) => {
    const start = i === 0 ? 0 : cursor - TRANSITION_DURATION;
    cursor = start + duration;
    return { start, duration };
  });
};

const itemDurations = [
  INTRO_DURATION,
  ...CLIPS.map((clip) => clip.durationInFrames),
  OUTRO_DURATION,
];

const timeline = buildTimeline(itemDurations);

export const introTimeline = timeline[0];
export const clipTimelines = timeline.slice(1, 1 + CLIPS.length);
export const outroTimeline = timeline[timeline.length - 1];
