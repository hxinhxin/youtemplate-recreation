import { staticFile } from "remotion";

export type VenueClip = {
  src: string;
  startFrom: number;
  durationInFrames: number;
};

export type Venue = {
  key: string;
  logoSrc: string;
  // Width the logo renders at in the chapter-bump card. The two source
  // logos are very different aspect ratios (COSMO is a short wide
  // wordmark, Plovdiv is a tall square lockup), so each venue picks its
  // own display width rather than sharing one fixed size.
  logoWidth: number;
  clips: VenueClip[];
};

// Chapter 1 — COSMO. Same three highlight moments used in
// cosmo-trailer/clips.ts (two different COSMO clips for variety, plus
// the teal-lit room), just trimmed shorter for this tighter combined cut.
export const COSMO: Venue = {
  key: "cosmo",
  logoSrc: staticFile("images/cosmo-logo.png"),
  logoWidth: 360,
  clips: [
    { src: staticFile("videos/cosmo-clip-01.mov"), startFrom: 90, durationInFrames: 66 },
    { src: staticFile("videos/cosmo-clip-02.mov"), startFrom: 15, durationInFrames: 55 },
    { src: staticFile("videos/cosmo-clip-04.mov"), startFrom: 210, durationInFrames: 55 },
  ],
};

// Chapter 2 — Plovdiv Event Center. Three highlight moments from the
// five supplied clips, same startFrom picks as plovdiv-trailer/clips.ts.
export const PLOVDIV: Venue = {
  key: "plovdiv",
  logoSrc: staticFile("images/plovdiv-logo.png"),
  logoWidth: 260,
  clips: [
    { src: staticFile("videos/plovdiv-clip-02.mov"), startFrom: 30, durationInFrames: 66 },
    { src: staticFile("videos/plovdiv-clip-01.mov"), startFrom: 200, durationInFrames: 55 },
    { src: staticFile("videos/plovdiv-clip-04.mov"), startFrom: 60, durationInFrames: 55 },
  ],
};

// Chapter 3 is pending — slot the next venue's clips + logo in here
// (same shape as COSMO/PLOVDIV above) once they're sent, and add it to
// the VENUES array below.
export const VENUES: Venue[] = [COSMO, PLOVDIV];
