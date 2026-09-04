# Concert promo — vertical torn-film edit

`concert_promo.mp4` — 1080x1920, 30 fps, 26 s, no audio.

Built entirely from the three supplied source clips. Nothing is generated:
no text, logos, typography or added graphic elements, and no people,
faces, clothing or environments other than those in the footage. Each
source clip is trimmed short of its trailing editing-app outro card.

## Files

- `tornfilm.py` — the torn-film transitions, grade, and analog texture.
- `render.py` — the shot list (the edit itself) and the render pipeline.

Run with `python3 render.py out.mp4` (needs `ffmpeg`, `numpy`, `pillow`).
Set `PROMO_SRC` to the directory holding the three source clips.

## The edit

~40 shots, mostly 0.4–1.5 s, with a few longer holds for contrast,
alternating close-ups, extreme close-ups, medium and wide shots, low
angles, crowd reactions, hands, stage lights and venue details. The
rhythm builds: hard cut, punch-in, crowd, torn transition, close-up,
flash, low angle, speed ramp, torn strips, double exposure, hard cut.

## Transitions

The signature transition is a physical horizontal tear. The frame is cut
along irregular ripped edges — built from several octaves of noise plus
fibre-level jitter and occasional deep catches — into horizontal strips
that slide sideways and drift vertically at their own speeds, with lit
fibres along the rip and a shadow cast onto the shot showing through
underneath. Four variants: a single thin tear, several ripped strips, one
large torn-out section, and a version where one shred rides over the new
shot for a few frames. Strips carry directional blur as they move.

This is deliberately not a digital glitch: no pixel corruption, no RGB
separation, no datamoshing.

Supporting transitions: hard cuts, very short white/camera-flash frames,
overexposed roll-offs, and brief double exposures where two shots overlap
semi-transparently.

## Look

Saturated reds, purples, blues and greens; stage lights allowed to blow
out and bloom; deep blacks with crowd silhouettes left dark. Per-shot
auto-exposure keeps every framing readable across footage that swings
from spotlights to near-black. Handheld shake, punch-ins, quick zooms,
speed ramps (fast → slow → fast) and motion blur on fast movement.
Restrained analog texture on top: fine grain, faint scanlines, mild
chromatic aberration at the edges, occasional light leaks and lens
flares, and a rare single-frame displacement.
