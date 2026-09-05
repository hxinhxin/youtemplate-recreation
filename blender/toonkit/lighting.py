"""Three-point setup tuned for flat toon shading (bright key, soft fill, rim)."""

import bpy

from .core import link


def toon_lighting(strength=1.0, world_colour=(0.72, 0.80, 0.95), ambient=0.35):
    world = bpy.data.worlds.new("WRL_Toon")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value = tuple(world_colour) + (1.0,)
    bg.inputs["Strength"].default_value = ambient

    lights = []
    for name, kind, energy, loc, rot, size in (
        ("KEY", 'AREA', 520 * strength, (3.2, -4.4, 5.2), (0.9, 0.25, 0.7), 4.0),
        ("FILL", 'AREA', 180 * strength, (-4.2, -3.4, 2.4), (1.3, 0.0, -0.9), 5.0),
        ("RIM", 'AREA', 420 * strength, (-1.6, 4.6, 3.6), (-1.1, 0.0, -0.4), 3.0),
    ):
        data = bpy.data.lights.new("LGT_%s" % name, type=kind)
        data.energy = energy
        data.size = size
        obj = bpy.data.objects.new("LGT_%s" % name, data)
        obj.location = loc
        obj.rotation_euler = rot
        link(obj, "COL_Lights")
        lights.append(obj)
    return lights


def ground_plane(material, size=40.0):
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, 0))
    plane = bpy.context.active_object
    plane.name = "GEO_Ground"
    plane.data.materials.append(material)
    link(plane, "COL_Set")
    return plane
