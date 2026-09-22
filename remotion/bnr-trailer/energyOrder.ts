// Indices into the shared CLIPS array (concert-promo/clips.ts), ranked by
// crowd energy from a visual audit of all 10 clips currently in the pool:
//   clip-04, clip-06 & clip-09 — top tier: dense hands-up crowd, laser/
//     light beams, phone lights, performer directly engaging the crowd
//   clip-08           — costumed performer (Spider-Man) dancing energetically,
//     crowd close in filming with phones — high energy, distinct character
//   clip-11           — wide shot of a massive crowd with sweeping light
//     beams, hands up in the distance — epic scale, but very short (~2.7s
//     source), so only used as a quick punch, never a long hold
//   clip-05           — dense packed crowd, good movement
//   clip-10           — performer engaging crowd, moderate energy, short
//     source (~4.3s)
//   clip-03           — performer on mic, some hands/phone lights visible
//   clip-02           — packed crowd but calmer, mostly wide/venue shots
//   clip-01           — static DJ-gear close-up, no crowd at all
export const ENERGY_ORDER = [3, 5, 7, 6, 9, 4, 8, 2, 1, 0];

// clip-04 — the single most energetic clip, used for the hero countdown
// number and the final countdown card.
export const HERO_CLIP_INDEX = 3;

// clip-06 — strong wide stage/crowd shot, used as the venue reveal backdrop.
export const VENUE_CLIP_INDEX = 5;

// clip-01 — static DJ-gear shot, good only for a brief cutaway, never a
// hero or crowd moment.
export const DJ_CUTAWAY_INDEX = 0;
