import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Same self-hosting rationale as bnr-trailer/theme.ts and
// cosmo-trailer/theme.ts — the render sandbox can't fetch
// fonts.gstatic.com live, so both faces load from public/fonts/.
const ANTON = "Anton";
loadFont({
  family: ANTON,
  url: staticFile("fonts/Anton-Regular.woff2"),
  weight: "400",
});

const OSWALD = "Oswald";
loadFont({
  family: OSWALD,
  url: staticFile("fonts/Oswald-Bold-Cyrillic.woff2"),
  weight: "700",
});

// This trailer's own typography stays white (reads cleanly over dark
// club footage). The Plovdiv Event Center wordmark itself keeps its
// real brand colors (black + red play icon) — see PLOVDIV_LOGO_GLOW in
// PlovdivTrailer.tsx for how it stays legible over dark video without
// recoloring it.
export const theme = {
  background: "#030303",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  headlineFont: `'${ANTON}', '${OSWALD}', sans-serif`,
  bodyFont: `'${ANTON}', '${OSWALD}', sans-serif`,
};
