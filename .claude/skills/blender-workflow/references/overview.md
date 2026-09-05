# Workflow reference

## Why the order is the order

Each stage constrains the next, and the constraint runs one way only.

- **Camera before lighting.** A light rig is aimed relative to the camera, not to the world. Move
  the camera afterwards and the key becomes a rim.
- **Lighting before materials.** Roughness is judged by how a highlight rolls across a surface. In
  flat light there is no highlight, so there is nothing to judge.
- **Materials before detail.** Detail that a material hides is wasted work.
- **Everything before render settings.** Sample counts fix noise. They do not fix composition.

## Thumbnail test

Every checkpoint render should be read at ~200 px wide. At that size only three things survive:
silhouette, value structure, and one dominant colour relationship. If the image fails at 200 px,
no amount of geometry detail rescues it at 2000 px.

## Scale discipline

Blender's default unit is one metre. Physical lighting, depth of field and physics all assume it.
Model at true size from the start; retrofitting scale after a light rig exists means redoing the
rig, because area-light power scales with the square of distance.

## Reporting honestly

These skills drive an external application. When a call fails, the scene is unchanged — say that.
Never describe a render that was not produced or a file that was not written; every recipe here
ends with a `print()` or an existence check precisely so there is something real to quote.
