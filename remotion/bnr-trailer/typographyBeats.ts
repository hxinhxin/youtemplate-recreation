export type TextVariant = "slam" | "slideLeft" | "dropTop" | "scaleRotate";

export type TypographyBeat = {
  word: string;
  duration: number;
  variant: TextVariant;
  voiceover?: string; // filename under public/audio/
};

// Each word gets its own entrance style instead of a single repeated
// animation. SOFIA and JOY STATION get a synthesized voiceover (espeak-ng
// placeholder — swap public/audio/vo-*.wav for a real recorded VO when
// available; durations here are sized to fit each clip's own length).
export const TYPOGRAPHY_BEATS: TypographyBeat[] = [
  { word: "BNR", duration: 28, variant: "slam" },
  { word: "SOFIA", duration: 36, variant: "slideLeft", voiceover: "vo-sofia.wav" },
  { word: "JOY STATION", duration: 48, variant: "dropTop", voiceover: "vo-joystation.wav" },
  { word: "SATURDAY", duration: 28, variant: "scaleRotate" },
];
