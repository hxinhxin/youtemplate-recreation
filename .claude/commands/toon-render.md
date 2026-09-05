---
description: Render the shot or a still — presets, outlines, video, contact sheets
argument-hint: "[--preset thumb|draft|preview|final] [--frames ...]"
allowed-tools: Bash, Read, Skill, Glob
---

Render: $ARGUMENTS

1. Load the `toon-render` skill.
2. Use the cheapest preset that answers the question: `thumb`/`draft` for timing and
   pose checks, `preview` for the deliverable, `final` only when asked.
3. For timing review render a contact sheet of the beat frames, not a video.
4. Always read the rendered images before reporting — a black frame, a cropped
   subject or chalky AgX colour is invisible from the log alone.
5. Report render time, output paths and file sizes.
