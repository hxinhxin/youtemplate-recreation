#!/usr/bin/env python3
"""Fast, render-free checks that the pipeline still assembles and animates.

    python blender/scripts/smoke_test.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))

import bpy  # noqa: E402

from toonkit.rig import CONTROLS  # noqa: E402
from toonkit.scene import build_scene  # noqa: E402
from toonkit.shots import snap_demo  # noqa: E402

FAILURES = []


def check(label, condition, detail=""):
    print(("  ok  " if condition else "  FAIL") + "  " + label + (" — " + detail if detail else ""))
    if not condition:
        FAILURES.append(label)


def main():
    ctx = build_scene(palette="mint")
    body, rig = ctx["body"], ctx["rig"]

    check("mesh built", len(body.data.vertices) > 500, "%d verts" % len(body.data.vertices))
    check("materials assigned", len(body.data.materials) >= 8,
          "%d slots" % len(body.data.materials))
    check("bound to armature",
          any(m.type == 'ARMATURE' and m.object is rig for m in body.modifiers))

    bones = {b.name for b in rig.pose.bones}
    check("all control bones present", set(CONTROLS) <= bones,
          "missing %s" % sorted(set(CONTROLS) - bones))
    groups = {g.name for g in body.vertex_groups}
    deform = {b.name for b in rig.data.bones if b.use_deform}
    check("every deform bone has weights", deform <= groups,
          "unweighted %s" % sorted(deform - groups))

    beats = snap_demo(ctx)
    action = rig.animation_data.action
    check("animation authored", len(action.fcurves) > 20,
          "%d fcurves" % len(action.fcurves))

    # the fast move must be 2-4 frames and the stop must follow within 2
    action_len = beats["launch"] - beats["hitch"]
    stop_len = beats["impact"] - beats["launch"]
    check("action is 2-4 frames", 2 <= action_len <= 4, "%d frames" % action_len)
    check("stop lands within 2 frames", stop_len <= 2, "%d frames" % stop_len)
    check("anticipation is longer than the action",
          (beats["hitch"] - beats["idle_out"]) >= 2 * action_len)

    # the character must travel and must squash and stretch
    positions, scales = [], []
    for f in range(1, beats["end"] + 1):
        bpy.context.scene.frame_set(f)
        positions.append(rig.location.x)
        scales.append(rig.scale.z)
    check("character travels", max(positions) - min(positions) > 2.0,
          "%.2f m" % (max(positions) - min(positions)))
    check("squash and stretch present", min(scales) < 0.75 and max(scales) > 1.25,
          "z scale %.2f..%.2f" % (min(scales), max(scales)))

    cam = ctx["cam"].camera
    check("camera is the scene camera", bpy.context.scene.camera is cam)
    check("camera is animated", cam.animation_data is not None
          and len(cam.animation_data.action.fcurves) > 0)
    check("lens is animated", cam.data.animation_data is not None)

    print("\n%d/%d checks passed" % (14 - len(FAILURES), 14))
    return 1 if FAILURES else 0


if __name__ == "__main__":
    raise SystemExit(main())
