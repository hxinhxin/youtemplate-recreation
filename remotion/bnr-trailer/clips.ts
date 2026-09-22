import { staticFile } from "remotion";
import { CLIPS, type ClipConfig } from "../concert-promo/clips";

// The BNR trailer gets everything in the shared clip list, plus clips sent
// specifically "for the trailer" — they don't appear in ConcertPromo or
// SofiaTeaser. Index 11 = bnr-clip-01 (branded stage shot: "БАНДАТА НА
// РЪБА" backdrop, performer engaging the crowd, hands up, blue stage
// beams — strong footage, explicit brand visibility).
export const BNR_CLIPS: ClipConfig[] = [
  ...CLIPS,
  { src: staticFile("videos/bnr-clip-01.mov"), durationInFrames: 75 },
];
