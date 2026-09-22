import {
  BUILDUP_DURATION,
  DAYS_HERO_DURATION,
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
  JOY_STATION_DURATION,
  OPENING_DURATION,
  REVEAL_PAUSE_DURATION,
  TRANSITION_DURATION,
} from "./durations";
import { TYPOGRAPHY_BEATS } from "./typographyBeats";

export type TimelineEntry = { start: number; duration: number };

// Mirrors TransitionSeries' layout for a uniform {sequence, transition,
// sequence, transition, ...} series: each item after the first starts
// TRANSITION_DURATION frames before the previous one ends. Used to place
// standalone <Audio>/<Sequence> cues at the right global frame.
const buildTimeline = (durations: number[]): TimelineEntry[] => {
  let cursor = 0;
  return durations.map((duration, i) => {
    const start = i === 0 ? 0 : cursor - TRANSITION_DURATION;
    cursor = start + duration;
    return { start, duration };
  });
};

const itemDurations = [
  OPENING_DURATION,
  DAYS_HERO_DURATION,
  BUILDUP_DURATION,
  JOY_STATION_DURATION,
  REVEAL_PAUSE_DURATION,
  ...TYPOGRAPHY_BEATS.map((b) => b.duration),
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
];

const timeline = buildTimeline(itemDurations);

export const openingTimeline = timeline[0];
export const daysHeroTimeline = timeline[1];
export const buildupTimeline = timeline[2];
export const joyStationTimeline = timeline[3];
export const revealPauseTimeline = timeline[4];
export const typographyTimelines = timeline.slice(5, 5 + TYPOGRAPHY_BEATS.length);
export const finalDaysCardTimeline = timeline[5 + TYPOGRAPHY_BEATS.length];
export const finalTitleTimeline = timeline[6 + TYPOGRAPHY_BEATS.length];
