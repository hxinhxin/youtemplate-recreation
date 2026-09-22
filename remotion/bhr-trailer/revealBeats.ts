import { CLIPS } from "../concert-promo/clips";
import { REVEAL_CLIP_DURATION, TEXT_BEAT_DURATION } from "./durations";

export type RevealBeat =
  | { type: "clip"; duration: number; clipIndex: number }
  | { type: "text"; duration: number; word: "BHR" | "SOFIA" | "SATURDAY" };

// clip, clip, TEXT, clip, clip, TEXT, clip, clip, TEXT, clip
// (7 clips + 3 text beats, in a single canonical order shared by
// durations.ts's math and the actual composition content.)
const words: Array<"BHR" | "SOFIA" | "SATURDAY"> = ["BHR", "SOFIA", "SATURDAY"];

export const REVEAL_BEATS: RevealBeat[] = (() => {
  const beats: RevealBeat[] = [];
  let clipIndex = 0;
  let wordIndex = 0;
  const total = CLIPS.length + words.length;
  for (let i = 0; i < total; i++) {
    const isText = (i + 1) % 3 === 0 && i < total - 1;
    if (isText) {
      beats.push({ type: "text", duration: TEXT_BEAT_DURATION, word: words[wordIndex] });
      wordIndex += 1;
    } else {
      beats.push({ type: "clip", duration: REVEAL_CLIP_DURATION, clipIndex });
      clipIndex += 1;
    }
  }
  return beats;
})();
