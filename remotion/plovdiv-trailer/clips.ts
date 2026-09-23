import { staticFile } from "remotion";

export type PlovdivClip = {
  src: string;
  startFrom: number;
};

// startFrom values picked by scanning contact sheets of each source clip
// for the steadiest, most energetic moment (performer close-up, crowd
// hands-up, clearest "plovdiv event center" screen text) rather than
// just starting at frame 0.
export const PLOVDIV_CLIP_1: PlovdivClip = { src: staticFile("videos/plovdiv-clip-01.mov"), startFrom: 200 };
// Clearest "plovdiv event center" branding on the stage screen — also
// used (blurred, muted) as the Title/Outro card background.
export const PLOVDIV_CLIP_2: PlovdivClip = { src: staticFile("videos/plovdiv-clip-02.mov"), startFrom: 30 };
// Short source clip (~5s) — pyro/sparkler burst, two performers.
export const PLOVDIV_CLIP_3: PlovdivClip = { src: staticFile("videos/plovdiv-clip-03.mov"), startFrom: 15 };
export const PLOVDIV_CLIP_4: PlovdivClip = { src: staticFile("videos/plovdiv-clip-04.mov"), startFrom: 60 };
export const PLOVDIV_CLIP_5: PlovdivClip = { src: staticFile("videos/plovdiv-clip-05.mov"), startFrom: 45 };
