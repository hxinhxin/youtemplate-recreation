# Pose Library

`toonkit/shots.py` ships six named poses used by `snap_demo`. They are plain
dicts — copy, edit numbers, re-run.

| Pose | Reads as |
|------|----------|
| `IDLE` | neutral, arms slightly out, tiny spine S-curve |
| `BREATHE` | idle + chest open, arms further out — the idle's other extreme |
| `ANTICIPATION` | crouched, leaning *away* from travel, arms cocked behind, `squash(0.20)` |
| `LAUNCH` | airborne, pitched 22° into travel, `squash(-0.42)`, limbs trailing |
| `IMPACT` | wide `squash(0.34)`, head thrown forward, legs braced apart |
| `RECOIL` | rebound past the landing: counter-pitch, mild stretch |
| `LANDED` / `LANDED_FRONT` | rest at the new position, facing travel / facing camera |

## Editing rules

- Rotations are degrees, XYZ euler, bone-local.
- Only the channels you list are keyed — a pose can be partial.
- `merge(A, B)` layers pose dicts; later wins per bone-channel.
- `"ROOT"` yaw of +90° turns the character to face +X (screen right for the
  default camera). The build faces −Y (toward camera) at yaw 0.

## Building a new extreme

1. Start from the neighbouring pose, not from zero.
2. Move the hips first, then the spine chain, then the limbs — never the reverse.
3. Break symmetry: 10–20° of difference between left and right kills the
   mannequin look.
4. Add one line of "drag": the head and hands arrive a frame after the torso.
   In practice, key them 1–2 frames later than the body extreme.
