// Indices into BNR_CLIPS (bnr-trailer/clips.ts — the shared clip list plus
// any clips sent specifically for this trailer), ranked by crowd energy
// from a visual audit of every clip in the pool. Shared CLIPS has 10
// entries (indices 0-9); bnr-clip-01 is appended after it, so it lands
// at index 10.
//   clip-04, clip-06 & bnr-clip-01 — top tier: dense hands-up crowd,
//     laser/light beams, phone lights, performer directly engaging the
//     crowd. bnr-clip-01 also shows the actual "БАНДАТА НА РЪБА" branded
//     stage backdrop — strong for brand visibility too.
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
//
// clip-09 (index 7) was pulled from the ranking entirely — a specific shot
// from it was flagged and needed to come out of the trailer everywhere,
// not just one scene.
//
// bnr-clip-02 & bnr-clip-03 (indices 11/12) aren't in this ranking either —
// they get their own dedicated full-bleed scenes (SpidermanFeature.tsx /
// ConfettiFeature.tsx) right after the buildup montage instead, so they
// hold on screen well over a second rather than a quick-cut flash.
export const ENERGY_ORDER = [3, 5, 10, 6, 9, 4, 8, 2, 1, 0];

// clip-04 — the single most energetic clip, used for the hero countdown
// number and the final countdown card.
export const HERO_CLIP_INDEX = 3;

// clip-06 — strong wide stage/crowd shot, used as the venue reveal backdrop.
export const VENUE_CLIP_INDEX = 5;

// clip-01 — static DJ-gear shot, good only for a brief cutaway, never a
// hero or crowd moment.
export const DJ_CUTAWAY_INDEX = 0;
