"""One call that assembles a complete, animation-ready toon scene."""

from . import lighting, materials
from .camera import CameraRig
from .character import build_character
from .core import reset_scene
from .rig import bind, build_rig


def build_scene(palette="mango", colour_overrides=None, fps=24,
                lens=50.0, lights=True, ground=True, clean=True):
    """Return a dict with `scene`, `body`, `rig`, `mats`, `cam`."""
    scene = reset_scene() if clean else None
    body, mats = build_character(palette=palette, colour_overrides=colour_overrides)
    armature = build_rig()
    bind(body, armature)

    cam = CameraRig(lens=lens)
    if lights:
        lighting.toon_lighting()
    if ground:
        lighting.ground_plane(mats["ground"])
    if scene is not None:
        scene.render.fps = fps
    return {"scene": scene, "body": body, "rig": armature, "mats": mats, "cam": cam,
            "palette": materials.PALETTES.get(palette, {})}
