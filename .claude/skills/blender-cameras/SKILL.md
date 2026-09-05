---
name: blender-cameras
description: Set up and frame Blender cameras — focal length choice, composition, depth of field, orthographic views, framing an object automatically, and turntable/orbit paths. Use whenever the user asks to add or move a camera, frame a shot, change the angle or lens, add bokeh or shallow depth of field, or asks for a "hero angle", "product shot angle", "close-up", "wide shot" or "top-down view".
when_to_use: Camera placement, lens and framing decisions. Load before lighting — composition determines where the lights go.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Cameras

## Focal length is a storytelling choice

| Lens | Character | Use for |
|---|---|---|
| 18–24 mm | Exaggerated perspective, distortion | Interiors, drama, scale |
| 35 mm | Close to human vision | Environments, documentary feel |
| 50 mm | Neutral | Safe default |
| 85 mm | Mild compression, flattering | Portraits, hero product |
| 135 mm+ | Strong compression, background collapses | Detail shots, isolating a subject |

For product and hero work, prefer **85 mm from further away** over 35 mm from close: long lenses do
not distort the silhouette, and the silhouette is what the viewer reads first.

## Composition defaults

- Subject on a thirds line, not centred, unless the shot is deliberately symmetrical.
- Camera height at or slightly below subject centre reads as heroic; above reads as diminished.
- Leave the subject room to face into.
- Check the render at thumbnail size. If it does not read at 200 px, the composition is wrong.

## Recipe 1 — Camera that frames a subject automatically

Beats hand-tuned coordinates, because it adapts to any subject size.

```python
import bpy, math
from mathutils import Vector

def frame_subject(subject, lens=85.0, azimuth=35.0, elevation=15.0, margin=1.35):
    cam_data = bpy.data.cameras.new('CAM-hero')
    cam_data.lens = lens
    cam = bpy.data.objects.new('CAM-hero', cam_data)
    bpy.context.collection.objects.link(cam)
    bpy.context.scene.camera = cam

    centre = Vector(subject.matrix_world.translation)
    extent = max(subject.dimensions)
    # distance so the subject subtends the sensor with `margin` headroom
    fov = 2 * math.atan(cam_data.sensor_width / (2 * lens))
    dist = (extent * margin) / (2 * math.tan(fov / 2))

    az, el = math.radians(azimuth), math.radians(elevation)
    cam.location = centre + Vector((
        math.sin(az) * math.cos(el),
        -math.cos(az) * math.cos(el),
        math.sin(el))) * dist

    d = (centre - cam.location).normalized()
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    print(f'camera:framed lens={lens}mm dist={dist:.2f}m')
    return cam

frame_subject(bpy.data.objects['GEO-hero'])
```

## Recipe 2 — Depth of field

```python
import bpy
cam = bpy.context.scene.camera
cam.data.dof.use_dof = True
cam.data.dof.focus_object = bpy.data.objects['GEO-hero']   # tracks if either moves
cam.data.dof.aperture_fstop = 2.8                          # lower = shallower
```

f/2.8 is shallow, f/8 is a product-shot standard, f/16 is nearly everything sharp. Setting
`focus_object` rather than `focus_distance` avoids a soft hero when the subject is later moved.

## Recipe 3 — Orthographic view (technical / sprite output)

```python
import bpy, math
cam = bpy.context.scene.camera
cam.data.type = 'ORTHO'
cam.data.ortho_scale = max(bpy.data.objects['GEO-hero'].dimensions) * 1.2
cam.location = (0, -10, 0)
cam.rotation_euler = (math.radians(90), 0, 0)   # front view
```

Front `(90°, 0, 0)` · Side `(90°, 0, 90°)` · Top `(0, 0, 0)`.

## Recipe 4 — Turntable orbit

```python
import bpy, math

def turntable(subject, frames=120, radius=None, height=None):
    centre = subject.matrix_world.translation
    radius = radius or max(subject.dimensions) * 3
    height = height if height is not None else max(subject.dimensions) * 0.8

    pivot = bpy.data.objects.new('EMPTY-turntable', None)
    bpy.context.collection.objects.link(pivot)
    pivot.location = centre

    cam = bpy.context.scene.camera
    cam.location = (centre[0] + radius, centre[1], centre[2] + height)
    cam.parent = pivot
    cam.matrix_parent_inverse = pivot.matrix_world.inverted()

    t = cam.constraints.new('TRACK_TO')
    t.target, t.track_axis, t.up_axis = subject, 'TRACK_NEGATIVE_Z', 'UP_Y'

    bpy.context.scene.frame_start, bpy.context.scene.frame_end = 1, frames
    for f, z in ((1, 0.0), (frames + 1, 2 * math.pi)):
        pivot.rotation_euler.z = z
        pivot.keyframe_insert('rotation_euler', index=2, frame=f)
    for fc in pivot.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'          # constant speed, no ease at the loop seam
    print(f'camera:turntable {frames} frames r={radius:.2f}')
```

Ending the rotation at frame `frames + 1` and rendering `1..frames` makes the loop seamless — frame
1 and frame `frames + 1` are the same pose, so neither is rendered twice.

## Verification

```python
import bpy
cam = bpy.context.scene.camera
print(cam.name, f'{cam.data.lens}mm', cam.data.type,
      'loc=', tuple(round(v, 2) for v in cam.location),
      'dof=', cam.data.dof.use_dof)
```

## Common failures

| Symptom | Cause |
|---|---|
| Subject clipped at edges | Distance derived without margin; raise `margin` |
| Subject tiny in frame | Framing maths used the wrong axis — use `max(dimensions)` |
| Nothing renders | `scene.camera` never assigned |
| Everything blurred | DoF focus distance stale; use `focus_object` |
| Fisheye look on a product | Wide lens up close — move back and go long |
