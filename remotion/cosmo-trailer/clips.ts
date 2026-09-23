import { staticFile } from "remotion";

export type CosmoClip = {
  src: string;
  startFrom: number;
};

// cosmo-clip-01 & cosmo-clip-04 are both filmed at COSMO itself (the
// venue's own branded screen reads "COSMO" on stage) — used to open and
// then close the night. cosmo-clip-02 and cosmo-clip-03 are two other
// rooms with distinct lighting rigs (teal/cyan vs. white panel screens),
// standing in for the other two clubs in "3 КЛУБА".
//
// startFrom values were picked by scanning contact sheets of each source
// clip for the steadiest, most legible "COSMO" text / most energetic
// crowd moment rather than just starting at frame 0.
export const COSMO_CLIP_A: CosmoClip = { src: staticFile("videos/cosmo-clip-01.mov"), startFrom: 90 };
export const COSMO_CLIP_B: CosmoClip = { src: staticFile("videos/cosmo-clip-02.mov"), startFrom: 15 };
export const COSMO_CLIP_C: CosmoClip = { src: staticFile("videos/cosmo-clip-03.mov"), startFrom: 150 };
export const COSMO_CLIP_A2: CosmoClip = { src: staticFile("videos/cosmo-clip-04.mov"), startFrom: 210 };
