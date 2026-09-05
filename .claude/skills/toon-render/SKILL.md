---
name: toon-render
description: Render and export cartoon character animation from Blender headlessly — Cycles CPU presets, Freestyle ink outlines, MP4 video, PNG sequences, beat contact sheets, .blend and GLB export. Use when rendering, previewing, exporting or troubleshooting headless Blender output.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: render, export, mp4, video, png sequence, freestyle, outline, cycles, eevee, headless, glb, fbx, blend file
  related-skills: toon-camera, toon-materials, rendering, export-pipeline
---

# Toon Render

```python
from toonkit import render
render.configure(preset="preview", outline=True)
render.output_video("renders/shot.mp4")
render.render_animation()
```

## Presets

| Preset | Resolution | Samples | Use |
|--------|-----------|---------|-----|
| `thumb` | 320×180 | 12 | pose checks, seconds per frame |
| `draft` | 640×360 | 24 | timing review, contact sheets |
| `preview` | 960×540 | 48 | the deliverable for most loops |
| `final` | 1920×1080 | 160 | hero render |

## Engine: Cycles CPU, not EEVEE

EEVEE Next needs a GPU context and does not run in a headless container or
under the `bpy` pip module. Cycles CPU renders the same scene reliably; at these
sample counts a flat-shaded cartoon frame costs seconds, not minutes (see
`references/headless.md` for measured times on 4 cores). Do not "fix" a
headless render failure by switching to EEVEE.

## Freestyle Ink

`configure(outline=True)` enables Freestyle with a silhouette + border + crease
line set at thickness 2.2 in near-black. Blender does not create a line style
automatically — `render.py` builds one, because `lineset.linestyle` is `None`
on a fresh line set and assigning to it throws.

Thicker lines (3–4) for chunky mascot work; thinner (1.2) for a hero render at
1080p, where 2.2 reads as a marker pen.

## Outputs

```python
render.output_video(path)            # FFMPEG/H264, bundled with Blender
render.output_frames(directory)      # PNG sequence
render.render_still(path, frame=23)  # a single beat
render.save_blend(path)              # hand off to a human animator
render.export_glb(path)              # engine handoff, animation baked
```

## Reviewing Timing Without Watching Video

Render the beat frames and montage them:

```bash
python blender/scripts/toon.py demo --preset draft --contact-sheet 1,16,18,21,23,27,33,58
```

Eight stills tell you more about a snap than a 3-second video does — you can see
whether the extremes are actually extreme.

## Troubleshooting

| Symptom | Cause |
|---------|-------|
| Pale, chalky colour | AgX view transform; `configure()` sets `Standard` |
| `'NoneType' object has no attribute 'color'` | Freestyle line style not created |
| Black frames | no `scene.camera`; `CameraRig` sets it |
| Render never starts headless | EEVEE selected — use Cycles |
| Enormous file | PNG RGBA sequence at `final`; render video instead |
