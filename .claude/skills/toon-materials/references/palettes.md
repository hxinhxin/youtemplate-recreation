# Palettes

Values are linear RGB 0–1, as Blender wants them.

## mango — warm, friendly, high contrast

| Slot | RGB |
|------|-----|
| skin | 1.00, 0.78, 0.55 |
| shirt | 0.98, 0.36, 0.18 |
| pants | 0.16, 0.30, 0.55 |
| shoes | 0.10, 0.10, 0.14 |
| hair | 0.22, 0.13, 0.09 |
| accent | 1.00, 0.85, 0.20 |
| ground | 0.90, 0.90, 0.93 |

## mint — cool, modern, mascot-ish

skin 0.98/0.85/0.72 · shirt 0.20/0.80/0.62 · pants 0.20/0.22/0.30 ·
shoes 0.95/0.95/0.98 · hair 0.10/0.12/0.18 · accent 1.00/0.42/0.55

## grape — stylised, high-key, unnatural skin

skin 0.85/0.66/0.90 · shirt 0.42/0.20/0.75 · pants 0.15/0.10/0.25 ·
shoes 1.00/0.80/0.25 · hair 0.95/0.95/1.00 · accent 0.30/0.95/0.85

## Adding a palette

Add a dict to `materials.PALETTES` with all ten slots, then
`build_palette("yourname")`. Missing slots raise a `KeyError` at scene build —
deliberately, so a half-defined palette never ships silently.

## Lighting interaction

`lighting.toon_lighting()` uses a 0.35-strength cool world plus key/fill/rim
area lights at 520/180/420 W. Raising the world ambient above ~0.5 flattens the
palette toward white; lowering it below 0.2 makes shadow sides read as a
different colour than the lit sides, which breaks the flat-colour illusion.
