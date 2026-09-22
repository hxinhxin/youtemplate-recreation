import { Audio, staticFile } from "remotion";

// A one-shot riser or impact sound effect (synthesized, see
// public/audio/riser.wav and impact.wav) played at full volume for its
// natural length.
export const AudioHit: React.FC<{ kind: "riser" | "impact"; volume?: number }> = ({
  kind,
  volume = 1,
}) => <Audio src={staticFile(`audio/${kind}.wav`)} volume={volume} />;
