---
name: blender-workflow
description: Plan and sequence multi-stage Blender work, and route each stage to the right sub-skill. Use whenever a request spans more than one phase of 3D work — "make a hero render of X", "build and light a scene", "produce a product shot", "set up a turntable", "what order should I do this in" — or when the user is unsure where to start. Also covers "make it look professional", "final image", "full pipeline", even when the word "workflow" never appears.
when_to_use: Multi-phase Blender requests, pipeline sequencing questions, or an open-ended "make me a scene of X". Load this first, then chain the domain skills it names.
allowed-tools: Read Bash mcp__blender__execute_blender_code mcp__blender__get_scene_info mcp__blender__get_object_info
---

# Blender Workflow

The planner. Decide the order of operations, set a fidelity budget per stage, then chain-load the
domain skills. Do not do modeling/lighting/render work from this skill — delegate.

## Connection check (run once per session)

Every Blender skill in this set assumes one of two execution paths:

1. **BlenderMCP** — `mcp__blender__execute_blender_code` against a running Blender with the
   BlenderMCP addon listening (default port 9876). Preferred: the scene persists between calls.
2. **Headless fallback** — `blender --background scene.blend --python step.py`. Stateless, so each
   script must open the .blend, mutate, and save. Use only when no MCP server is available.

Confirm which path is live before writing code:

```python
import bpy
print("blender", bpy.app.version_string, "| objects:", len(bpy.data.objects),
      "| engine:", bpy.context.scene.render.engine)
```

If neither path works, say so plainly and offer to write the scripts for the user to run — do not
pretend a scene was built.

## Order of operations

```
1. Intent + references   What is the shot? What must it read as at thumbnail size?
2. Block-out             Primitives at true scale. No detail.
3. Camera lock           Focal length + framing. Composition is decided here, not later.
4. Key light             One light. Get the value structure right in greyscale.
5. Real geometry         Replace primitives, in order of screen area.
6. Materials, flat       Roughness and value first. Colour last.
7. Full light rig        Fill, rim, environment. Tune ratios.
8. Detail                Bevels, wear, texture — only where the camera sees it.
9. Final render          Production samples + denoise.
10. Composite            Grade, glare, vignette.
11. Export               Only if a downstream target was named.
```

Each step gates the next. The most common failure is spending the budget at step 5 and arriving at
step 7 with a beautifully modelled object that reads as grey mush.

## Budget for a single hero still

| Stage | Share |
|---|---|
| Intent, block-out, camera | 20% |
| Lighting (both passes) | 25% |
| Geometry refinement | 30% |
| Materials | 15% |
| Render + composite | 10% |

## Routing table

| Request shape | Chain |
|---|---|
| "Hero shot of X" | modeling → cameras → lighting → materials → rendering |
| "Light this scene" | lighting → rendering |
| "Make X look like metal/glass/wood" | materials → lighting → rendering |
| "Product shot on white" | cameras → lighting → materials → rendering |
| "Turntable of X" | cameras → lighting → rendering (frame loop) |
| "Give me a glTF/FBX/OBJ of X" | modeling → materials → export |
| "Why does my render look flat?" | lighting (diagnose) → rendering |

## Checkpoints

Render a 25%-scale EEVEE preview after steps 3, 4 and 7. Each preview costs seconds and catches
composition and value errors while they are still cheap to fix.

```python
import bpy
s = bpy.context.scene
s.render.engine = 'BLENDER_EEVEE_NEXT'
s.eevee.taa_render_samples = 16
s.render.resolution_percentage = 25
s.render.filepath = '/tmp/checkpoint.png'
bpy.ops.render.render(write_still=True)
print('checkpoint:/tmp/checkpoint.png')
```

## Recovery patterns

| Symptom | Cause | Fix |
|---|---|---|
| Render reads flat | No value separation; fill too strong | Cut fill to 1/4 key, add rim |
| Everything looks plastic | Roughness left at default 0.5 everywhere | Vary roughness per material; add subtle variation |
| Object floats | No contact shadow / no ground | Add ground plane, soften key, check contact darkness |
| Noise won't clear | Small bright lights + low samples | Enlarge area lights, raise samples, enable denoise |
| Scene scale wrong | Modelled in arbitrary units | Set real-world dimensions before lighting; light falloff depends on it |

## Conventions this skill set assumes

- Object prefixes: `GEO-`, `CAM-`, `LGT-`, `EMPTY-`. Makes scripted selection reliable.
- Every generated script ends with a `print()` line stating what changed — that print is the only
  feedback channel from a headless or MCP call.
- Never `bpy.ops.wm.read_factory_settings()` on a scene the user has been working in.
