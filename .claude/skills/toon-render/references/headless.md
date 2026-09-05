# Headless Blender

## Two ways to run

**`bpy` as a pip module** (no Blender install; needs CPython 3.11):

```bash
python3.11 -m venv .venv
.venv/bin/pip install bpy==4.2.0
.venv/bin/python blender/scripts/toon.py demo --preset draft
```

**A real Blender install:**

```bash
blender --background --python blender/scripts/toon.py -- demo --preset draft
```

`cli.main()` strips everything up to and including `--`, so the same script works
either way.

## Cost

On 4 CPU cores, flat cartoon geometry with Freestyle:

| Preset | Per frame | 72-frame loop |
|--------|-----------|---------------|
| thumb | ~1 s | ~1.5 min |
| draft | ~3 s | ~4 min |
| preview | ~17 s | ~20 min |
| final | ~90 s | ~1 h 45 |

Freestyle adds a fixed ~0.3 s/frame regardless of resolution.

## Threads

`configure(threads=N)` pins the tile threads; leave it at 0 (auto) unless
sharing the machine.

## Video without ffmpeg on PATH

Blender bundles libavcodec, so `output_video()` works even when the system has
no `ffmpeg` binary. There is no need to render a PNG sequence and stitch it.
