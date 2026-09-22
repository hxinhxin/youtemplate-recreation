import { staticFile } from "remotion";
import { CLIPS, type ClipConfig } from "../concert-promo/clips";

// The BNR trailer gets everything in the shared clip list, plus clips sent
// specifically "for the trailer" — they don't appear in ConcertPromo or
// SofiaTeaser. The shared CLIPS array has 10 entries (indices 0-9), so:
//   Index 10 = bnr-clip-01 — branded stage shot: "БАНДАТА НА РЪБА"
//     backdrop, performer engaging the crowd, hands up, blue stage beams.
//   Index 11 = bnr-clip-02 — costumed (Spider-Man) performer crowd-surfing,
//     stable well-lit wide shot, hands up all around — top-tier energy.
//   Index 12 = bnr-clip-03 — chaotic fisheye handheld from inside the
//     crowd, CO2/confetti blast, same performer — very high energy but
//     heavy spin/motion, best used for quick cuts, not a long hold.
export const BNR_CLIPS: ClipConfig[] = [
  ...CLIPS,
  { src: staticFile("videos/bnr-clip-01.mov"), durationInFrames: 75 },
  { src: staticFile("videos/bnr-clip-02.mov"), durationInFrames: 75 },
  { src: staticFile("videos/bnr-clip-03.mov"), durationInFrames: 75 },
];
