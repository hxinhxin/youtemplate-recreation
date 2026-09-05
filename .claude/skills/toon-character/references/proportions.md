# Cartoon Proportions and Feature Placement

## The default skeleton of measurements (metres, Z-up)

| Landmark | Z | Notes |
|----------|---|-------|
| toe | 0.06 | foot points −Y (forward) |
| ankle | 0.13 | |
| knee | 0.56 | |
| hip | 1.00 | x ±0.17 |
| spine | 1.15 | |
| chest | 1.40 | |
| shoulder | 1.50 | x ±0.08 (arms start close in, cartoon read) |
| elbow | 1.22 | x ±0.62 |
| wrist | 0.98 | x ±0.86 |
| neck | 1.55 | |
| head base / top | 1.62 / 2.18 | 0.56 tall head on a 2.18 figure ≈ 4 heads |

## Feature depth

The skull is a sphere of radius 0.38 scaled `(1.0, 0.94, 1.06)`, so its Y radius
is 0.357. Anything shallower than that is buried inside the head:

| Feature | Y | Radius |
|---------|---|--------|
| eye white | −0.315 | 0.11, scaled (1.0, 0.75, 1.15) |
| pupil | −0.392 | 0.062 |
| nose | −0.40 | 0.085, scaled (0.85, 1.25, 0.85) |
| mouth | −0.355 | 0.095, flattened |
| brow | −0.345 | 0.07, wide and thin |
| ear | x ±0.37 | 0.09 |

A nose is the cheapest possible profile read — without it the head is a ball
from the side and the audience loses which way the character faces.

## Squash-and-stretch headroom

Keep 10–15% clearance between overlapping primitives (belly/chest, hand/forearm).
Under a 0.66 Z squash the parts compress into each other; without clearance the
silhouette develops visible creases.
