import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

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

export const theme = {
  background: "#030303",
  white: "#ffffff",
  textMuted: "rgba(255,255,255,0.7)",
  headlineFont: `'${ANTON}', '${OSWALD}', sans-serif`,
  bodyFont: `'${ANTON}', '${OSWALD}', sans-serif`,
};
