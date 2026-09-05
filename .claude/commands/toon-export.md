---
description: Export the animated character for another tool or a game engine
argument-hint: "[--glb path] [--blend path]"
allowed-tools: Bash, Read, Skill, Glob
---

Export: $ARGUMENTS

1. Load the `toon-render` skill; the vendored `export-pipeline`, `unity-export`,
   `unreal-export` and `godot-export` skills cover engine-specific requirements.
2. `blender/scripts/toon.py export --glb renders/<name>.glb` bakes the current
   action into a GLB with the frame range preserved.
3. Also save a `.blend` whenever a human will continue the work by hand.
4. State what the export contains: bone count, frame range, fps, material slots,
   and that the Freestyle outline is a render-time effect that does **not** export.
