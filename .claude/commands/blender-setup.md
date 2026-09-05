---
description: Install and verify the headless Blender environment for the toon pipeline
argument-hint: "[--venv PATH]"
allowed-tools: Bash, Read, Skill
---

Set up everything needed to run `blender/toonkit/`. Extra options: $ARGUMENTS

1. Check for a usable Blender: `python -c "import bpy; print(bpy.app.version_string)"`,
   then `blender --version`.
2. If neither works, create a venv on **CPython 3.11** (the `bpy` wheel is
   version-locked) and `pip install bpy==4.2.0`. Default location `.venv` unless
   the arguments say otherwise.
3. Verify end to end with the cheapest possible render:
   `<python> blender/scripts/toon.py character --preset thumb --still renders/_setup_check.png`
4. Read the resulting PNG to confirm it is a shaded character and not a black frame,
   then delete it.
5. Report the exact interpreter path to use for every later command.

Load the `toon-render` skill for headless specifics and troubleshooting.
