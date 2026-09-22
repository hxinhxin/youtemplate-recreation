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
// Trimmed to 75 frames (2.5s) each for a snappier, more dynamic cut.
export const CLIPS: ClipConfig[] = [
  { src: staticFile("videos/clip-07.mp4"), durationInFrames: 75 },
  { src: staticFile("videos/clip-01.mp4"), durationInFrames: 75 },
  { src: staticFile("videos/clip-02.mov"), durationInFrames: 75 },
  { src: staticFile("videos/clip-03.mov"), durationInFrames: 75 },
  { src: staticFile("videos/clip-04.mov"), durationInFrames: 75 },
  { src: staticFile("videos/clip-05.mov"), durationInFrames: 75 },
  { src: staticFile("videos/clip-06.mov"), durationInFrames: 75 },
];
