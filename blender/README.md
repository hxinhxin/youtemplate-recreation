# toonkit — stylized cartoon characters in Blender

A small Blender Python package that builds, rigs, colours, animates, lights,
renders and exports a stylized 3D character, driven entirely from the command
line. It is the executable half of the Claude Code skills in `.claude/skills/`.

## Install

`toonkit` needs Blender 4.2. Either a normal Blender install, or the `bpy` pip
module on **CPython 3.11**:

```bash
python3.11 -m venv .venv
.venv/bin/pip install bpy==4.2.0
```

## Run

```bash
# the full six-beat demo: idle → anticipation → fast move → stop → recoil → idle
.venv/bin/python blender/scripts/toon.py demo \
    --palette mango --preset preview \
    --video renders/snap_demo.mp4 --blend renders/snap_demo.blend

# a character turnaround still
.venv/bin/python blender/scripts/toon.py character --preset preview --still renders/char.png

# beat frames only, for judging timing
.venv/bin/python blender/scripts/toon.py demo --preset draft --contact-sheet 1,16,18,21,23,27,33,58

# engine handoff
.venv/bin/python blender/scripts/toon.py export --glb renders/toon.glb
```

Inside a real Blender install the same script works as
`blender --background --python blender/scripts/toon.py -- demo --preset draft`.

## Layout

| File | Role |
|------|------|
| `toonkit/core.py` | scene reset, primitives, joins, collections |
| `toonkit/character.py` | the mesh — joints, parts, feature placement |
| `toonkit/rig.py` | armature, hierarchy, IK, deterministic binding |
| `toonkit/materials.py` | palettes and flat toon shading |
| `toonkit/lighting.py` | three-point rig tuned for flat colour |
| `toonkit/anim.py` | `Animator`, curve presets, squash and stretch |
| `toonkit/camera.py` | `CameraRig` — push-in, whip, shake, zoom |
| `toonkit/shots.py` | pose library and the `snap_demo` beat sheet |
| `toonkit/render.py` | presets, Freestyle ink, video/PNG/GLB/blend output |
| `toonkit/scene.py` | `build_scene()` — everything assembled |
| `toonkit/cli.py` | argument parsing for `scripts/toon.py` |

## Design notes

- **Binding is by vertex-group name, not bone heat.** Every mesh part carries a
  full-weight group named after its deform bone, so binding a soup of
  overlapping primitives is exact instead of failing in the solver.
- **`"ROOT"` is the armature object, not a bone.** Its origin sits on the floor,
  so a Z scale of 0.8 squashes the whole character with the feet planted — that
  is where global squash and stretch live.
- **Cycles CPU, not EEVEE.** EEVEE Next needs a GPU context and will not render
  headless or under the `bpy` module.
- **View transform is `Standard`.** Blender 4.x defaults to AgX, which turns
  saturated cartoon colour into pastel mud.
- **Freestyle supplies the ink outline**, and flat materials depend on it — the
  two are a package.

## Shipped output

`renders/` holds the rendered demonstration:

| File | What |
|------|------|
| `snap_demo.mp4` | the 72-frame loop at 960×540, 24 fps |
| `snap_demo_beats.png` | the eight beat frames as a contact sheet |
| `snap_demo.blend` | the scene, for continuing by hand |
| `toon_character.glb` | engine handoff with the action baked in |

Regenerate any of them with `blender/scripts/toon.py`. Verify the pipeline
without rendering: `python blender/scripts/smoke_test.py` (14 checks).
