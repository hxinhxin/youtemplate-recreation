"""Общи помощни функции: материали, мрежа, скелет."""
import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler

RED   = (0.520, 0.028, 0.032, 1)
BLUE  = (0.018, 0.082, 0.400, 1)
BLACK = (0.012, 0.012, 0.015, 1)
WHITE = (0.900, 0.920, 0.950, 1)

M_RED, M_BLUE, M_BLACK, M_WHITE = 0, 1, 2, 3


# ---------------------------------------------------------------- материали
def _principled(name, color, rough=0.42, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = spec
    return m


def make_materials():
    """Червено и синьо с процедурни черни паяжинни линии."""
    mats = []
    for name, col, webbed in (("Suit_Red", RED, True),
                              ("Suit_Blue", BLUE, True),
                              ("Suit_Black", BLACK, False),
                              ("Lens_White", WHITE, False)):
        m = _principled(name, col, rough=0.38 if webbed else 0.30)
        if webbed:
            nt = m.node_tree
            bsdf = nt.nodes["Principled BSDF"]
            tex = nt.nodes.new("ShaderNodeTexCoord")
            vor = nt.nodes.new("ShaderNodeTexVoronoi")
            vor.feature = 'DISTANCE_TO_EDGE'
            vor.inputs["Scale"].default_value = 20.0
            ramp = nt.nodes.new("ShaderNodeValToRGB")
            ramp.color_ramp.elements[0].position = 0.00
            ramp.color_ramp.elements[0].color = BLACK
            ramp.color_ramp.elements[1].position = 0.040
            ramp.color_ramp.elements[1].color = col
            nt.links.new(tex.outputs["Object"], vor.inputs["Vector"])
            nt.links.new(vor.outputs["Distance"], ramp.inputs["Fac"])
            nt.links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        mats.append(m)
    return mats


# ------------------------------------------------------------------- мрежа
def _mat_between(p0, p1, r0, r1):
    """Матрица, ориентираща примитив от p0 към p1 (примитивите сочат по +Z)."""
    p0, p1 = Vector(p0), Vector(p1)
    d = p1 - p0
    ln = d.length or 1e-6
    quat = d.to_track_quat('Z', 'Y')
    return (Matrix.Translation((p0 + p1) / 2) @ quat.to_matrix().to_4x4()
            @ Matrix.Diagonal((1, 1, 1, 1))), ln


def add_capsule(bm, p0, p1, r0, r1, mat=0, seg=16):
    """Пресечен конус със сферични капачки в двата края."""
    mtx, ln = _mat_between(p0, p1, r0, r1)
    pre = set(bm.faces)
    bmesh.ops.create_cone(bm, cap_ends=True, cap_tris=False, segments=seg,
                          radius1=r0, radius2=r1, depth=ln, matrix=mtx)
    for p, r in ((p0, r0), (p1, r1)):
        bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2,
                                  radius=r, matrix=Matrix.Translation(p))
    for f in bm.faces:
        if f not in pre:
            f.material_index = mat


def add_blob(bm, loc, scale, mat=0, rot=(0, 0, 0), seg=20):
    """Елипсоид."""
    mtx = (Matrix.Translation(loc) @ Euler(rot).to_matrix().to_4x4()
           @ Matrix.Diagonal((*scale, 1)))
    pre = set(bm.faces)
    bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=seg // 2,
                              radius=1.0, matrix=mtx)
    for f in bm.faces:
        if f not in pre:
            f.material_index = mat


def new_mesh_object(name, build_fn, mats, collection=None):
    me = bpy.data.mesh.new(name) if hasattr(bpy.data, 'mesh') else bpy.data.meshes.new(name)
    bm = bmesh.new()
    build_fn(bm)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    for m in mats:
        ob.data.materials.append(m)
    (collection or bpy.context.scene.collection).objects.link(ob)
    for p in ob.data.polygons:
        p.use_smooth = True
    return ob


# ------------------------------------------------------------------ скелет
def aim_bone(pb, direction, twist=0.0):
    """Насочва костта по `direction` с МИНИМАЛНА ротация спрямо rest позата.

    Построяването на произволен ортонормален репер внася нежелан roll
    (главата се завърташе на 180 градуса), затова тук се използва
    rotation_difference от rest посоката."""
    d = Vector(direction).normalized()
    rest3 = pb.bone.matrix_local.to_3x3()
    y_rest = Vector(rest3.col[1]).normalized()
    q = y_rest.rotation_difference(d)
    m3 = q.to_matrix() @ rest3
    if twist:
        m3 = m3 @ Matrix.Rotation(twist, 3, 'Y')
    M = m3.to_4x4()
    M.translation = pb.matrix.translation
    pb.matrix = M
    bpy.context.view_layer.update()
