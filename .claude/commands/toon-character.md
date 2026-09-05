---
description: Create a stylized cartoon character mesh with custom proportions and colours
argument-hint: "<description of the character> [--palette ...]"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Create a cartoon character: $ARGUMENTS

1. Load the `toon-character` skill (and `toon-style` if the brief is vague about
   how stylized to go).
2. Decide proportions first — head units, limb lengths, feature placement — and
   edit `character.JOINTS` / the part list in `blender/toonkit/character.py` to match.
   Keep features outside the skull radius or they vanish in profile.
3. Pick or define a palette (`toon-materials` skill) and pass colour overrides
   rather than hardcoding colours in the mesh code.
4. Render a front still at `--preset preview` and **read the image** to check the
   silhouette, feature placement and colour separation. Iterate until it reads.
5. Report what you changed and show the still.
