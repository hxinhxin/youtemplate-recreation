---
description: Art-direct the stylized/cartoon look and check it is committed rather than half-real
argument-hint: "[the look you want]"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Art direction: $ARGUMENTS

1. Load the `toon-style` skill; the vendored `cartoon-style`, `stylized-style` and
   `chibi-style` skills carry further direction if the brief needs a specific flavour.
2. Audit all four axes — proportion, colour, timing, camera — and say which ones are
   currently sitting in the realistic column.
3. Propose the changes that move every axis to the cartoon column together, then
   apply them across `character.py`, `materials.py`, `shots.py` as needed.
4. Run the silhouette test on the key extremes before and after.
