export type TextVariant = "slam" | "slideLeft" | "dropTop" | "scaleRotate";

export type TypographyBeat = {
  word: string;
  duration: number;
  variant: TextVariant;
  clipIndex: number; // index into the shared CLIPS array for the background footage
  logo?: boolean; // show the event logo behind the word
};

// One consistent "slam" entrance. Each beat carries its own background
// clip so the typography never sits over a plain black screen. Dropped
// the СОФИЯ and JOY STATION beats — the dedicated JoyStationReveal scene
// already covers both, so repeating them here was redundant text.
// clipIndex picked to NOT duplicate footage already used elsewhere as a
// single dedicated clip (DaysHero/reveal-pause/FinalTitle use clip-04,
// JoyStationReveal uses clip-06) — index 10 (bnr-clip-01) even shows the
// actual "БАНДАТА НА РЪБА" branded backdrop, a natural fit for that beat.
// Duration trimmed 28 -> 24 per beat to shorten the overall trailer —
// the "slam" entrance settles by frame 14, still leaving a solid hold.
export const TYPOGRAPHY_BEATS: TypographyBeat[] = [
  { word: "Бандата на ръба", duration: 24, variant: "slam", clipIndex: 10, logo: true },
  { word: "ТАЗИ СЪБОТА", duration: 24, variant: "slam", clipIndex: 4 },
];
