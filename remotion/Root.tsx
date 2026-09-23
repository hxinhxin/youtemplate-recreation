import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { ConcertPromo } from "./concert-promo/ConcertPromo";
import { FPS, HEIGHT, TOTAL_DURATION, WIDTH } from "./concert-promo/durations";
import { SofiaTeaser } from "./sofia-teaser/SofiaTeaser";
import { TOTAL_DURATION as SOFIA_TOTAL_DURATION } from "./sofia-teaser/durations";
import { BnrTrailer } from "./bnr-trailer/BnrTrailer";
import {
  FPS as BNR_FPS,
  HEIGHT as BNR_HEIGHT,
  TOTAL_DURATION as BNR_TOTAL_DURATION,
  WIDTH as BNR_WIDTH,
} from "./bnr-trailer/durations";
import { CosmoTrailer } from "./cosmo-trailer/CosmoTrailer";
import {
  FPS as COSMO_FPS,
  HEIGHT as COSMO_HEIGHT,
  TOTAL_DURATION as COSMO_TOTAL_DURATION,
  WIDTH as COSMO_WIDTH,
} from "./cosmo-trailer/durations";
import { PlovdivTrailer } from "./plovdiv-trailer/PlovdivTrailer";
import {
  FPS as PLOVDIV_FPS,
  HEIGHT as PLOVDIV_HEIGHT,
  TOTAL_DURATION as PLOVDIV_TOTAL_DURATION,
  WIDTH as PLOVDIV_WIDTH,
} from "./plovdiv-trailer/durations";
import { ThreeClubsTrailer } from "./three-clubs-trailer/ThreeClubsTrailer";
import {
  FPS as THREE_CLUBS_FPS,
  HEIGHT as THREE_CLUBS_HEIGHT,
  TOTAL_DURATION as THREE_CLUBS_TOTAL_DURATION,
  WIDTH as THREE_CLUBS_WIDTH,
} from "./three-clubs-trailer/durations";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BnrTrailer"
        component={BnrTrailer}
        durationInFrames={BNR_TOTAL_DURATION}
        fps={BNR_FPS}
        width={BNR_WIDTH}
        height={BNR_HEIGHT}
      />
      <Composition
        id="CosmoTrailer"
        component={CosmoTrailer}
        durationInFrames={COSMO_TOTAL_DURATION}
        fps={COSMO_FPS}
        width={COSMO_WIDTH}
        height={COSMO_HEIGHT}
      />
      <Composition
        id="PlovdivTrailer"
        component={PlovdivTrailer}
        durationInFrames={PLOVDIV_TOTAL_DURATION}
        fps={PLOVDIV_FPS}
        width={PLOVDIV_WIDTH}
        height={PLOVDIV_HEIGHT}
      />
      <Composition
        id="ThreeClubsTrailer"
        component={ThreeClubsTrailer}
        durationInFrames={THREE_CLUBS_TOTAL_DURATION}
        fps={THREE_CLUBS_FPS}
        width={THREE_CLUBS_WIDTH}
        height={THREE_CLUBS_HEIGHT}
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
