import { concertInfo } from "./concertInfo";

// Easy to override without touching any other file: replace the body
// below with a fixed number if you want the same figure to appear
// regardless of render date, e.g.:
//   export const DAYS_LEFT = 7;
const target = new Date(concertInfo.targetDate).getTime();
const diffMs = Math.max(target - Date.now(), 0);
export const DAYS_LEFT = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
