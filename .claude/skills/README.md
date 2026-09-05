# Blender skills

A set of Claude Code skills for driving Blender as a 3D artist would: state the intent, and the
skills supply the sequencing, the physically-grounded defaults, and the Python to execute.

Written for this repository from scratch, taking its overall shape (one orchestrator plus focused
domain skills, each with recipes, failure tables, and trigger evals) from
[RobLe3/cc-blender-skill](https://github.com/RobLe3/cc-blender-skill).

## Skills

| Skill | Owns |
|---|---|
| `blender-workflow` | Planning and sequencing; routes to the rest. Load this first for anything multi-stage. |
| `blender-modeling` | Geometry: primitives, modifiers, bmesh, curves, real-world scale |
| `blender-materials` | Principled BSDF, shader nodes, procedural variation |
| `blender-lighting` | Three-point rigs, HDRI, ratios, colour temperature |
| `blender-cameras` | Focal length, automatic framing, depth of field, turntables |
| `blender-rendering` | Cycles/EEVEE, samples, denoising, colour management, output |
| `blender-export` | glTF/GLB, FBX, OBJ, USD, STL and the preparation each needs |

## Execution paths

1. **BlenderMCP** — `mcp__blender__execute_blender_code` against a running Blender with the
   BlenderMCP addon (default port 9876). The scene persists between calls; this is the preferred
   path.
2. **Headless** — `blender --background scene.blend --python step.py`. Stateless: each script must
   open the .blend, mutate it, and save.

If neither is available, the skills say so and hand over the scripts rather than reporting work
that did not happen.

## Layout

```
.claude/skills/<skill>/
├── SKILL.md              frontmatter (name, description, when_to_use, allowed-tools) + body
├── references/overview.md background detail loaded on demand
└── evals/evals.json      trigger tests: queries that should and should not load this skill
```

## Conventions the skills assume

- Object name prefixes `GEO-`, `CAM-`, `LGT-`, `EMPTY-` so scripted selection is reliable.
- Real-world scale from the first primitive — light falloff and depth of field depend on it.
- Every generated script ends in a `print()` stating what changed; in headless and MCP calls that
  print is the only feedback channel.
- Verification before reporting: read the scene back, or check the output file exists.
