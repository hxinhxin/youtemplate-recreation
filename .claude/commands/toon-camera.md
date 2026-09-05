---
description: Animate the camera in sync with the character's action beats
argument-hint: "[the move: push-in / whip / shake / handheld]"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Camera work: $ARGUMENTS

1. Load the `toon-camera` skill.
2. Get the character's beat frames first (from `shots.snap_demo`'s `beats` dict) —
   every camera key must land on one of them.
3. Edit `_camera_track()` in `blender/toonkit/shots.py` using `CameraRig.push_in`,
   `.whip`, `.shake`, `.zoom`, `.key`, `.aim`.
4. Key the aim target at the start *and* end of every hold, or the framing drifts
   through the idle.
5. Verify by printing camera location, lens and aim per frame, then rendering the
   beat frames and reading them for cropping and subject size.
