import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Self-hosted rather than @remotion/google-fonts' runtime fetch — the
// render sandbox's headless Chrome doesn't trust the outbound proxy's
// CA, so a live fetch to fonts.gstatic.com fails with
// ERR_CERT_AUTHORITY_INVALID. Downloaded once to public/fonts/.
const ANTON = "Anton";
loadFont({
  family: ANTON,
  url: staticFile("fonts/Anton-Regular.woff2"),
  weight: "400",
});

// Dedicated palette for this trailer — black/red/white per the brief.
// Separate from concert-promo/theme.ts (pink) so the other two videos
// keep their existing branding untouched. One typeface everywhere
// (Anton — a single ultra-bold display weight), used for both headline
// and body copy so every piece of text reads bold and consistent.
export const theme = {
  background: "#050505",
  red: "#e2102b",
  redDeep: "#7a0714",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  headlineFont: `'${ANTON}', sans-serif`,
  bodyFont: `'${ANTON}', sans-serif`,
};
