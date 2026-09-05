---
name: blender-materials
description: Author Blender materials with Principled BSDF and shader nodes — metal, glass, plastic, wood, fabric, emission, procedural texture setups, and per-object assignment. Use whenever the user asks to make something look like a material, colour an object, add texture, tune roughness, make something glow or transparent, or fix "everything looks like plastic". Also covers "give it a nice finish" and "match this reference colour".
when_to_use: Surface appearance work. Pairs with blender-lighting — a material can only be judged under the light rig it will ship with.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Materials

## The Principled BSDF cheat sheet

| Look | Base Colour | Metallic | Roughness | Other |
|---|---|---|---|---|
| Polished steel | 0.56 grey | 1.0 | 0.15 | — |
| Brushed aluminium | 0.62 grey | 1.0 | 0.35 | anisotropic if available |
| Gold | (1.0, 0.77, 0.34) | 1.0 | 0.20 | — |
| Clear glass | white | 0.0 | 0.02 | Transmission 1.0, IOR 1.45 |
| Glossy plastic | any | 0.0 | 0.25 | Specular 0.5 |
| Matte rubber | dark | 0.0 | 0.85 | — |
| Varnished wood | brown texture | 0.0 | 0.30 | Clearcoat 0.4 |
| Fabric | any | 0.0 | 0.90 | Sheen 0.5 |
| Skin | pale | 0.0 | 0.50 | Subsurface 0.15, radius (1.0,0.2,0.1) |
| Emissive panel | black | 0.0 | 0.5 | Emission colour + strength 5–50 |

**Metallic is binary.** 0 or 1, never 0.5. A value in between describes a material that does not
physically exist; it is only for masked blends of two surfaces.

**Base colour is never pure.** Real albedo sits between 0.03 and 0.9. Pure white (1,1,1) or pure
black (0,0,0) reflects impossibly and flattens the render.

## Socket names changed in Blender 4.x

`Specular` → `Specular IOR Level`, `Subsurface` → `Subsurface Weight`,
`Transmission` → `Transmission Weight`, `Emission` → `Emission Color` + `Emission Strength`,
`Clearcoat` → `Coat Weight`. Write code that tolerates both:

```python
def set_input(node, names, value):
    """Set the first socket that exists, from a list of candidate names."""
    for n in names:
        if n in node.inputs:
            node.inputs[n].default_value = value
            return n
    raise KeyError(f'none of {names} on {node.name}')
```

## Recipe 1 — Make and assign a material

```python
import bpy

def make_material(name, base_color, metallic=0.0, roughness=0.4):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = (*base_color, 1.0)
    bsdf.inputs['Metallic'].default_value = metallic
    bsdf.inputs['Roughness'].default_value = roughness
    return mat

def assign(ob, mat):
    ob.data.materials.clear()
    ob.data.materials.append(mat)

steel = make_material('MAT-steel', (0.56, 0.57, 0.58), metallic=1.0, roughness=0.15)
assign(bpy.data.objects['GEO-blade'], steel)
print('materials:assigned', steel.name)
```

## Recipe 2 — Glass that renders correctly

```python
import bpy
mat = bpy.data.materials.new('MAT-glass'); mat.use_nodes = True
b = mat.node_tree.nodes['Principled BSDF']
b.inputs['Base Color'].default_value = (1, 1, 1, 1)
b.inputs['Roughness'].default_value = 0.02
set_input(b, ['Transmission Weight', 'Transmission'], 1.0)
b.inputs['IOR'].default_value = 1.45
mat.use_screen_refraction = True          # EEVEE
mat.blend_method = 'BLEND'
print('materials:glass_ready')
```

Glass needs **thickness** — a single plane renders as a grey film. And it needs something to
refract: glass in an empty world is invisible. Add an HDRI or a bright card behind the camera.

## Recipe 3 — Procedural surface variation

Uniform roughness is the single biggest tell of a CG render. Break it up:

```python
import bpy
mat = bpy.data.objects['GEO-hero'].active_material
nt = mat.node_tree
noise = nt.nodes.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 25.0
ramp = nt.nodes.new('ShaderNodeValToRGB')
ramp.color_ramp.elements[0].position = 0.40   # narrow the range
ramp.color_ramp.elements[1].position = 0.60
bsdf = nt.nodes['Principled BSDF']
nt.links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
nt.links.new(ramp.outputs['Color'], bsdf.inputs['Roughness'])
print('materials:roughness_variation_added')
```

Map the ramp to a *narrow* range (e.g. 0.25–0.40), not 0–1. Subtlety is the point.

## Recipe 4 — Emission as a light source

```python
b.inputs['Emission Color'].default_value = (1.0, 0.6, 0.2, 1.0)
b.inputs['Emission Strength'].default_value = 12.0
```

In Cycles this actually lights the scene. In EEVEE it does not unless irradiance volumes are baked
— add a real area light in the same place.

## Working order

Values before colour. Set every material to grey at its correct roughness and metallic, render,
confirm the image reads in greyscale, then introduce hue. A render whose value structure fails will
not be saved by colour.

## Common failures

| Symptom | Cause |
|---|---|
| Everything looks plastic | Roughness 0.5 everywhere; no variation |
| Metal looks like grey paint | Metallic left at 0, or nothing in the world to reflect |
| Glass is black | No environment to refract; or zero thickness |
| Texture is stretched | No UV unwrap; use Smart UV Project or Box mapping |
| Colour is washed out | Colour-space set to Non-Color on a colour map |
