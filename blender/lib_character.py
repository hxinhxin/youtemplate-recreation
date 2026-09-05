"""Изграждане на героя: мрежа, скелет, ръце/очи/емблема, скиниране."""
import bpy, bmesh, math
from mathutils import Vector, Matrix, Euler
from lib_build import (add_capsule, add_blob, new_mesh_object,
                       M_RED, M_BLUE, M_BLACK, M_WHITE)

# ключови точки на тялото (rest поза, изправен, лице към -Y)
J = {
    'hips':      Vector((0.000, 0, 1.020)),
    'spine':     Vector((0.000, 0, 1.230)),
    'chest':     Vector((0.000, 0, 1.430)),
    'neck':      Vector((0.000, 0, 1.680)),
    'head':      Vector((0.000, 0, 1.790)),
    'head_top':  Vector((0.000, 0, 2.060)),
    'sh.L':      Vector((0.085, 0, 1.640)),
    'sh.R':      Vector((-0.085, 0, 1.640)),
    'arm.L':     Vector((0.215, 0, 1.630)),  'arm.R':  Vector((-0.215, 0, 1.630)),
    'elb.L':     Vector((0.560, 0, 1.630)),  'elb.R':  Vector((-0.560, 0, 1.630)),
    'wri.L':     Vector((0.880, 0, 1.630)),  'wri.R':  Vector((-0.880, 0, 1.630)),
    'hnd.L':     Vector((1.030, 0, 1.630)),  'hnd.R':  Vector((-1.030, 0, 1.630)),
    'hip.L':     Vector((0.115, 0, 1.010)),  'hip.R':  Vector((-0.115, 0, 1.010)),
    'kne.L':     Vector((0.135, 0, 0.570)),  'kne.R':  Vector((-0.135, 0, 0.570)),
    'ank.L':     Vector((0.140, 0, 0.135)),  'ank.R':  Vector((-0.140, 0, 0.135)),
    'toe.L':     Vector((0.140, -0.190, 0.055)), 'toe.R': Vector((-0.140, -0.190, 0.055)),
}


# --------------------------------------------------------------- тяло
def _body(bm):
    # торс — верига от елипсоиди, червено горе, синьо долу
    add_blob(bm, (0, 0, 1.555), (0.225, 0.140, 0.155), M_RED)      # гърди
    add_blob(bm, (0, 0, 1.405), (0.180, 0.120, 0.140), M_RED)
    add_blob(bm, (0, 0, 1.250), (0.132, 0.094, 0.125), M_BLUE)     # кръст
    add_blob(bm, (0, 0, 1.075), (0.170, 0.115, 0.130), M_BLUE)     # таз
    add_capsule(bm, J['neck'], J['head'], 0.062, 0.070, M_RED)
    add_blob(bm, (0, -0.014, 1.895), (0.143, 0.156, 0.166), M_RED)  # глава

    for s in (1, -1):
        sfx = 'L' if s > 0 else 'R'
        add_blob(bm, J['sh.' + sfx] + Vector((0.055 * s, 0, 0.02)),
                 (0.105, 0.100, 0.098), M_RED)
        add_capsule(bm, J['arm.' + sfx], J['elb.' + sfx], 0.090, 0.064, M_RED)
        add_capsule(bm, J['elb.' + sfx], J['wri.' + sfx], 0.062, 0.048, M_RED)
        add_blob(bm, J['hip.' + sfx], (0.098, 0.098, 0.098), M_BLUE)
        add_capsule(bm, J['hip.' + sfx], J['kne.' + sfx], 0.115, 0.078, M_BLUE)
        add_capsule(bm, J['kne.' + sfx], J['ank.' + sfx], 0.078, 0.055, M_BLUE)
        # ботуш
        add_capsule(bm, J['ank.' + sfx] + Vector((0, 0, 0.02)),
                    J['toe.' + sfx], 0.070, 0.052, M_RED)
        add_blob(bm, J['ank.' + sfx] + Vector((0, 0.045, 0.03)),
                 (0.070, 0.055, 0.075), M_RED)


# --------------------------------------------------------------- длани
def _hand(bm, gesture):
    """Длан в локални координати; китката е в началото, пръстите по +X."""
    add_blob(bm, (0.055, 0, 0), (0.072, 0.038, 0.062), M_RED)     # длан
    # (ъгъл_разперване, наклон, дължина, свит?)
    if gesture == 'open':          # разперени пръсти
        fingers = [(0.52, 0.30, 0.135), (0.20, 0.42, 0.150),
                   (-0.10, 0.40, 0.142), (-0.42, 0.28, 0.120)]
        thumb = (1.05, -0.35, 0.100)
    else:                          # "thwip" — среден и безименен свити
        fingers = [(0.46, 0.34, 0.130), (0.10, 0.10, 0.062),
                   (-0.14, 0.06, 0.058), (-0.50, 0.26, 0.115)]
        thumb = (1.15, -0.50, 0.105)
    for yaw, pitch, ln in fingers:
        base = Vector((0.115, math.sin(yaw) * 0.052, math.sin(pitch) * 0.030))
        d = Vector((math.cos(yaw) * math.cos(pitch), math.sin(yaw), math.sin(pitch)))
        add_capsule(bm, base, base + d * ln, 0.021, 0.016, M_RED, seg=10)
    yaw, pitch, ln = thumb
    base = Vector((0.045, math.sin(yaw) * 0.055, math.sin(pitch) * 0.035))
    d = Vector((math.cos(yaw) * 0.7, math.sin(yaw), math.sin(pitch)))
    add_capsule(bm, base, base + d.normalized() * ln, 0.025, 0.019, M_RED, seg=10)


# --------------------------------------------------------------- лице
def _face(bm):
    """Очни лещи + черен контур, в локални координати на главата."""
    for s in (1, -1):
        rot = (0, 0, -0.42 * s)
        add_blob(bm, (0.066 * s, -0.146, 0.012), (0.078, 0.038, 0.047), M_BLACK, rot=rot)
        add_blob(bm, (0.066 * s, -0.162, 0.013), (0.066, 0.032, 0.037), M_WHITE, rot=rot)


def _emblem(bm):
    """Паякът на гърдите, в локални координати на гръдния кош."""
    add_blob(bm, (0, -0.128, 0.045), (0.030, 0.012, 0.052), M_BLACK)
    for s in (1, -1):
        for k, (dz, dx) in enumerate(((0.045, 0.075), (0.012, 0.088), (-0.022, 0.080))):
            add_capsule(bm, (0.012 * s, -0.126, 0.045),
                        (dx * s, -0.118, 0.045 + dz), 0.008, 0.005, M_BLACK, seg=6)


# --------------------------------------------------------------- скелет
BONES = [
    # име,        head,        tail,          parent,     connect, deform
    ('root',      (0, 0, 0),   (0, -0.35, 0), None,       False, False),
    ('hips',      J['hips'],   J['spine'],    'root',     False, True),
    ('spine',     J['spine'],  J['chest'],    'hips',     True,  True),
    ('chest',     J['chest'],  J['neck'],     'spine',    True,  True),
    ('neck',      J['neck'],   J['head'],     'chest',    True,  True),
    ('head',      J['head'],   J['head_top'], 'neck',     True,  True),
]
for _s, _x in (('L', 1), ('R', -1)):
    BONES += [
        (f'shoulder.{_s}', J['chest'] + Vector((0.02 * _x, 0, 0.19)), J[f'arm.{_s}'], 'chest', False, True),
        (f'upperarm.{_s}', J[f'arm.{_s}'], J[f'elb.{_s}'], f'shoulder.{_s}', True, True),
        (f'forearm.{_s}',  J[f'elb.{_s}'], J[f'wri.{_s}'], f'upperarm.{_s}', True, True),
        (f'hand.{_s}',     J[f'wri.{_s}'], J[f'hnd.{_s}'], f'forearm.{_s}',  True, True),
        (f'thigh.{_s}',    J[f'hip.{_s}'], J[f'kne.{_s}'], 'hips',           False, True),
        (f'shin.{_s}',     J[f'kne.{_s}'], J[f'ank.{_s}'], f'thigh.{_s}',    True, True),
        (f'foot.{_s}',     J[f'ank.{_s}'], J[f'toe.{_s}'], f'shin.{_s}',     True, True),
    ]


def build_armature():
    arm = bpy.data.armatures.new('SpideyRig')
    ob = bpy.data.objects.new('Spidey_Rig', arm)
    bpy.context.scene.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.mode_set(mode='EDIT')
    made = {}
    for name, h, t, par, conn, deform in BONES:
        b = arm.edit_bones.new(name)
        b.head, b.tail = Vector(h), Vector(t)
        b.use_deform = deform
        if par:
            b.parent = made[par]
            b.use_connect = conn
        made[name] = b
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in ob.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    return ob


# --------------------------------------------------------------- сглобяване
def _paint_regions(ob):
    """След воксел-ремеша материалните индекси се губят -> раздаваме ги по позиция."""
    for poly in ob.data.polygons:
        c = poly.center
        if c.z < 0.215:                       # ботуши
            poly.material_index = M_RED
        elif c.z < 1.335:                     # крака, таз, корем
            poly.material_index = M_BLUE
        else:                                 # гърди, рамене, ръце, глава
            poly.material_index = M_RED


def build_character(mats):
    body = new_mesh_object('Spidey_Body', _body, mats)
    bpy.context.view_layer.objects.active = body
    body.select_set(True)
    # воксел-ремеш: слива застъпените примитиви в една затворена повърхност,
    # иначе автоматичните тегла дават разкъсани крайници
    body.data.remesh_voxel_size = 0.021
    body.data.remesh_voxel_adaptivity = 0.0
    bpy.ops.object.voxel_remesh()
    bpy.ops.object.shade_smooth()
    _paint_regions(body)
    body.select_set(False)

    rig = build_armature()

    # скиниране с автоматични тегла
    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    try:
        bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    except Exception as e:
        print('  auto weights failed -> envelope:', e)
        bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
    bpy.ops.object.select_all(action='DESELECT')

    # Corrective Smooth трябва да е ПРЕДИ Subsurf (иска оригиналния брой върхове)
    cs = body.modifiers.new('Smooth', 'CORRECTIVE_SMOOTH')
    cs.factor = 0.55
    cs.iterations = 10
    sub = body.modifiers.new('Subdiv', 'SUBSURF')
    sub.levels = 0
    sub.render_levels = 1

    # твърдо закачени части (без деформация)
    rigid = []
    for tag, gesture, bone, sx in (('L', 'thwip', 'hand.L', 1), ('R', 'open', 'hand.R', -1)):
        ob = new_mesh_object(f'Hand_{tag}', lambda bm, g=gesture: _hand(bm, g), mats)
        if sx < 0:                       # огледално в mesh-а, не през object scale
            for v in ob.data.vertices:
                v.co.x = -v.co.x
            for pl in ob.data.polygons:
                pl.flip()
            ob.data.update()
        rigid.append((ob, bone, Vector(J[f'wri.{tag}'])))
    rigid.append((new_mesh_object('Face', _face, mats), 'head', Vector((0, 0, 1.910))))
    rigid.append((new_mesh_object('Emblem', _emblem, mats), 'chest', Vector((0, 0, 1.520))))

    for ob, bone, origin in rigid:
        for v in ob.data.vertices:
            v.co += origin
        ob.parent = rig
        ob.parent_type = 'BONE'
        ob.parent_bone = bone
        ob.matrix_parent_inverse = (
            rig.matrix_world @ rig.pose.bones[bone].matrix
            @ Matrix.Translation((0, rig.pose.bones[bone].length, 0))).inverted()
        m = ob.modifiers.new('Subdiv', 'SUBSURF')
        m.levels, m.render_levels = 1, 2

    return rig, body, [o for o, _, _ in rigid]
