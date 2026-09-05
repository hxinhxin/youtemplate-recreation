# Lighting reference

## Inverse square

Doubling the distance from an area, point or spot light quarters the illumination. Any rig written
with hard-coded wattages therefore only works at one scale. The `three_point` recipe multiplies
power by `distance²` for exactly this reason.

Sun lamps are the exception — parallel rays do not fall off, so `energy` is irradiance in W/m² and
distance is irrelevant (only direction matters).

## Apparent size governs shadow softness

The penumbra width is set by the light's angular size from the subject's point of view. A 1 m panel
at 1 m and a 10 m panel at 10 m give identical shadow softness. To soften shadows without changing
exposure, enlarge the light and raise its power to compensate.

For Sun lamps the equivalent control is `angle` — 0.526° is the real sun; larger values give the
overcast look.

## Motivation

Every light in a believable image implies a source: a window, a lamp, the sky, a bounce off a wall.
Rigs that fail usually have a fill light coming from a direction nothing could plausibly illuminate
from. Decide what each light *is* before placing it.

## Diagnosing exposure

Read the render's histogram rather than trusting the viewport. A well-exposed image has values
across the range with a small population near white — not a spike at either end. Correct exposure
at the light level first; view-transform exposure is a grade, not a fix.
