# Vendored skills

Every skill directory in here *except* the eight below is vendored verbatim from
[`arjun988/blender-skills`](https://github.com/arjun988/blender-skills) v1.3.0,
MIT licensed. The upstream licence is kept alongside as `UPSTREAM_LICENSE`.

Authored in this repository (they wrap the executable `blender/toonkit/` pipeline):

- `toon-pipeline` — orchestrates the whole job
- `toon-character` — mesh, proportions, feature placement
- `toon-rig` — armature, IK, binding
- `snap-animation` — cartoon timing, the core skill
- `toon-camera` — camera moves cut to the character's beats
- `toon-materials` — palettes and flat toon shading
- `toon-style` — art direction and exaggeration limits
- `toon-render` — headless rendering and export

The upstream pack is guidance for Blender MCP workflows and covers far more
ground (styles, worlds, genres, engine export). Nothing in it is executable on
its own; the `toon-*` skills are.
