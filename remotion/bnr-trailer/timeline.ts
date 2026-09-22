import {
  BUILDUP_DURATION,
  CONFETTI_FEATURE_DURATION,
  DAYS_HERO_DURATION,
  DRONE_OPEN_DURATION,
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

// JoyStationReveal (the dedicated "JOY STATION / SOFIA" venue scene)
// moved up to be the second scene, right after the drone open and before
// the first "DAYS LEFT" countdown — establish where before the countdown
// urgency. DaysHero (the "3 DAYS LEFT" countdown reveal) follows it.
// Reveal-pause + typography beats (now just "Bandata na Ruba" / "ТАЗИ
// СЪБОТА" — venue/city dropped from here since JoyStationReveal already
// covers them) still sit right after the buildup montage so the event's
// name/date show up early too, not just the venue.
const itemDurations = [
  DRONE_OPEN_DURATION,
  JOY_STATION_DURATION,
  DAYS_HERO_DURATION,
  OPENING_DURATION,
  BUILDUP_DURATION,
  REVEAL_PAUSE_DURATION,
  ...TYPOGRAPHY_BEATS.map((b) => b.duration),
  SPIDERMAN_FEATURE_DURATION,
  CONFETTI_FEATURE_DURATION,
  FINAL_TITLE_DURATION,
];

const timeline = buildTimeline(itemDurations);

export const droneOpenTimeline = timeline[0];
export const joyStationTimeline = timeline[1];
export const daysHeroTimeline = timeline[2];
export const openingTimeline = timeline[3];
export const buildupTimeline = timeline[4];
export const revealPauseTimeline = timeline[5];
export const typographyTimelines = timeline.slice(6, 6 + TYPOGRAPHY_BEATS.length);
export const spidermanFeatureTimeline = timeline[6 + TYPOGRAPHY_BEATS.length];
export const confettiFeatureTimeline = timeline[7 + TYPOGRAPHY_BEATS.length];
export const finalTitleTimeline = timeline[8 + TYPOGRAPHY_BEATS.length];
