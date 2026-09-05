---
name: blender-rendering
description: Configure and run Blender renders — Cycles vs EEVEE, sample counts, denoising, resolution, colour management and view transform, output formats, animation frame ranges, and render-time diagnosis. Use whenever the user asks to render, produce an image or animation, speed up a render, remove noise, fix an over/under-exposed result, or choose an engine.
when_to_use: Producing output images or sequences, and any render-settings or render-performance question.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Rendering

## Engine choice

| | Cycles | EEVEE Next |
|---|---|---|
| Path-traced accuracy | Yes | Approximated |
| Glass, caustics, true GI | Correct | Weak |
| Speed | Minutes | Seconds |
| Use for | Final stills, hero shots | Previews, animation, stylised work |

Workflow: everything in EEVEE at 25% scale while iterating, switch to Cycles only for the final.

## Recipe 1 — Cycles final still

```python
import bpy
s = bpy.context.scene
s.render.engine = 'CYCLES'
s.cycles.device = 'GPU'
s.cycles.samples = 512
s.cycles.use_adaptive_sampling = True
s.cycles.adaptive_threshold = 0.01          # stops clean regions early
s.cycles.use_denoising = True
s.cycles.max_bounces = 12
s.cycles.transmission_bounces = 12          # glass needs these
s.render.resolution_x, s.render.resolution_y = 1920, 1080
s.render.resolution_percentage = 100
s.render.film_transparent = False
s.render.image_settings.file_format = 'PNG'
s.render.image_settings.color_depth = '16'
s.render.filepath = '/tmp/hero.png'
bpy.ops.render.render(write_still=True)
print('render:complete /tmp/hero.png')
```

With adaptive sampling and denoising on, 512 samples is usually indistinguishable from 4096 and
roughly eight times faster. Raise samples only if noise survives denoising.

## Recipe 2 — GPU enablement (do this before blaming Cycles for being slow)

```python
import bpy
prefs = bpy.context.preferences.addons['cycles'].preferences
for backend in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
    try:
        prefs.compute_device_type = backend
        prefs.get_devices()
        if any(d.type != 'CPU' for d in prefs.devices):
            break
    except TypeError:
        continue
for d in prefs.devices:
    d.use = True
    print('device:', d.name, d.type)
bpy.context.scene.cycles.device = 'GPU'
```

If this prints only CPU devices, say so — do not report a GPU render that did not happen.

## Recipe 3 — Fast EEVEE preview

```python
import bpy
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE_NEXT'
s.eevee.taa_render_samples = 32
s.eevee.use_raytracing = True             # screen-space GI/reflections
s.render.resolution_percentage = 50
s.render.filepath = '/tmp/preview.png'
bpy.ops.render.render(write_still=True)
print('render:preview /tmp/preview.png')
```

## Recipe 4 — Colour management

```python
import bpy
vs = bpy.context.scene.view_settings
vs.view_transform = 'AgX'      # 'Filmic' pre-4.0; 'Standard' only for UI/flat output
vs.look = 'AgX - Medium High Contrast'
vs.exposure = 0.0
vs.gamma = 1.0
```

AgX rolls highlights off gracefully and desaturates them the way film does. `Standard` clips hard
and is the reason renders look harsh and plasticky — use it only for UI elements and texture bakes,
never for a lit scene.

## Recipe 5 — Animation output

```python
import bpy
s = bpy.context.scene
s.frame_start, s.frame_end, s.frame_step = 1, 120, 1
s.render.fps = 24
s.render.image_settings.file_format = 'PNG'   # image sequence, not a video file
s.render.filepath = '/tmp/turntable/frame_'
bpy.ops.render.render(animation=True)
print('render:sequence /tmp/turntable/')
```

Render to a PNG sequence, then encode with ffmpeg. A crashed or interrupted direct-to-video render
leaves an unusable file; a sequence is resumable and every frame survives.

```bash
ffmpeg -framerate 24 -i /tmp/turntable/frame_%04d.png \
       -c:v libx264 -pix_fmt yuv420p -crf 18 /tmp/turntable.mp4
```

## Recipe 6 — Headless render

```bash
blender --background scene.blend \
        --python-expr "import bpy; bpy.context.scene.cycles.samples=256" \
        --render-output /tmp/out_ --render-frame 1
```

## Render-time budget

| Output | Engine | Samples | Scale | Time |
|---|---|---|---|---|
| Composition check | EEVEE | 16 | 25% | < 1 s |
| Lighting check | EEVEE | 32 | 50% | ~2 s |
| Material check | Cycles | 64 | 50% | ~20 s |
| Final still | Cycles | 512 | 100% | 2–10 min |

## Common failures

| Symptom | Cause |
|---|---|
| Render is black | No camera assigned, or every light at zero energy |
| Fireflies | Small bright lights; enable Clamp Indirect at ~10 |
| Glass renders opaque/black | `transmission_bounces` too low |
| Blown-out whites | View transform on `Standard`; switch to AgX |
| Very slow | Running on CPU; check Recipe 2 |
| Alpha missing | `film_transparent` not enabled, or format has no alpha (JPEG) |
