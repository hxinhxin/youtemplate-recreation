---
description: Set cartoon materials, palettes and per-part colours
argument-hint: "<colour brief, e.g. 'teal hoodie, dark jeans, red shoes'>"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Colour work: $ARGUMENTS

1. Load the `toon-materials` skill.
2. Either pass `colour_overrides` for a one-off, or add a full ten-slot palette to
   `materials.PALETTES` if this is a new character identity.
3. Keep the flat-cartoon recipe: no specular, roughness 0.8, a whisper of emission,
   and the Freestyle outline doing the shape reading.
4. Confirm the view transform is `Standard`, not AgX — that is the usual cause of
   washed-out cartoon colour.
5. Render a still at `--preset preview`, read it, and check value separation
   between adjacent parts before reporting.
