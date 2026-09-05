---
name: toon-camera
description: Camera animation in Blender synchronised to a character's action beats — push-ins on anticipation, whip pans on fast moves, impact shake, snap zooms. Use whenever a shot needs the camera to move with the character.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: camera, camera move, whip pan, push in, camera shake, zoom, dolly, shot, framing, camera sync
  related-skills: snap-animation, toon-render, camera-cinematography
---

# Toon Camera

A camera constrained to look at an empty. Move the empty to re-aim, move the
camera to travel — the framing stays locked on the character either way.

```python
from toonkit.camera import CameraRig
cam = CameraRig(lens=50.0, location=(0, -6.6, 1.85), target=(0, 0, 1.10))
```

## Moves

| Method | Beat it belongs to |
|--------|--------------------|
| `push_in(start, end, from_loc, to_loc)` | anticipation — creep in, arrive on the hitch |
| `whip(frame, to_loc, frames=2, aim_at=..., overshoot=0.04)` | the fast frames |
| `shake(frame, frames=6, amplitude=0.10, base=...)` | the impact |
| `zoom(frame, lens)` | punctuation: wider on the launch, longer on the hold |
| `key` / `aim` | anything else |

## The One Rule

**The camera moves on the character's frames.** If the character lands on 23,
the camera whip lands on 23 too. A camera that eases on its own schedule reads
as a separate, slower shot happening behind the animation.

## The Second Rule

**Hold the aim explicitly.** Blender interpolates between whatever keys exist —
if the aim target is keyed on frame 1 and frame 23, it is drifting the entire
time and the framing slides during the idle. Key the aim at the start *and* end
of every hold.

## Lens as timing

- Go **wider** (50 → 40 mm) for the 3 fast frames: the perspective stretch adds
  speed the character alone cannot.
- Go **longer** (50 → 55 mm) during the anticipation: compression builds pressure.
- Snap the lens with `interp="ease_out"`, never `smooth`; a slow zoom deflates a
  fast move.

## Shake that reads

Alternate the offset on *consecutive* frames — a shake on every third frame is a
wobble. Decay by ~0.6 per frame and land back exactly on the base position, or
the shot ends slightly off-centre.

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Beat-synced camera track | `references/camera-beats.md` |
