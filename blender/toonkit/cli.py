"""Command line front end.

Runs either inside Blender::

    blender --background --python blender/scripts/toon.py -- demo --preset draft

or against the `bpy` pip module::

    python blender/scripts/toon.py demo --preset draft
"""

import argparse
import json
import os
import sys


def _parser():
    p = argparse.ArgumentParser(prog="toon", description="Stylized toon character pipeline")
    sub = p.add_subparsers(dest="command", required=True)

    def common(sp):
        sp.add_argument("--palette", default="mango", help="mango | mint | grape")
        sp.add_argument("--colors", default=None,
                        help='JSON slot overrides, e.g. \'{"shirt":[0.9,0.1,0.4]}\'')
        sp.add_argument("--lens", type=float, default=50.0)
        sp.add_argument("--blend", default=None, help="save a .blend here")
        sp.add_argument("--preset", default="draft", help="thumb | draft | preview | final")
        sp.add_argument("--no-outline", action="store_true")
        sp.add_argument("--threads", type=int, default=0)
        return sp

    c = common(sub.add_parser("character", help="build + rig a character, render a turnaround still"))
    c.add_argument("--still", default="renders/character.png")

    d = common(sub.add_parser("demo", help="build, rig, animate the six-beat snap demo, render"))
    d.add_argument("--fps", type=int, default=24)
    d.add_argument("--video", default="renders/snap_demo.mp4")
    d.add_argument("--frames", default=None, help="also write a PNG sequence here")
    d.add_argument("--contact-sheet", default=None, help="render only these frames, e.g. 1,18,21,23,27,60")
    d.add_argument("--no-render", action="store_true", help="author the animation, skip rendering")

    e = common(sub.add_parser("export", help="build, animate and export GLB for an engine"))
    e.add_argument("--glb", default="renders/toon_character.glb")
    return p


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if "--" in argv:                     # blender --python script.py -- args
        argv = argv[argv.index("--") + 1:]
    args = _parser().parse_args(argv)

    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if here not in sys.path:
        sys.path.insert(0, here)

    from toonkit import render as render_mod
    from toonkit.scene import build_scene
    from toonkit.shots import snap_demo

    overrides = json.loads(args.colors) if args.colors else None
    ctx = build_scene(palette=args.palette, colour_overrides=overrides, lens=args.lens)
    render_mod.configure(preset=args.preset, outline=not args.no_outline,
                         threads=args.threads)

    if args.command == "character":
        if args.blend:
            render_mod.save_blend(args.blend)
        os.makedirs(os.path.dirname(os.path.abspath(args.still)) or ".", exist_ok=True)
        render_mod.render_still(os.path.abspath(args.still))
        print("character still ->", args.still)
        return 0

    beats = snap_demo(ctx, fps=args.fps)
    print("beat sheet:", json.dumps(beats))
    if args.blend:
        render_mod.save_blend(args.blend)

    if args.command == "export":
        render_mod.export_glb(args.glb)
        print("exported ->", args.glb)
        return 0

    if args.no_render:
        return 0

    if args.contact_sheet:
        for frame in [int(f) for f in args.contact_sheet.split(",")]:
            path = "renders/beat_%03d.png" % frame
            render_mod.render_still(os.path.abspath(path), frame=frame)
            print("beat frame ->", path)
        return 0

    if args.frames:
        render_mod.output_frames(args.frames)
        render_mod.render_animation()
        print("frames ->", args.frames)

    render_mod.output_video(os.path.abspath(args.video))
    render_mod.render_animation()
    print("video ->", args.video)
    return 0
