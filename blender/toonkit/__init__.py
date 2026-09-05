"""toonkit — build, rig, animate, light and render stylized cartoon characters
in Blender from a headless Python session.

Typical use::

    from toonkit import build_scene
    scene = build_scene(palette="mint")

or, module by module::

    from toonkit import character, rig, anim, camera, lighting, render
"""

from . import anim, camera, character, core, lighting, materials, render, rig  # noqa: F401
from .scene import build_scene  # noqa: F401

__version__ = "1.0.0"
