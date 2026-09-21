import { Composition } from "remotion";
import { HelloWorld } from "./HelloWorld";
import { ConcertPromo } from "./concert-promo/ConcertPromo";
import { FPS, HEIGHT, TOTAL_DURATION, WIDTH } from "./concert-promo/durations";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ConcertPromo"
        component={ConcertPromo}
        durationInFrames={TOTAL_DURATION}
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
