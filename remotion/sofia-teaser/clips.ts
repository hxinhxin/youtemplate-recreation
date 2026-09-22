import { staticFile } from "remotion";
import { CLIPS, type ClipConfig } from "../concert-promo/clips";

// The Sofia teaser gets everything in the shared clip list, plus one clip
// sent specifically for this video — it does not appear in ConcertPromo
// or BnrTrailer.
export const SOFIA_CLIPS: ClipConfig[] = [
  ...CLIPS,
  { src: staticFile("videos/sofia-clip-01.mov"), durationInFrames: 75 },
];
