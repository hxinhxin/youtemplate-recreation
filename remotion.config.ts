import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");

// This sandbox blocks downloading Remotion's own headless Chrome binary,
// so point at the Playwright Chromium that is already preinstalled here.
if (process.env.REMOTION_BROWSER_EXECUTABLE) {
  Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
}
