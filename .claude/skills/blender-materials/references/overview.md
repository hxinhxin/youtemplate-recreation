# Materials reference

## Physically plausible albedo

| Surface | Linear value |
|---|---|
| Fresh snow | 0.80 |
| White paint | 0.75 |
| Concrete | 0.30 |
| Grass | 0.15 |
| Asphalt | 0.06 |
| Charcoal | 0.04 |

Nothing real reflects 100% or 0%. Values outside 0.03–0.90 make global illumination misbehave —
too-bright albedo causes light to compound across bounces and wash the scene out.

## IOR

Water 1.33 · Glass 1.45–1.55 · Diamond 2.42 · Skin 1.40 · Plastic 1.46

## Node-tree tips

- Node-group repeated setups rather than duplicating chains; one edit then propagates.
- Colour maps load as sRGB; roughness, metallic, normal and displacement maps must be set to
  **Non-Color** or they will be gamma-decoded and read wrong.
- A Bump node is cheap and fine for fine detail. A Normal Map node needs a matching tangent-space
  map. Displacement needs real geometry (adaptive subdivision in Cycles).

## Baking procedurals for export

glTF, FBX and every real-time engine understand image textures, not Blender node trees. Bake
Base Color, Roughness, Metallic and Normal to images and rebuild a simple Principled material from
those before exporting.
