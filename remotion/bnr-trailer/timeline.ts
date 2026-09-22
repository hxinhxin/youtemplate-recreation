import {
  BUILDUP_DURATION,
  CONFETTI_FEATURE_DURATION,
  DAYS_HERO_DURATION,
  DRONE_OPEN_DURATION,
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
  JOY_STATION_DURATION,
  OPENING_DURATION,
  REVEAL_PAUSE_DURATION,
  SPIDERMAN_FEATURE_DURATION,
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

// Reveal-pause + typography beats (the "Bandata na Ruba / Sofia / Joy
// Station / Saturday" text reveal) moved earlier — right after the
// buildup montage — instead of after the feature clips and venue
// reveal, so the event's name/venue/date show up much sooner rather
// than being backloaded near the very end of the trailer.
const itemDurations = [
  DRONE_OPEN_DURATION,
  OPENING_DURATION,
  DAYS_HERO_DURATION,
  BUILDUP_DURATION,
  REVEAL_PAUSE_DURATION,
  ...TYPOGRAPHY_BEATS.map((b) => b.duration),
  SPIDERMAN_FEATURE_DURATION,
  CONFETTI_FEATURE_DURATION,
  JOY_STATION_DURATION,
  FINAL_DAYS_CARD_DURATION,
  FINAL_TITLE_DURATION,
];

const timeline = buildTimeline(itemDurations);

export const droneOpenTimeline = timeline[0];
export const openingTimeline = timeline[1];
export const daysHeroTimeline = timeline[2];
export const buildupTimeline = timeline[3];
export const revealPauseTimeline = timeline[4];
export const typographyTimelines = timeline.slice(5, 5 + TYPOGRAPHY_BEATS.length);
export const spidermanFeatureTimeline = timeline[5 + TYPOGRAPHY_BEATS.length];
export const confettiFeatureTimeline = timeline[6 + TYPOGRAPHY_BEATS.length];
export const joyStationTimeline = timeline[7 + TYPOGRAPHY_BEATS.length];
export const finalDaysCardTimeline = timeline[8 + TYPOGRAPHY_BEATS.length];
export const finalTitleTimeline = timeline[9 + TYPOGRAPHY_BEATS.length];
