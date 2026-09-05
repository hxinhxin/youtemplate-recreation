"""Flat, saturated toon materials.

The look is deliberately non-PBR: near-flat base colour, almost no specular,
and a Freestyle ink outline supplied by `render.py`. That combination reads as
cel/cartoon in Cycles without needing EEVEE's Shader-to-RGB.
"""

import bpy

#: Named palettes. `--palette` on the CLI picks one; `--spec` can override any slot.
PALETTES = {
    "mango": {
        "skin":   (1.00, 0.78, 0.55),
        "shirt":  (0.98, 0.36, 0.18),
        "pants":  (0.16, 0.30, 0.55),
        "shoes":  (0.10, 0.10, 0.14),
        "hair":   (0.22, 0.13, 0.09),
        "eye":    (1.00, 1.00, 1.00),
        "pupil":  (0.05, 0.05, 0.08),
        "mouth":  (0.35, 0.09, 0.12),
        "accent": (1.00, 0.85, 0.20),
        "ground": (0.90, 0.90, 0.93),
    },
    "mint": {
        "skin":   (0.98, 0.85, 0.72),
        "shirt":  (0.20, 0.80, 0.62),
        "pants":  (0.20, 0.22, 0.30),
        "shoes":  (0.95, 0.95, 0.98),
        "hair":   (0.10, 0.12, 0.18),
        "eye":    (1.00, 1.00, 1.00),
        "pupil":  (0.06, 0.08, 0.10),
        "mouth":  (0.45, 0.15, 0.20),
        "accent": (1.00, 0.42, 0.55),
        "ground": (0.93, 0.95, 0.94),
    },
    "grape": {
        "skin":   (0.85, 0.66, 0.90),
        "shirt":  (0.42, 0.20, 0.75),
        "pants":  (0.15, 0.10, 0.25),
        "shoes":  (1.00, 0.80, 0.25),
        "hair":   (0.95, 0.95, 1.00),
        "eye":    (1.00, 1.00, 1.00),
        "pupil":  (0.08, 0.05, 0.12),
        "mouth":  (0.30, 0.08, 0.25),
        "accent": (0.30, 0.95, 0.85),
        "ground": (0.88, 0.86, 0.94),
    },
}


def toon_material(name, colour, roughness=0.75, emission_boost=0.06):
    """Flat shaded surface with a whisper of emission so shadows never go muddy."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    rgba = tuple(colour) + (1.0,)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.1
    bsdf.inputs["Emission Color"].default_value = rgba
    bsdf.inputs["Emission Strength"].default_value = emission_boost
    mat.diffuse_color = rgba
    return mat


def build_palette(name="mango", overrides=None):
    """Return {slot: material} for a palette name, honouring colour overrides."""
    colours = dict(PALETTES.get(name, PALETTES["mango"]))
    colours.update(overrides or {})
    mats = {}
    for slot, colour in colours.items():
        rough = 0.35 if slot in ("eye", "pupil") else 0.8
        mats[slot] = toon_material("MAT_%s" % slot, colour, roughness=rough)
    return mats


def assign(obj, material):
    obj.data.materials.clear()
    obj.data.materials.append(material)
    return obj
