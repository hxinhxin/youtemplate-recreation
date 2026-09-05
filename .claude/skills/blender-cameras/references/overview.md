# Camera reference

## Framing maths

With a sensor width `w` and focal length `f`, horizontal field of view is `2·atan(w / 2f)`. To make
a subject of extent `e` fill the frame with margin `m`:

```
distance = (e · m) / (2 · tan(fov / 2))
```

Blender's default sensor is 36 mm. Change `sensor_fit` to `'VERTICAL'` when framing a tall subject
in a portrait aspect, or the maths uses the wrong axis.

## Depth of field

Blur scales with aperture diameter, which is `focal_length / f-stop`. An 85 mm lens at f/2.8 has a
30 mm aperture; a 35 mm lens at the same f-stop has 12.5 mm and far more depth in focus. That is why
long lenses isolate subjects — not the f-stop alone.

## Constraints versus keyframes

Track-To and Damped-Track constraints keep a camera aimed at a moving subject without keyframes and
survive later edits to the subject's path. Prefer them over baked rotation keys; bake to keyframes
only at export time, since constraints do not survive most exchange formats.

## Aspect ratios

16:9 general · 2.39:1 cinematic · 1:1 social · 4:5 portrait social · 3:2 print

Set the aspect before framing. Reframing after an aspect change is a full redo.
