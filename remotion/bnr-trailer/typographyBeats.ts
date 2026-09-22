export type TextVariant = "slam" | "slideLeft" | "dropTop" | "scaleRotate";

export type TypographyBeat = {
  word: string;
  duration: number;
  variant: TextVariant;
  voiceover?: string; // filename under public/audio/
};

// One consistent "slam" entrance for all 4 words (the per-word variants
// were rejected). Voiceover uses Piper (neural, offline) instead of the
// earlier espeak-ng pass — both clips are short enough (<1s) to fit
// inside the original 28-frame beat without stretching it.
export const TYPOGRAPHY_BEATS: TypographyBeat[] = [
  { word: "BNR", duration: 28, variant: "slam" },
  { word: "SOFIA", duration: 28, variant: "slam", voiceover: "vo-sofia.wav" },
  { word: "JOY STATION", duration: 28, variant: "slam", voiceover: "vo-joystation.wav" },
  { word: "SATURDAY", duration: 28, variant: "slam" },
];
