---
description: Animate with exaggerated cartoon timing — anticipation, snap, abrupt stop, overshoot, recoil
argument-hint: "<the action to animate, e.g. 'dash right and skid to a stop'>"
allowed-tools: Bash, Read, Write, Edit, Skill, Glob, Grep
---

Animate: $ARGUMENTS

1. Load the `snap-animation` skill and read its timing recipes before keying anything.
2. Write the beat sheet **first** — frame numbers for idle, anticipation, hitch,
   action, stop, overshoot, settle — and state it before you write code.
3. Author it with `toonkit.anim.Animator` in `blender/toonkit/shots.py`:
   anticipation 2–3× the action, action 2–4 frames with no breakdown keys inside it,
   `brake` into the stop, `pop`/`recoil` on arrival, decaying settle.
4. Apply volume-preserving squash and stretch on `"ROOT"` through the fast frames
   and a one-frame contact squash on the stop.
5. Render the beat frames at `--preset draft` as a contact sheet and read them.
   Fix anything that is not actually at an extreme, then render the loop.

Use exaggerated cartoon timing. Never ease a fast move; never let anything arrive
without an overshoot.
