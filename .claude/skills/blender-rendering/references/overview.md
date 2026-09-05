# Rendering reference

## Where render time goes

| Factor | Effect |
|---|---|
| Samples | Linear |
| Resolution | Quadratic in linear dimension |
| Light bounces | Sub-linear past ~8 |
| Transmissive surfaces | Large — each glass hit spawns more rays |
| Volumetrics | Very large |
| Subdivision at render time | Memory-bound |

Halving resolution is a 4× speed-up; halving samples is 2×. When iterating, cut resolution first.

## Adaptive sampling

Cycles stops sampling a tile once its estimated noise falls below `adaptive_threshold`. At 0.01,
clean areas (flat walls, background) finish almost immediately while noisy areas (caustics, contact
shadows) keep going. This is why 512 adaptive samples can beat 2048 fixed samples on both quality
and time.

## Denoising

OpenImageDenoise (CPU) and OptiX (NVIDIA) both use albedo and normal passes as guides. Denoising
noise-free-ish input is nearly free; denoising very noisy input smears detail into plastic-looking
blotches. Render enough samples that the image is *nearly* clean, then denoise.

## View transform

AgX (Blender 4.x) and Filmic (3.x) map high dynamic range into display range with a shoulder, so
bright areas desaturate and roll off instead of clipping to flat white. `Standard` is a straight
clip. Any lit scene should use AgX; `Standard` is for flat/UI output and texture bakes.

## Output formats

PNG 16-bit for stills that will be graded · OpenEXR for compositing (full dynamic range, all
passes) · JPEG only for final delivery · PNG sequence, never direct-to-video, for animation.
