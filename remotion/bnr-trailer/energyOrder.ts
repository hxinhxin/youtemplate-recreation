// Indices into the shared CLIPS array (concert-promo/clips.ts), ranked by
// crowd energy from a visual audit of all 7 clips:
//   clip-04 & clip-06 — strongest: hands up, laser beams, phone lights,
//     performer directly engaging the crowd
//   clip-08           — costumed performer (Spider-Man) dancing energetically,
//     crowd close in filming with phones — high energy, distinct character
//   clip-05           — dense packed crowd, good movement
//   clip-03           — performer on mic, some hands/phone lights visible
//   clip-02           — packed crowd but calmer, mostly wide/venue shots
//   clip-01           — static DJ-gear close-up, no crowd at all
export const ENERGY_ORDER = [3, 5, 6, 4, 2, 1, 0];

// clip-04 — the single most energetic clip, used for the hero countdown
// number and the final countdown card.
export const HERO_CLIP_INDEX = 3;

// clip-06 — strong wide stage/crowd shot, used as the venue reveal backdrop.
export const VENUE_CLIP_INDEX = 5;

// clip-01 — static DJ-gear shot, good only for a brief cutaway, never a
// hero or crowd moment.
export const DJ_CUTAWAY_INDEX = 0;
