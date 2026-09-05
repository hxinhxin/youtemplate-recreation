"""Stylized character construction.

Proportions default to a ~4.5-head cartoon build: oversized cranium, stubby
limbs, big hands and feet. Every part declares the deform bone it belongs to,
so binding later is deterministic instead of relying on the bone-heat solver.
"""

import bpy

from . import materials as mats_mod
from .core import activate, capsule, deselect_all, join, link, sphere

#: Joint positions in metres, Z-up, character facing -Y.
JOINTS = {
    "hips":       (0.00, 0.00, 1.00),
    "spine":      (0.00, 0.00, 1.15),
    "chest":      (0.00, 0.00, 1.40),
    "neck":       (0.00, 0.00, 1.55),
    "head_base":  (0.00, 0.00, 1.62),
    "head_top":   (0.00, 0.00, 2.18),
    "shoulder.L": (0.08, 0.00, 1.50),
    "elbow.L":    (0.62, 0.00, 1.22),
    "wrist.L":    (0.86, 0.00, 0.98),
    "hip.L":      (0.17, 0.00, 1.00),
    "knee.L":     (0.19, 0.00, 0.56),
    "ankle.L":    (0.19, 0.00, 0.13),
    "toe.L":      (0.19, -0.24, 0.06),
}


def _mirror(point):
    x, y, z = point
    return (-x, y, z)


def joint(name):
    """Joint lookup that mirrors `.R` names off their `.L` counterparts."""
    if name in JOINTS:
        return JOINTS[name]
    if name.endswith(".R"):
        return _mirror(JOINTS[name[:-2] + ".L"])
    raise KeyError(name)


def _tag(obj, bone, material):
    """Stamp a part with its deform bone (as a full-weight vertex group)."""
    group = obj.vertex_groups.new(name=bone)
    group.add(range(len(obj.data.vertices)), 1.0, 'REPLACE')
    mats_mod.assign(obj, material)
    return obj


def build_character(palette="mango", colour_overrides=None, name="CHAR_Toon"):
    """Build the body mesh. Returns (mesh_object, materials_dict)."""
    mats = mats_mod.build_palette(palette, colour_overrides)
    parts = []

    def add(obj, bone, slot):
        parts.append(_tag(obj, bone, mats[slot]))
        return obj

    # --- torso stack -----------------------------------------------------
    add(sphere("pelvis", (0, 0, 1.05), 1.0, (0.30, 0.23, 0.19)), "hips", "pants")
    add(sphere("belly", (0, 0, 1.26), 1.0, (0.31, 0.24, 0.20)), "spine", "shirt")
    add(sphere("ribcage", (0, 0, 1.46), 1.0, (0.33, 0.25, 0.17)), "chest", "shirt")
    add(capsule("neck", joint("neck"), joint("head_base"), 0.10, 0.11), "neck", "skin")

    # --- head ------------------------------------------------------------
    add(sphere("skull", (0, 0, 1.90), 0.38, (1.0, 0.94, 1.06)), "head", "skin")
    add(sphere("hair", (0, 0.02, 2.02), 0.385, (1.0, 0.95, 0.72)), "head", "hair")
    for side, sx in (("L", 1), ("R", -1)):
        add(sphere("eye_%s" % side, (0.145 * sx, -0.315, 1.96), 0.11,
                   (1.0, 0.75, 1.15)), "head", "eye")
        add(sphere("pupil_%s" % side, (0.150 * sx, -0.392, 1.95), 0.062,
                   (1.0, 0.6, 1.1)), "head", "pupil")
        add(sphere("ear_%s" % side, (0.37 * sx, 0.0, 1.88), 0.09,
                   (0.6, 1.0, 1.2)), "head", "skin")
    # a nose reads the head's facing direction instantly in profile
    add(sphere("nose", (0, -0.40, 1.86), 0.085, (0.85, 1.25, 0.85)), "head", "skin")
    add(sphere("mouth", (0, -0.355, 1.74), 0.095, (1.0, 0.45, 0.55)), "head", "mouth")
    add(sphere("brow_L", (0.15, -0.345, 2.06), 0.07, (1.2, 0.35, 0.35)), "head", "hair")
    add(sphere("brow_R", (-0.15, -0.345, 2.06), 0.07, (1.2, 0.35, 0.35)), "head", "hair")

    # --- arms ------------------------------------------------------------
    for side in ("L", "R"):
        add(capsule("upperarm_%s" % side, joint("shoulder.%s" % side),
                    joint("elbow.%s" % side), 0.13, 0.10),
            "upperarm.%s" % side, "shirt")
        add(capsule("forearm_%s" % side, joint("elbow.%s" % side),
                    joint("wrist.%s" % side), 0.10, 0.085),
            "forearm.%s" % side, "skin")
        wx, wy, wz = joint("wrist.%s" % side)
        add(sphere("hand_%s" % side, (wx + (0.05 if side == "L" else -0.05), wy, wz - 0.06),
                   0.135, (1.0, 0.75, 1.0)), "hand.%s" % side, "skin")

    # --- legs ------------------------------------------------------------
    for side in ("L", "R"):
        add(capsule("thigh_%s" % side, joint("hip.%s" % side),
                    joint("knee.%s" % side), 0.16, 0.12),
            "thigh.%s" % side, "pants")
        add(capsule("shin_%s" % side, joint("knee.%s" % side),
                    joint("ankle.%s" % side), 0.12, 0.10),
            "shin.%s" % side, "pants")
        ax, ay, az = joint("ankle.%s" % side)
        add(sphere("foot_%s" % side, (ax, ay - 0.10, az - 0.02), 0.14,
                   (0.95, 1.55, 0.62)), "foot.%s" % side, "shoes")

    body = join(parts, parts[0])
    body.name = name
    body.data.name = name + "_mesh"
    link(body, "COL_Character")
    activate(body)
    bpy.ops.object.shade_smooth()
    deselect_all()
    return body, mats
