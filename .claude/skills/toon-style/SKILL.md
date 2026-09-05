---
name: toon-style
description: Art direction for stylized/cartoon 3D — shape language, exaggeration limits, silhouette tests, and when to break from realism. Use when deciding how cartoony a character or shot should be, or when a stylized render looks "almost realistic" instead of deliberately cartoon.
license: MIT
metadata:
  domain: blender
  role: specialist
  triggers: stylized, cartoon look, art direction, shape language, exaggeration, silhouette, toon style
  related-skills: toon-character, toon-materials, snap-animation, cartoon-style, stylized-style, chibi-style
---

# Toon Style

Cartoon is not "realism with fewer polygons". It is a set of deliberate
exaggerations applied consistently across model, colour, timing and camera. Half
measures land in the uncanny middle, which reads as a mistake.

## Commit on Four Axes

| Axis | Realistic | Committed cartoon |
|------|-----------|-------------------|
| Proportion | 7.5 heads | 4 heads, oversized hands/feet |
| Colour | measured albedo, PBR sheen | flat saturated, no specular, ink outline |
| Timing | ease in/out, 8–12 frame actions | 2-frame hold, 3-frame action, hard stop |
| Camera | motivated, smooth | snaps on the character's frames, shakes on impact |

Pick the cartoon column on all four or none. A cartoon model with realistic
timing looks broken; realistic proportions with snap timing looks like a glitch.

## Shape Language

- Round = friendly, soft, comic. Angular = fast, aggressive, villainous.
- One dominant shape per character, repeated: a round-headed character gets
  round hands, round feet, round shoulders.
- Contrast sizes hard — big/small next to each other, never medium/medium.

## The Silhouette Test

Render the character in solid black at every extreme. If a pose is unreadable in
silhouette, the pose is wrong — no amount of colour or shading rescues it. Do
this before animating, on `IDLE`, `ANTICIPATION`, `LAUNCH` and `IMPACT`.

## Exaggeration Limits

| Element | Reads | Breaks |
|---------|-------|--------|
| Squash/stretch | up to ±0.45 | beyond ±0.5, mesh artefacts |
| Limb rotation on rigid segments | up to ~80° | past that, joints separate |
| Head scale in a reaction | up to 1.25× | beyond, the rig shears |
| Overshoot | 25–40% | beyond 50%, reads as a bug |

## Related Upstream Skills

This repo also vendors the `blender-skills` pack — `cartoon-style`,
`stylized-style`, `chibi-style`, `hand-painted-style`, `anime-style`,
`lowpoly-style` and ~90 more — for art direction beyond this pipeline.
