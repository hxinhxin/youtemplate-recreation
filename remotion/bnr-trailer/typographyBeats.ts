import { ENERGY_ORDER } from "./energyOrder";

export type TextVariant = "slam" | "slideLeft" | "dropTop" | "scaleRotate";

export type TypographyBeat = {
  word: string;
  duration: number;
  variant: TextVariant;
  clipIndex: number; // index into the shared CLIPS array for the background footage
  logo?: boolean; // show the event logo behind the word
};

// One consistent "slam" entrance for all 4 words. Each beat carries its own
// background clip (top of ENERGY_ORDER, so the most energetic footage)
// so the typography never sits over a plain black screen — the footage
// keeps moving underneath/around the text.
export const TYPOGRAPHY_BEATS: TypographyBeat[] = [
  { word: "Bandata na Ruba", duration: 28, variant: "slam", clipIndex: ENERGY_ORDER[0], logo: true },
  { word: "СОФИЯ", duration: 28, variant: "slam", clipIndex: ENERGY_ORDER[1] },
  { word: "JOY STATION", duration: 28, variant: "slam", clipIndex: ENERGY_ORDER[2] },
  { word: "СЪБОТА", duration: 28, variant: "slam", clipIndex: ENERGY_ORDER[3] },
];
