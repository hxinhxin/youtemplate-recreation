---
name: snap-animation
description: Extremely fast, exaggerated cartoon animation in Blender — anticipation, snap moves, abrupt stops, overshoot and recoil, squash and stretch, frame-exact timing and short punchy loops. Use for any animation that should feel snappy, poppy, punchy or cartoonish rather than realistic.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: cartoon animation, snappy, punchy, exaggerated, anticipation, overshoot, squash and stretch, fast movement, abrupt stop, recoil, animation loop, timing, keyframe
  related-skills: toon-rig, toon-camera, toon-pipeline, animation, cartoon-style
---

# Snap Animation

Cartoon timing is a *curve* problem, not a pose problem. The poses can be
mediocre and the shot still reads if the timing is right; perfect poses on even
spacing always read as dead.

```python
from toonkit.anim import Animator, squash, merge
a = Animator(rig, fps=24)
```

## The Six-Beat Spine

```python
a.pose(IDLE, 1, interp="ease_out")                        # 1. idle
a.anticipate(IDLE, WIND_UP, 10, frames=6, hitch=2)        # 2. anticipation + hold
a.pose(LAUNCH, 21, interp="ease_out")                     # 3. 3 frames of travel
a.strike(IMPACT, 23, interp="brake")                      # 4. abrupt stop
a.pose(RECOIL, 27, interp="pop", back=2.4)                # 5. overshoot/recoil
a.settle(LANDED, 31, cycles=2, amplitude=0.12, decay=0.45)
a.pose(LANDED, 56, interp="smooth")                       # 6. back to idle
```

## Interpolation Vocabulary

The curve lives on the segment *leaving* a key.

| Preset | Blender curve | Use it for |
|--------|---------------|-----------|
| `hold` | CONSTANT | the 2-frame hitch before a snap; stepped blocking |
| `ease_in` | EXPO / EASE_IN | crawl out of a pose, then slam |
| `ease_out` | EXPO / EASE_OUT | leave instantly, decelerate hard |
| `snap` | QUART / EASE_IN | the workhorse accelerate-into-action |
| `brake` | QUINT / EASE_OUT | the workhorse abrupt stop |
| `pop` | BACK / EASE_OUT | arrival with built-in overshoot |
| `recoil` | BACK / EASE_IN | departure that pulls back first |
| `bounce`, `elastic` | BOUNCE / ELASTIC | props, UI, comedy landings |
| `smooth`, `linear` | BEZIER, LINEAR | connective tissue only |

## Squash and Stretch

`squash(amount)` returns a volume-preserving scale triple: positive squashes
(wide and short), negative stretches (tall and thin).

```python
a.stretch_through(21, amount=0.45)   # stretched through the fast frames
a.impact(23, amount=0.34, frames=3)  # contact squash that pops back out
```

Apply it on `"ROOT"` for the whole body (origin is on the floor, so the feet stay
planted) and on `head` for a facial hit. Cap it: beyond ±0.5 the mesh reads as a
bug, not a choice.

## Timing Law

- Anticipation 2–3× the length of the action.
- Action 2–4 frames. Nothing in between — no breakdown keys in the fast part.
- Stop in 1–2 frames with `brake`.
- Overshoot 25–40% past the target, back in 3–5 frames.
- Settle: 2–3 swings, amplitude halving each time.
- Whole loop 48–96 frames at 24 fps.

## Checklist Before Rendering

1. Scrub frame by frame across the fast part — is there exactly one in-between?
2. Does the silhouette read at every extreme with the character in black?
3. Is anything arriving without an overshoot? Fix it.
4. Is the anticipation actually the *opposite* of the action, or just smaller?
5. Does the camera move on the character's frames? (see `toon-camera`)

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Curve recipes per beat | `references/timing-recipes.md` |
| Pose library and how to edit it | `references/pose-library.md` |
