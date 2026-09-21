import { staticFile } from "remotion";

export type ClipConfig = {
  /** Path relative to the public/videos folder */
  src: string;
  /** How long this clip stays on screen, in frames (at 30fps) */
  durationInFrames: number;
  /** Frame to start playback from within the source video */
  startFrom?: number;
};

// Add one entry per clip you send over, in the order they should appear.
export const CLIPS: ClipConfig[] = [
  { src: staticFile("videos/clip-01.mp4"), durationInFrames: 90 },
];
