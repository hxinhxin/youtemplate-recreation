---
description: Rig or re-rig the character — bones, hierarchy, IK, binding, deformation fixes
argument-hint: "[what to change: add bones / fix deformation / enable IK]"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Rigging work: $ARGUMENTS

1. Load the `toon-rig` skill.
2. Edit `_bone_table()` in `blender/toonkit/rig.py` for hierarchy changes. Any new
   deform bone needs a matching full-weight vertex group tag on the mesh parts in
   `character.py` — binding is by name, so an untagged part will not move.
3. Keep binding on `ARMATURE_NAME`. Do not switch to automatic/bone-heat weights:
   the mesh is overlapping primitives and the solver fails on it.
4. Verify by posing the extremes (`IDLE`, `ANTICIPATION`, `LAUNCH`, `IMPACT`) and
   rendering those frames at `--preset draft`, then reading the images for
   detached limbs, floating feet or shearing.
5. Report the bone table changes and any pose limits the new rig imposes.
