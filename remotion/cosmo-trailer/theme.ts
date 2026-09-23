import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Same self-hosting rationale as bnr-trailer/theme.ts — the render
// sandbox's headless Chrome can't fetch fonts.gstatic.com live, so both
// faces are downloaded once to public/fonts/ and loaded from there.
const ANTON = "Anton";
loadFont({
  family: ANTON,
  url: staticFile("fonts/Anton-Regular.woff2"),
  weight: "400",
});

// Anton has no Cyrillic glyphs — needed for "ЕДНА ВЕЧЕР" / "3 КЛУБА".
// Oswald Bold covers those characters as a per-character fallback.
const OSWALD = "Oswald";
loadFont({
  family: OSWALD,
  url: staticFile("fonts/Oswald-Bold-Cyrillic.woff2"),
  weight: "700",
});

// Neutral black/white palette — the COSMO wordmark itself is plain white,
// so the trailer's own typography stays white too rather than introducing
// an unrelated accent color.
export const theme = {
  background: "#030303",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  headlineFont: `'${ANTON}', '${OSWALD}', sans-serif`,
  bodyFont: `'${ANTON}', '${OSWALD}', sans-serif`,
};
