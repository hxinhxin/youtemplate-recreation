---
name: blender-modeling
description: Create and edit Blender geometry — primitives, modifiers (bevel, subdivision, mirror, array, solidify, boolean), curves, bmesh edits, and multi-part assemblies at real-world scale. Use whenever the user asks to model, build, add, extrude, bevel, subdivide, mirror, array, boolean, or reshape an object. Also covers "make me a sword / chair / bottle / logo in 3D" and "clean up this mesh", even when the word "model" never appears.
when_to_use: Any request that changes geometry. Not for materials, lights, cameras or render settings.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Modeling

## Rules that matter more than technique

1. **Scale first.** Set real dimensions before anything else. Light falloff, bevel widths and
   physics all read wrong at arbitrary scale. A chair is ~0.9 m tall, a mug ~0.1 m.
2. **Modifiers over destructive edits.** Keep the stack live as long as possible; apply only when a
   later operation demands real geometry (boolean, export).
3. **Bevel everything visible.** Real objects have no perfectly sharp edge. A 1–3 mm bevel with 2
   segments is what makes a render stop looking like a render.
4. **Model in screen-area order.** The silhouette earns the most; interior detail the camera never
   sees earns nothing.

## Modifier stack order

`Mirror → Array → Subdivision → Bevel → Solidify → Boolean → Weighted Normal`

Bevel after Subdivision, or the subdivision smears the bevel. Boolean last, or it cuts through
geometry that does not exist yet.

## Recipe 1 — Parameterised part at true scale

```python
import bpy

def add_box(name, size, location, bevel=0.002):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    ob = bpy.context.active_object
    ob.name = f'GEO-{name}'
    ob.dimensions = size            # metres, applied to the 1 m cube
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        m = ob.modifiers.new('Bevel', 'BEVEL')
        m.width, m.segments, m.limit_method = bevel, 2, 'ANGLE'
        m.angle_limit = 0.523599    # 30 deg
    return ob

seat = add_box('seat', (0.45, 0.45, 0.05), (0, 0, 0.45))
print('modeling:created', seat.name, tuple(round(d, 3) for d in seat.dimensions))
```

`ob.dimensions` then `transform_apply(scale=True)` is the reliable way to hit an exact size —
setting `scale` alone leaves a non-uniform scale that breaks bevel widths.

## Recipe 2 — Symmetric part via Mirror

```python
import bpy
ob = bpy.context.active_object
m = ob.modifiers.new('Mirror', 'MIRROR')
m.use_axis = (True, False, False)
m.use_clip = True                  # stops verts crossing the seam
m.merge_threshold = 0.0001
print('modeling:mirrored', ob.name)
```

Model only the +X half. `use_clip` is what keeps the centre seam watertight.

## Recipe 3 — Boolean cut, safely

```python
import bpy

def boolean_cut(target, cutter, keep_cutter=False):
    m = target.modifiers.new('Cut', 'BOOLEAN')
    m.operation, m.object, m.solver = 'DIFFERENCE', cutter, 'EXACT'
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=m.name)
    if not keep_cutter:
        bpy.data.objects.remove(cutter, do_unlink=True)
    print('modeling:boolean_cut', target.name, '->', len(target.data.polygons), 'faces')
```

Booleans fail on non-manifold or self-intersecting input. If the result has holes, the cutter was
open — thicken it with Solidify first, and make it overshoot the target on both sides.

## Recipe 4 — Curve to mesh (cables, trim, rails)

```python
import bpy
curve = bpy.context.active_object          # a Bezier/NURBS curve
curve.data.bevel_depth = 0.004             # cable radius, metres
curve.data.bevel_resolution = 4
curve.data.use_fill_caps = True
bpy.ops.object.convert(target='MESH')
print('modeling:curve_to_mesh', bpy.context.active_object.name)
```

## Recipe 5 — bmesh edit when ops are not enough

```python
import bpy, bmesh
ob = bpy.context.active_object
bm = bmesh.new(); bm.from_mesh(ob.data)
top = [f for f in bm.faces if f.normal.z > 0.9]
bmesh.ops.inset_region(bm, faces=top, thickness=0.01)
bm.to_mesh(ob.data); bm.free(); ob.data.update()
print('modeling:inset', len(top), 'faces')
```

bmesh is preferred over `bpy.ops.mesh.*` in scripts: ops depend on mode, selection and context
overrides, and silently no-op when any of those are wrong.

## Verification

Never report a model as done without reading back what exists:

```python
import bpy
for ob in bpy.data.objects:
    if ob.type == 'MESH':
        print(f'{ob.name:24} verts={len(ob.data.vertices):6} dims=' +
              ','.join(f'{d:.3f}' for d in ob.dimensions))
```

Check: plausible dimensions, no object at an unintended origin, vertex counts not exploding from a
stacked Subdivision (level 3 on 500 faces is 32k faces).

## Common failures

| Symptom | Cause |
|---|---|
| Bevel does nothing | Object has non-uniform scale — apply scale first |
| Subdivision looks lumpy | N-gons and triangles; retopologise to quads |
| Boolean leaves holes | Open or coplanar cutter; solidify and overshoot |
| Faces look inverted | Flipped normals — `bpy.ops.mesh.normals_make_consistent()` |
| Mirror seam splits | `use_clip` off, or verts already crossed the axis |
