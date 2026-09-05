"""Armature construction and deterministic binding.

Hierarchy (deform bones only):

    root
     └ hips
        ├ spine ─ chest ─ neck ─ head
        │           └ upperarm.L/R ─ forearm.L/R ─ hand.L/R
        └ thigh.L/R ─ shin.L/R ─ foot.L/R

Binding uses `ARMATURE_NAME`: every mesh part already carries a full-weight
vertex group named after its bone (see `character.py`), so deformation is exact
and the bone-heat solver — which fails on overlapping primitive soups — is never
invoked.
"""

import bpy
from mathutils import Vector

from .character import joint
from .core import activate, deselect_all, link

#: (name, head, tail, parent, connected)
def _bone_table():
    def j(n):
        return Vector(joint(n))

    bones = [
        ("root", Vector((0, 0, 0)), Vector((0, -0.45, 0)), None, False),
        ("hips", j("hips"), j("spine"), "root", False),
        ("spine", j("spine"), j("chest"), "hips", True),
        ("chest", j("chest"), j("neck"), "spine", True),
        ("neck", j("neck"), j("head_base"), "chest", True),
        ("head", j("head_base"), j("head_top"), "neck", True),
    ]
    for side in ("L", "R"):
        wrist = j("wrist.%s" % side)
        flip = 1 if side == "L" else -1
        bones += [
            ("upperarm.%s" % side, j("shoulder.%s" % side), j("elbow.%s" % side), "chest", False),
            ("forearm.%s" % side, j("elbow.%s" % side), wrist, "upperarm.%s" % side, True),
            ("hand.%s" % side, wrist, wrist + Vector((0.14 * flip, 0, -0.14)),
             "forearm.%s" % side, True),
            ("thigh.%s" % side, j("hip.%s" % side), j("knee.%s" % side), "hips", False),
            ("shin.%s" % side, j("knee.%s" % side), j("ankle.%s" % side), "thigh.%s" % side, True),
            ("foot.%s" % side, j("ankle.%s" % side), j("toe.%s" % side), "shin.%s" % side, True),
        ]
    return bones


#: Bones an animator is expected to key, in a sensible channel-box order.
CONTROLS = [
    "root", "hips", "spine", "chest", "neck", "head",
    "upperarm.L", "forearm.L", "hand.L",
    "upperarm.R", "forearm.R", "hand.R",
    "thigh.L", "shin.L", "foot.L",
    "thigh.R", "shin.R", "foot.R",
]


def build_rig(name="ARM_Toon"):
    armature = bpy.data.armatures.new(name + "_data")
    rig = bpy.data.objects.new(name, armature)
    link(rig, "COL_Character")
    activate(rig)

    bpy.ops.object.mode_set(mode='EDIT')
    created = {}
    for bone_name, head, tail, parent, connected in _bone_table():
        eb = armature.edit_bones.new(bone_name)
        eb.head, eb.tail = head, tail
        eb.use_deform = bone_name != "root"
        if parent:
            eb.parent = created[parent]
            eb.use_connect = connected
        created[bone_name] = eb

    # IK foot controllers, left switched off so the FK animation is authoritative.
    for side in ("L", "R"):
        ctrl = armature.edit_bones.new("ik_foot.%s" % side)
        ctrl.head = Vector(joint("ankle.%s" % side))
        ctrl.tail = ctrl.head + Vector((0, -0.3, 0))
        ctrl.parent = created["root"]
        ctrl.use_deform = False

    bpy.ops.object.mode_set(mode='POSE')
    for pb in rig.pose.bones:
        pb.rotation_mode = 'XYZ'
    for side in ("L", "R"):
        ik = rig.pose.bones["shin.%s" % side].constraints.new('IK')
        ik.target = rig
        ik.subtarget = "ik_foot.%s" % side
        ik.chain_count = 2
        ik.influence = 0.0
    bpy.ops.object.mode_set(mode='OBJECT')
    deselect_all()
    return rig


def bind(mesh, rig):
    """Bind by matching vertex-group names to bone names (no heat solver)."""
    deselect_all()
    mesh.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_NAME')
    deselect_all()
    return mesh


def set_ik(rig, side, influence):
    rig.pose.bones["shin.%s" % side].constraints[0].influence = influence


def rest_pose(rig):
    """Zero every pose channel — the canonical A-pose the character was built in."""
    for pb in rig.pose.bones:
        pb.location = (0, 0, 0)
        pb.rotation_euler = (0, 0, 0)
        pb.scale = (1, 1, 1)
    rig.location = (0, 0, 0)
    rig.rotation_euler = (0, 0, 0)
    rig.scale = (1, 1, 1)
