---
name: toon-rig
description: Rig cartoon characters in Blender with a clean FK/IK armature, deterministic weight binding, and pose channels built for extreme cartoon posing. Use when rigging a character, adding bones or IK, or fixing deformation.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: rig, armature, bones, IK, FK, weight paint, bind, skinning, deform
  related-skills: toon-character, snap-animation, rigging
---

# Toon Rig

## Hierarchy

```
root
 └ hips
    ├ spine ─ chest ─ neck ─ head
    │           └ upperarm.L/R ─ forearm.L/R ─ hand.L/R
    └ thigh.L/R ─ shin.L/R ─ foot.L/R
ik_foot.L/R  (parented to root, IK influence 0.0)
```

```python
from toonkit.rig import build_rig, bind, set_ik, rest_pose
rig = build_rig()
bind(mesh, rig)          # ARMATURE_NAME — matches vertex groups to bone names
set_ik(rig, "L", 1.0)    # switch a leg to IK when you need a planted foot
```

## Why `ARMATURE_NAME` and not automatic weights

The mesh is a soup of overlapping primitives. Blender's bone-heat solver fails
on that geometry ("Bone Heat Weighting: failed to find solution"). Every part
instead carries a single full-weight vertex group named after its bone, so
binding is exact, instant and reproducible. Deformation is rigid per segment —
which is *correct* for rubber-hose cartoon, where segments read as solid shapes
connected by ball joints.

If you want smooth bending, add an Armature modifier `Smooth` pass or a
Corrective Smooth modifier after binding; do not switch to bone heat.

## Posing contract

- All pose bones are `XYZ` euler. Rotations in pose dicts are **degrees**.
- `"ROOT"` in a pose dict addresses the armature *object*, not a bone. That is
  where world travel and global squash/stretch live — its origin sits on the
  floor, so a Z scale of 0.8 squashes the character while keeping the feet planted.
- Bone-local X is pitch (forward/back), Z is yaw, Y twists along the bone.

## Common fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Feet float in a crouch | leg bend without root drop | lower `ROOT` Z, or lean on the `squash()` scale, which pins the feet |
| Limbs detach at extremes | rotation past ~80° on a rigid segment | split the rotation across two bones, or accept it (cartoon does) |
| Feet slide on a stop | FK legs | `set_ik(rig, side, 1.0)` and key `ik_foot.L/R` |
| Whole body shears | non-uniform scale on a rotated bone | scale on `ROOT` instead |

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Bone table + IK setup | `references/rig-anatomy.md` |
