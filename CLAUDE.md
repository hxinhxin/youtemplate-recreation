# Repository guide

Two unrelated things live here.

## `index.html` / `styles.css` / `script.js`

The original static web template. Plain HTML/CSS/JS, no build step — open
`index.html` directly.

## `blender/` + `.claude/`

A Claude Code skill pack and Blender pipeline for stylized, cartoon-timed 3D
character animation.

- `blender/toonkit/` — the executable pipeline (build, rig, colour, animate,
  light, render, export). See `blender/README.md`.
- `.claude/skills/` — eight pipeline skills authored here (`toon-pipeline`,
  `toon-character`, `toon-rig`, `snap-animation`, `toon-camera`,
  `toon-materials`, `toon-style`, `toon-render`) plus the vendored
  [`arjun988/blender-skills`](https://github.com/arjun988/blender-skills) pack
  (~95 skills, MIT).
- `.claude/commands/` — the slash commands that drive them.

### Working on the Blender side

- Run everything through `blender/scripts/toon.py`; do not write one-off
  scripts that duplicate `toonkit`.
- Requires Blender 4.2 or `pip install bpy==4.2.0` on CPython 3.11.
- Always **read** rendered images before reporting a result — a black frame or a
  cropped subject is invisible in the render log.
- Judge timing from a beat contact sheet (`--contact-sheet`), not from video.
- Cartoon timing is the point: anticipation 2–3× the action, actions of 2–4
  frames, hard stops, overshoot on every arrival. Never smooth a fast move.
