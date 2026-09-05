---
name: toon-character
description: Build stylized/cartoon character meshes in Blender with exaggerated proportions, big heads, readable silhouettes and animation-ready parts. Use when creating a new 3D cartoon character, changing its proportions, or adding facial features.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: create character, build character, cartoon character mesh, chibi proportions, character model, stylized character
  related-skills: toon-rig, toon-materials, character-artist, chibi-style, cartoon-style
---

# Toon Character

Builds the mesh. Every part is tagged with the deform bone it belongs to, so
`toon-rig` can bind without the bone-heat solver.

## Build It

```python
from toonkit.character import build_character
body, mats = build_character(palette="mango")
```

Or the whole scene at once: `from toonkit.scene import build_scene`.

## Proportions

Default is a ~4.5-head cartoon build: head radius 0.38 m on a 2.2 m figure,
stubby limbs, oversized hands and feet. Edit `character.JOINTS` to restyle —
it is a plain dict of joint positions in metres, Z-up, character facing −Y.

| Read | Head units | Use |
|------|-----------|-----|
| Chibi / mascot | 2.5–3.5 | maximum cute, tiny limbs |
| Cartoon (default) | 4–5 | expressive, still poseable |
| Stylized hero | 6–7 | action, longer limbs |

`.L` joints are mirrored automatically for `.R` — only author the left side.

## Silhouette Rules

1. Big head, small waist, big extremities — the classic readable triangle.
2. Features must sit **outside** the skull sphere or they vanish in profile.
   Eyes at y ≈ −0.315, nose at −0.40, mouth at −0.355 against a 0.357 skull radius.
3. Joints get cap spheres so limbs stay connected through extreme rotation.
4. Shade smooth everywhere; the Freestyle ink line does the shape reading.

## Customising

```python
build_character(palette="grape", colour_overrides={"shirt": (0.9, 0.1, 0.4)})
```

Adding a part: create it, `_tag(obj, bone, material)`, append to `parts`. The
tag is a full-weight vertex group named after the bone — that is the entire
binding contract.

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Proportion + feature placement | `references/proportions.md` |
