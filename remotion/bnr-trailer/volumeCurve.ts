// Builds a safe, strictly-increasing breakpoint curve for interpolate().
// Scenes in the TransitionSeries overlap by TRANSITION_DURATION, so
// hand-computed "sceneStart + sceneDuration" boundaries can land on or
// after the next scene's start — this sorts the requested points and
// nudges any collisions forward by 1 frame so interpolate() never sees a
// non-increasing input array.
export const buildVolumeCurve = (points: Array<[number, number]>) => {
  const sorted = [...points].sort((a, b) => a[0] - b[0]);
  const frames: number[] = [];
  const values: number[] = [];
  let lastFrame = -Infinity;
  for (const [frame, value] of sorted) {
    const safeFrame = frame <= lastFrame ? lastFrame + 1 : frame;
    frames.push(safeFrame);
    values.push(value);
    lastFrame = safeFrame;
  }
  return { frames, values };
};
