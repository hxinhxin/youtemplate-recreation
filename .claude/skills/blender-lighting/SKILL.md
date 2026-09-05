---
name: blender-lighting
description: Light Blender scenes — three-point rigs, HDRI environments, studio, cinematic, dramatic and outdoor setups, colour temperature, shadow softness and light ratios. Use whenever the user asks to light a scene, add a key/fill/rim light, use an HDRI, or make something look studio, moody, golden-hour, dramatic or "professional". Also covers "why is my render flat/dark/noisy" when the cause is the light rig.
when_to_use: Any lighting setup, change, or diagnosis. Pairs with blender-materials and blender-cameras.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Lighting

## Light types

| Type | Character | Use for |
|---|---|---|
| **Area** | Soft shadows for free; size controls softness | Default choice for ~80% of lights |
| **Sun** | Parallel rays, angle controls penumbra | Daylight, moonlight |
| **Point** | Omnidirectional, inverse-square falloff | Bulbs, practicals |
| **Spot** | Cone with blend falloff | Stage, headlights, pools of light |
| **World/HDRI** | 360° environment | Ambient grounding, product shots, reflections |

Shadow softness is a function of **apparent light size**, not any softness slider. A 2 m area light
at 1 m gives wrap-around shadows; the same light at 10 m gives near-hard ones.

## Decision tree

```
Mood?
├─ Studio / product   → 3-point + HDRI at 0.3 strength
├─ Daylight           → Sun (angle 0.526°) + sky HDRI
├─ Interior           → Sun through a window + low HDRI + practicals
├─ Dramatic / noir    → Single spot high and to the side, no fill, dark world
├─ Sunset             → Low sun, colour (1.0, 0.55, 0.25), strong rim
└─ Unsure             → 3-point + HDRI. Works for most subjects.
```

## Ratios — the part that decides whether it looks lit or lit-by-an-amateur

| Rig | Key : Fill : Rim |
|---|---|
| Soft commercial | 1 : 0.6 : 0.4 |
| Standard portrait | 1 : 0.3 : 0.5 |
| Dramatic | 1 : 0.1 : 0.8 |
| Noir | 1 : 0.0 : 0.3 |

Key from 30–45° off the camera axis and 30–45° above. Fill on the opposite side, lower and larger.
Rim behind the subject, opposite the key, aimed back at the camera to cut the silhouette out of the
background.

## Colour temperature

| Source | Kelvin | Approx RGB |
|---|---|---|
| Candle | 1900 K | (1.00, 0.58, 0.24) |
| Tungsten | 3200 K | (1.00, 0.78, 0.55) |
| Daylight | 5600 K | (1.00, 0.96, 0.92) |
| Overcast | 7000 K | (0.90, 0.94, 1.00) |
| Deep shade | 9000 K | (0.79, 0.87, 1.00) |

Warm key against cool fill reads as depth. Same temperature on both reads as flat.

## Helper — aim a light at the subject

Hard-coded rotations only work for a 1 m subject at the origin. Aim instead:

```python
from mathutils import Vector

def aim_at(light_obj, target):
    p = Vector(target.location) if hasattr(target, 'location') else Vector(target)
    d = (p - light_obj.location).normalized()
    light_obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
```

## Recipe 1 — Subject-aware three-point rig

Scales itself to the actual bounding box of the subject, so it works on a ring or a building.

```python
import bpy, math
from mathutils import Vector

def three_point(subject, ratio=(1.0, 0.3, 0.5), key_kelvin_rgb=(1.0, 0.85, 0.7)):
    for ob in [o for o in bpy.data.objects if o.name.startswith('LGT-')]:
        bpy.data.objects.remove(ob, do_unlink=True)

    centre = Vector(subject.matrix_world.translation)
    radius = max(subject.dimensions) or 1.0
    dist   = radius * 3.0
    power  = 60.0 * (dist ** 2) / 9.0          # keeps exposure stable across scales

    specs = [
        ('key',  ( 0.7, -0.7,  0.6), radius * 1.5, power * ratio[0], key_kelvin_rgb),
        ('fill', (-0.9, -0.5,  0.2), radius * 2.5, power * ratio[1], (0.8, 0.88, 1.0)),
        ('rim',  ( 0.1,  1.0,  0.7), radius * 1.0, power * ratio[2], (1.0, 1.0, 1.0)),
    ]
    for name, dir_, size, watts, colour in specs:
        data = bpy.data.lights.new(f'LGT-{name}', 'AREA')
        data.size, data.energy, data.color = size, watts, colour
        ob = bpy.data.objects.new(f'LGT-{name}', data)
        bpy.context.collection.objects.link(ob)
        ob.location = centre + Vector(dir_).normalized() * dist
        aim_at(ob, centre)
        print(f'lighting:{name} d={dist:.2f} size={size:.2f} W={watts:.0f}')

three_point(bpy.data.objects['GEO-hero'])
```

The `dist**2` term matters: area lights obey inverse-square, so a rig that looks right at 1 m is
100× too dim at 10 m.

## Recipe 2 — HDRI environment

```python
import bpy
w = bpy.context.scene.world or bpy.data.worlds.new('World')
bpy.context.scene.world = w
w.use_nodes = True
nt = w.node_tree
nt.nodes.clear()
env = nt.nodes.new('ShaderNodeTexEnvironment')
env.image = bpy.data.images.load('/path/to/studio.exr')
bg  = nt.nodes.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value = 0.4
out = nt.nodes.new('ShaderNodeOutputWorld')
nt.links.new(env.outputs['Color'], bg.inputs['Color'])
nt.links.new(bg.outputs['Background'], out.inputs['Surface'])
print('lighting:hdri_loaded')
```

No HDRI file available? A flat grey world at strength 0.3 is a valid stand-in and still gives metals
something to reflect:

```python
bg.inputs['Color'].default_value = (0.25, 0.26, 0.28, 1.0)
```

## Recipe 3 — Diagnose a flat render

```python
import bpy
for ob in bpy.data.objects:
    if ob.type == 'LIGHT':
        l = ob.data
        print(f'{ob.name:16} {l.type:6} energy={l.energy:8.1f} '
              f'size={getattr(l, "size", 0):.2f} colour={tuple(round(c,2) for c in l.color)}')
w = bpy.context.scene.world
print('world strength:', w.node_tree.nodes['Background'].inputs['Strength'].default_value
      if w and w.use_nodes else 'none')
```

Flat almost always means: fill within 20% of key, no rim, and world strength above 1.0 washing out
every shadow. Cut the world first.

## Common failures

| Symptom | Cause |
|---|---|
| Render nearly black | Energy in the wrong order of magnitude for the scene scale |
| Blown highlights | Point light very close; use a larger area light further away |
| Noisy shadows | Small bright lights; enlarge them and raise samples |
| No visible shadows | World strength too high; or no ground plane to catch them |
| Metal looks dead | Nothing in the world to reflect — add an HDRI or bounce cards |
