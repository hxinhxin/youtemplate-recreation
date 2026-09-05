---
name: blender-export
description: Export Blender scenes to glTF/GLB, FBX, OBJ, USD or STL with the right settings per target — web, Unity, Unreal, 3D printing — plus scale, axis, material and polycount preparation. Use whenever the user asks to export, save as, convert to, or "get this into" another engine, a web viewer or a printer.
when_to_use: Producing a file for a downstream tool. Run the preparation checks before any exporter call.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Export

## Format by target

| Target | Format | Notes |
|---|---|---|
| Web / three.js / model-viewer | **GLB** | Single file, PBR materials, Draco compression |
| Unity | FBX | Y-up, apply scale, +Z forward |
| Unreal | FBX or USD | Unreal is cm-scale — 1 Blender unit = 1 m = 100 uu |
| 3D printing | STL | Manifold, real-world mm, no materials |
| DCC interchange | USD / Alembic | Preserves hierarchy and animation |
| Quick geometry hand-off | OBJ | No animation, weak material support |

## Pre-export checklist

Run this before every export. Most "the export is broken" reports are one of these five:

```python
import bpy
issues = []
for ob in bpy.data.objects:
    if ob.type != 'MESH':
        continue
    if tuple(round(s, 4) for s in ob.scale) != (1.0, 1.0, 1.0):
        issues.append(f'{ob.name}: unapplied scale {tuple(round(s,3) for s in ob.scale)}')
    if not ob.data.uv_layers and ob.data.materials:
        issues.append(f'{ob.name}: material but no UV map')
    ngons = sum(1 for p in ob.data.polygons if len(p.vertices) > 4)
    if ngons:
        issues.append(f'{ob.name}: {ngons} n-gons (triangulate on export)')
    if len(ob.data.polygons) > 100_000:
        issues.append(f'{ob.name}: {len(ob.data.polygons)} faces — decimate for web')
print('export:issues', len(issues))
for i in issues:
    print('  -', i)
```

Fix unapplied scale with `bpy.ops.object.transform_apply(scale=True)` — it is the single most
common cause of an object arriving in a game engine at the wrong size.

## Recipe 1 — GLB for the web

```python
import bpy
bpy.ops.export_scene.gltf(
    filepath='/tmp/model.glb',
    export_format='GLB',
    export_apply=True,            # apply modifiers
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_materials='EXPORT',
    export_cameras=False,
    export_lights=False,
    use_selection=False,
)
print('export:glb /tmp/model.glb')
```

Only the Principled BSDF survives to glTF. Procedural node trees do not — bake them to image
textures first, or the model arrives untextured.

Web budget: under 5 MB and under 100k triangles for a comfortable page load.

## Recipe 2 — FBX for Unity

```python
import bpy
bpy.ops.export_scene.fbx(
    filepath='/tmp/model.fbx',
    apply_scale_options='FBX_SCALE_ALL',
    axis_forward='-Z', axis_up='Y',
    mesh_smooth_type='FACE',
    use_mesh_modifiers=True,
    bake_space_transform=True,
    add_leaf_bones=False,
)
print('export:fbx /tmp/model.fbx')
```

## Recipe 3 — STL for printing

```python
import bpy
ob = bpy.context.active_object
print('dimensions_mm:', tuple(round(d * 1000, 1) for d in ob.dimensions))
bpy.ops.wm.stl_export(filepath='/tmp/part.stl', export_selected_objects=True,
                      global_scale=1000.0)      # metres -> millimetres
```

Printing needs a **manifold** mesh: no holes, no interior faces, no zero-thickness walls. Check with
3D-Print Toolbox, or look for boundary edges before exporting.

## Recipe 4 — Decimate for a polygon budget

```python
import bpy

def decimate_to(ob, target_faces):
    current = len(ob.data.polygons)
    if current <= target_faces:
        print(f'decimate:skip {ob.name} already {current}')
        return
    m = ob.modifiers.new('Decimate', 'DECIMATE')
    m.ratio = target_faces / current
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.modifier_apply(modifier=m.name)
    print(f'decimate:{ob.name} {current} -> {len(ob.data.polygons)}')
```

Decimate the render-detail copy, never the source. Keep the high-poly original in the .blend.

## Verify the file exists

An exporter that raises no error has still not necessarily written anything useful:

```python
import os
p = '/tmp/model.glb'
print('export:verify', p, os.path.exists(p), os.path.getsize(p) if os.path.exists(p) else 0, 'bytes')
```

## Common failures

| Symptom | Cause |
|---|---|
| 100× too big/small in engine | Unapplied scale, or metre/centimetre mismatch |
| Model lies on its side | Axis convention — Blender is Z-up, most engines Y-up |
| Materials missing | Procedural shaders not baked to textures |
| Animation missing | Not baked to keyframes; constraints do not export |
| STL rejected by slicer | Non-manifold geometry |
