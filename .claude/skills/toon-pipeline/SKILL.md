---
name: toon-pipeline
description: End-to-end orchestrator for stylized/cartoon 3D characters in Blender — build, rig, colour, animate with snappy cartoon timing, sync the camera, render and export. Use whenever the user asks for an animated 3D character, a cartoon character, a punchy character loop, or a Blender character shot.
license: MIT
metadata:
  domain: blender
  role: director
  triggers: toon character, cartoon character, animated 3d character, character loop, blender character, stylized character, snap animation
  related-skills: toon-character, toon-rig, snap-animation, toon-camera, toon-materials, toon-render, cartoon-style, chibi-style, animation, rigging
---

# Toon Pipeline

Directs the whole stylized-character job and hands each stage to the specialist skill.
The executable layer is `blender/toonkit/` in this repo — a Blender Python package
that builds, rigs, animates, lights, renders and exports the character for real.

## Order of Work

```
toon-character  → mesh + proportions
toon-rig        → armature + deterministic binding
toon-materials  → palette, flat toon shading
snap-animation  → pose-to-pose cartoon timing        ← the part that matters most
toon-camera     → moves cut to the same frames
toon-render     → Cycles + Freestyle ink, video/GLB
```

## Fast Path

Everything at once, from a shell:

```bash
python blender/scripts/toon.py demo --palette mint --preset preview \
    --video renders/snap_demo.mp4 --blend renders/snap_demo.blend
```

Or, inside Blender: `blender --background --python blender/scripts/toon.py -- demo --preset draft`.

## From Python

```python
from toonkit.scene import build_scene
from toonkit.shots import snap_demo

ctx = build_scene(palette="mango")     # mesh, rig, materials, camera, lights
beats = snap_demo(ctx, fps=24)         # the six-beat cartoon shot
```

`ctx` is `{"scene", "body", "rig", "mats", "cam", "palette"}`. Every stage below
operates on that dict.

## Non-Negotiables for the Cartoon Look

1. **Pose to pose, never spline everything.** Key the extremes, then control the curve.
2. **Anticipation is the mirror of the action**, and it *holds* for 2 frames before firing.
3. **The fast part is 2–4 frames.** If it takes more, it is not fast.
4. **Stops are abrupt** — hard deceleration plus a squash on the contact frame.
5. **Nothing arrives cleanly.** Overshoot, recoil, then a decaying settle.
6. **Squash and stretch preserve volume** (`toonkit.anim.squash`).
7. **The camera cuts on the character's frames**, never on its own schedule.

## Setup Check

If `bpy` is missing: `python -m venv .venv && .venv/bin/pip install bpy==4.2.0`
(needs Python 3.11). A full Blender install works too — see `/blender-setup`.

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Beat sheet + frame budget | `references/beat-sheets.md` |
| toonkit API surface | `references/toonkit-api.md` |
