import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { ConcertPromo } from "./concert-promo/ConcertPromo";
import { FPS, HEIGHT, TOTAL_DURATION, WIDTH } from "./concert-promo/durations";
import { SofiaTeaser } from "./sofia-teaser/SofiaTeaser";
import { TOTAL_DURATION as SOFIA_TOTAL_DURATION } from "./sofia-teaser/durations";
import { BhrTrailer } from "./bhr-trailer/BhrTrailer";
import {
  FPS as BHR_FPS,
  HEIGHT as BHR_HEIGHT,
  TOTAL_DURATION as BHR_TOTAL_DURATION,
  WIDTH as BHR_WIDTH,
} from "./bhr-trailer/durations";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BhrTrailer"
        component={BhrTrailer}
        durationInFrames={BHR_TOTAL_DURATION}
        fps={BHR_FPS}
        width={BHR_WIDTH}
        height={BHR_HEIGHT}
      />
      <Composition
        id="ConcertPromo"
        component={ConcertPromo}
        durationInFrames={TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="SofiaTeaser"
        component={SofiaTeaser}
        durationInFrames={SOFIA_TOTAL_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="HelloWorld"
        component={HelloWorld}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
