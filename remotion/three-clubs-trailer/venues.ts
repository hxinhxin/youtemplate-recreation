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
    { src: staticFile("videos/cosmo-clip-01.mov"), startFrom: 90, durationInFrames: 36 },
    { src: staticFile("videos/cosmo-clip-02.mov"), startFrom: 15, durationInFrames: 30 },
    { src: staticFile("videos/cosmo-clip-04.mov"), startFrom: 210, durationInFrames: 30 },
    { src: staticFile("videos/cosmo-clip-05.mov"), startFrom: 70, durationInFrames: 33 },
  ],
};

// Chapter 2 — Plovdiv Event Center. Three highlight moments from the
// five supplied clips, same startFrom picks as plovdiv-trailer/clips.ts.
export const PLOVDIV: Venue = {
  key: "plovdiv",
  logoSrc: staticFile("images/plovdiv-logo.png"),
  logoWidth: 260,
  clips: [
    { src: staticFile("videos/plovdiv-clip-02.mov"), startFrom: 30, durationInFrames: 36 },
    { src: staticFile("videos/plovdiv-clip-01.mov"), startFrom: 200, durationInFrames: 30 },
    { src: staticFile("videos/plovdiv-clip-04.mov"), startFrom: 60, durationInFrames: 30 },
    { src: staticFile("videos/plovdiv-clip-06.mov"), startFrom: 100, durationInFrames: 30 },
    { src: staticFile("videos/plovdiv-clip-07.mov"), startFrom: 10, durationInFrames: 33 },
    { src: staticFile("videos/plovdiv-clip-08.mov"), startFrom: 90, durationInFrames: 30 },
    { src: staticFile("videos/plovdiv-clip-09.mov"), startFrom: 120, durationInFrames: 30 },
    { src: staticFile("videos/plovdiv-clip-10.mov"), startFrom: 20, durationInFrames: 30 },
  ],
};

// Chapter 3 — BUSHIDO. Big-room DJ set: dense crowd, blue/purple beams,
// DJ booth with ring light fixtures visible in the second clip. Only
// two source clips were sent (vs. three for the other venues), so this
// chapter runs two highlight cuts instead of three.
export const BUSHIDO: Venue = {
  key: "bushido",
  logoSrc: staticFile("images/bushido-logo.png"),
  logoWidth: 420,
  clips: [
    { src: staticFile("videos/bushido-clip-01.mov"), startFrom: 120, durationInFrames: 36 },
    { src: staticFile("videos/bushido-clip-02.mov"), startFrom: 200, durationInFrames: 30 },
  ],
};

export const VENUES: Venue[] = [COSMO, PLOVDIV, BUSHIDO];

// Logos moved to the shared outro (see OutroCard), so the body of the
// video no longer needs to play each venue as its own contiguous block —
// clips are interleaved across venues instead, so the cut bounces
// between COSMO / Plovdiv / BUSHIDO rather than grouping by venue. Each
// venue's clips are spread evenly across the full timeline in proportion
// to how many it has (rather than a naive round-robin), so a venue with
// more clips than the others doesn't end up clustered at the end. Adding
// a clip to any venue above, or a whole new venue, folds into the mix
// automatically.
export const MIXED_CLIPS: (VenueClip & { venueKey: string })[] = (() => {
  const totalClips = VENUES.reduce((sum, v) => sum + v.clips.length, 0);
  const withSortKey = VENUES.flatMap((venue) =>
    venue.clips.map((clip, i) => ({
      ...clip,
      venueKey: venue.key,
      sortKey: (i + 0.5) * (totalClips / venue.clips.length),
    })),
  );
  withSortKey.sort((a, b) => a.sortKey - b.sortKey);
  return withSortKey.map(({ sortKey: _sortKey, ...clip }) => clip);
})();
