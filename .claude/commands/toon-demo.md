---
description: Build, rig, animate and render the six-beat cartoon snap demo end to end
argument-hint: "[--palette mango|mint|grape] [--preset thumb|draft|preview|final]"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Produce the full demonstration shot — idle → anticipation → extremely fast move →
abrupt stop → overshoot/recoil → return to idle — with cartoon timing, not slow motion.
Options: $ARGUMENTS

1. Load the `toon-pipeline` skill and follow its order of work.
2. Run `blender/scripts/toon.py demo` with the requested palette and preset,
   writing both a `.blend` and an `.mp4` under `renders/`.
3. Render a contact sheet of the beat frames (`--contact-sheet 1,16,18,21,23,27,33,58`)
   and actually look at the stills before declaring it done.
4. Report the beat sheet (frame numbers per beat) and where the files landed.

If the user asked for different action beats, edit the pose constants in
`blender/toonkit/shots.py` rather than writing a new script.
