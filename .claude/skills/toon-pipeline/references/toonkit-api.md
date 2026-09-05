# toonkit API

Package lives at `blender/toonkit/`. Import path is `blender/` on `sys.path`.

| Module | Key entry points |
|--------|------------------|
| `scene` | `build_scene(palette, colour_overrides, fps, lens, lights, ground)` → ctx dict |
| `character` | `build_character(palette, colour_overrides)` → `(mesh, mats)`; `JOINTS`, `joint(name)` |
| `rig` | `build_rig()`, `bind(mesh, rig)`, `set_ik(rig, side, influence)`, `rest_pose(rig)`, `CONTROLS` |
| `materials` | `PALETTES`, `build_palette(name, overrides)`, `toon_material(name, colour)`, `assign` |
| `anim` | `Animator`, `INTERP`, `squash(amount)`, `volume_preserving`, `merge`, `key_object` |
| `camera` | `CameraRig` — `.key`, `.aim`, `.push_in`, `.whip`, `.shake`, `.zoom` |
| `lighting` | `toon_lighting(strength)`, `ground_plane(material)` |
| `render` | `PRESETS`, `configure`, `output_video`, `output_frames`, `render_animation`, `render_still`, `save_blend`, `export_glb` |
| `shots` | `snap_demo(ctx, fps)`; pose constants `IDLE`, `ANTICIPATION`, `LAUNCH`, `IMPACT`, `RECOIL`, `LANDED` |

## Animator methods

```python
a = Animator(rig, fps=24)
a.pose(POSE, frame, interp="snap")             # key a whole pose dict
a.hold(POSE, start, end)                       # stepped hold, then leave on `end`
a.anticipate(base, wind_up, start, frames=6, hitch=2)
a.strike(action, frame, interp="brake")        # arrive hard on an exact frame
a.overshoot(target, frame, over=0.35)          # blow past, then snap back
a.settle(target, frame, cycles=2, amplitude=0.18, decay=0.45)
a.impact(frame, amount=0.34)                   # one-frame contact squash
a.stretch_through(frame, amount=0.45)          # stretch along travel
a.blink(frame)
a.set_range(1, 72)
```

## Interpolation presets (`anim.INTERP`)

`hold` · `linear` · `smooth` · `ease_in` · `ease_out` · `snap` · `brake` ·
`pop` · `recoil` · `bounce` · `elastic`

The curve belongs to the segment *leaving* a key: `interp="ease_in"` means
"crawl out of this pose, then slam into the next one".

## Pose dict format

```python
{"ROOT":  {"loc": (0, 0, 0), "rot": (0, 0, 90), "scale": (1, 1, 1)},   # armature object
 "head":  {"rot": (-24, 0, 0)},                                        # pose bone, degrees
 "hips":  {"loc": (0, 0, -0.1)}}
```

Bones: `root hips spine chest neck head upperarm.L/R forearm.L/R hand.L/R
thigh.L/R shin.L/R foot.L/R` plus `ik_foot.L/R` (IK influence 0 by default).
