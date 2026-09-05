---
name: toon-materials
description: Flat cartoon materials and colour palettes in Blender — saturated base colours, no PBR sheen, Freestyle ink outlines, and per-slot colour overrides. Use for cartoon shading, custom character colours, or when renders look washed out.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: materials, colors, colours, palette, toon shading, cel shading, flat colour, outline, washed out render
  related-skills: toon-render, toon-character, materials, stylized-style, cartoon-style
---

# Toon Materials

```python
from toonkit.materials import PALETTES, build_palette, toon_material, assign
mats = build_palette("mint", {"shirt": (0.9, 0.1, 0.4)})
```

Slots: `skin shirt pants shoes hair eye pupil mouth accent ground`.
Shipped palettes: `mango` (warm orange/blue), `mint` (teal/pink), `grape`
(purple/gold).

## The Recipe

Principled BSDF with:

- flat `Base Color`, no textures
- `Roughness` 0.8 (0.35 for eyes)
- `Specular IOR Level` 0.1 — kill the sheen, it fights the flatness
- `Emission Strength` 0.06 of the base colour, so shadow sides never go muddy

Shape reading comes from the **Freestyle ink outline**, not from shading. That is
configured in `toon-render`, and the two are a package — flat materials without
the outline look like untextured greybox.

## The One Setting That Ruins Cartoon Colour

Blender 4.x defaults the view transform to **AgX**, which desaturates saturated
flat colour into pastel mud. `render.configure()` sets:

```python
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'
```

If a render comes back pale and chalky, this is why — check it before touching
the palette.

## Palette Construction

1. Two dominant hues plus one accent that appears on less than 5% of the surface.
2. Keep values apart: light skin, mid shirt, dark pants, near-black shoes. If two
   adjacent parts share a value, the silhouette breaks.
3. Saturate more than feels right — the ink outline and the ambient fill both
   pull saturation down.
4. Pupils near-black (0.05) and eye whites pure white; anything softer and the
   face loses its focus point.

## Reference Guide

| Topic | Reference |
|-------|-----------|
| Palette recipes and colour values | `references/palettes.md` |
