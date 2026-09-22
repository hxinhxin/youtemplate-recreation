export type TextVariant = "slam" | "slideLeft" | "dropTop" | "scaleRotate";

export type TypographyBeat = {
  word: string;
  duration: number;
  variant: TextVariant;
  voiceover?: string; // filename under public/audio/
};

// Reverted: the per-word entrance variants and the espeak-ng voiceover
// were both rejected (robotic-sounding, no premium TTS available here) —
// back to one consistent "slam" style with no VO, at the original
// uniform duration.
export const TYPOGRAPHY_BEATS: TypographyBeat[] = [
  { word: "BNR", duration: 28, variant: "slam" },
  { word: "SOFIA", duration: 28, variant: "slam" },
  { word: "JOY STATION", duration: 28, variant: "slam" },
  { word: "SATURDAY", duration: 28, variant: "slam" },
];
