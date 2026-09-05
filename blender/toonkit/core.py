"""Scene-level helpers shared by every toonkit module."""

import math

import bpy
from mathutils import Vector

Z = Vector((0.0, 0.0, 1.0))


def reset_scene():
    """Wipe the startup file down to an empty scene with sane units."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = 'METRIC'
    scene.frame_start = 1
    scene.frame_end = 72
    scene.render.fps = 24
    return scene


def link(obj, collection_name):
    """Move obj into a named collection, creating it on first use."""
    coll = bpy.data.collections.get(collection_name)
    if coll is None:
        coll = bpy.data.collections.new(collection_name)
        bpy.context.scene.collection.children.link(coll)
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)
    return obj


def deselect_all():
    for obj in bpy.context.scene.objects:
        obj.select_set(False)
    bpy.context.view_layer.objects.active = None


def activate(obj):
    deselect_all()
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    return obj


def sphere(name, location, radius=1.0, scale=(1, 1, 1), segments=24, rings=14):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=radius, location=location, segments=segments, ring_count=rings)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    bpy.ops.object.shade_smooth()
    return obj


def capsule(name, head, tail, r1, r2=None, verts=16):
    """A tapered limb segment running from `head` to `tail` (world space)."""
    r2 = r1 if r2 is None else r2
    head, tail = Vector(head), Vector(tail)
    direction = tail - head
    depth = direction.length
    bpy.ops.mesh.primitive_cone_add(
        vertices=verts, radius1=r1, radius2=r2, depth=depth,
        location=(head + tail) / 2.0)
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_mode = 'QUATERNION'
    obj.rotation_quaternion = Z.rotation_difference(direction.normalized())
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.ops.object.shade_smooth()
    # round the caps so joints read as ball sockets
    for radius, at in ((r1, head), (r2, tail)):
        cap = sphere(name + "_cap", at, radius=radius, segments=verts, rings=8)
        join([obj, cap], obj)
    return obj


def join(objects, active):
    deselect_all()
    for o in objects:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active
    bpy.ops.object.join()
    return active


def rad(degrees):
    return math.radians(degrees)
