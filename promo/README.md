# Concert promo — vertical torn-film edit

`concert_promo_compressed.mp4` — 1080x1920, 30 fps, 36 s, with music.

The full-quality master (`concert_promo.mp4`, CRF 19, ~100 MB) is not
committed because it exceeds GitHub's file limit; `render.py` reproduces it
byte-for-byte, since every random choice in the edit is seeded.

Built entirely from the seven supplied source clips, closing on the band's
own logo. Nothing else is generated: no text, typography or added graphic
elements, and no people, faces, clothing or environments other than those
in the footage. Clips A, B and C are trimmed short of the trailing
editing-app outro card each carries; D-G run clean to the end. Three of
the clips are 720x1280 and are scaled up to the 1080x1920 timeline.

## Files

- `tornfilm.py` — the torn-film transitions, grade, and analog texture.
- `beats.py` — beat analysis of the soundtrack (tempo, beat grid).
- `render.py` — the shot list (the edit itself) and the render pipeline.

Run with `python3 render.py out.mp4` (needs `ffmpeg`, `numpy`, `pillow`).
Set `PROMO_SRC` to the directory holding the three source clips.

## The edit

42 shots, mostly 0.4–1.5 s, with a few longer holds for contrast,
alternating close-ups, extreme close-ups, medium and wide shots, low
angles, crowd reactions, hands, stage lights and venue details. The
rhythm builds: hard cut, punch-in, crowd, torn transition, close-up,
flash, low angle, speed ramp, torn strips, double exposure, hard cut.

## Sharpness

Framing is done in each clip's own native pixels and resampled to the
timeline exactly once, with Lanczos - the picture is never scaled twice.
How far a shot may punch in is capped by the resolution it actually has
(2.7x for the 1080x1920 clips, 1.85x for the 720x1280 ones), so no shot is
enlarged past what its detail supports. An unsharp mask scaled to how much
each shot was enlarged puts the bite back, motion blur is reserved for
genuinely fast movement, and grain is kept light so it does not eat detail
through compression.

## Repetition

No two shots draw on the same moment of the same clip: all 40 shots plus
the outro background come from distinct, non-overlapping source spans,
checked programmatically at build time.
Where several shots share a similar camera setup - the locked stage wide,
the performer on the mic - each is framed differently (tight left, crowd
low, stage right, up into the lights) so distinct moments also look
distinct.

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

## Ending

The closing shot slows down and is ripped away by one last torn transition
into the band logo, which resolves over the crowd still moving in slow
motion behind it, settles, holds, and fades out. The artwork is a solid
silhouette and is used at its full shape, rendered as light so it reads
against the dark stage footage.

## Look

Saturated reds, purples, blues and greens; stage lights allowed to blow
out and bloom; deep blacks with crowd silhouettes left dark. Per-shot
auto-iris meters every frame and follows the lighting, smoothed over about
a third of a second, so footage that swings from spotlights to near-black
stays readable while the venue strobing still reads as flicker. Handheld shake, punch-ins, quick zooms,
speed ramps (fast → slow → fast) and motion blur on fast movement.
Restrained analog texture on top: fine grain, faint scanlines, mild
chromatic aberration at the edges, occasional light leaks and lens
flares, and a rare single-frame displacement.
