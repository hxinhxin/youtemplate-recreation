"""Зарежда готовия production модел (FBX) и го подготвя за сцената.

Моделът идва от Maya/Daz: 9 006 върха, 8 894 квада, 3 UV слоя, 47-костен
скелет с готово скиниране и PBR текстури. Тук се закачат текстурите,
поправя се осевата система и се дава контролер за анимацията.
"""
import bpy, os, math
from mathutils import Vector, Quaternion, Matrix

ASSETS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets')
FBX = os.path.join(ASSETS, 'spiderman.fbx')

# Костите на Maya рига -> имената, с които работи анимацията
BONE_MAP = {
    'hips': 'Root_M', 'spine': 'Spine1_M', 'chest': 'joint3_M',
    'neck': 'joint4_M', 'head': 'Head_M',
    'shoulder.L': None, 'shoulder.R': None,        # ригът няма ключица
    'upperarm.L': 'joint8_L', 'forearm.L': 'joint9_L', 'hand.L': 'joint10_L',
    'upperarm.R': 'joint8_R', 'forearm.R': 'joint9_R', 'hand.R': 'joint10_R',
    'thigh.L': 'joint5_L', 'shin.L': 'joint6_L', 'foot.L': 'joint7_L', 'toe.L': 'joint11_L',
    'thigh.R': 'joint5_R', 'shin.R': 'joint6_R', 'foot.R': 'joint7_R', 'toe.R': 'joint11_R',
}
# пръсти: 1=палец 2=показалец 3=среден 4=безименен 5=кутре
_FING = {1: (34, 35, None), 2: (30, 31, 32), 3: (26, 27, 28),
         4: (22, 23, 24), 5: (18, 19, 20)}
for _s in 'LR':
    for _i, _js in _FING.items():
        for _k, _j in enumerate(_js):
            BONE_MAP[f'f{_i}_{_k + 1}.{_s}'] = None if _j is None else f'joint{_j}_{_s}'


# Ставите на Maya нямат дължина; при внос Blender им измисля опашки, затова
# посоката глава->опашка НЕ е оста на крайника. За всяка кост пазим коя
# следваща става дефинира истинската ѝ ос.
AXIS_CHILD = {
    'hips': 'Spine1_M', 'spine': 'joint3_M', 'chest': 'joint4_M',
    'neck': 'Head_M', 'head': None,
}
for _s in 'LR':
    AXIS_CHILD.update({
        f'upperarm.{_s}': f'joint9_{_s}', f'forearm.{_s}': f'joint10_{_s}',
        f'hand.{_s}': f'joint26_{_s}',            # китка -> основа на средния пръст
        f'thigh.{_s}': f'joint6_{_s}', f'shin.{_s}': f'joint7_{_s}',
        f'foot.{_s}': f'joint11_{_s}', f'toe.{_s}': None,
    })
    for _i, _js in _FING.items():
        for _k in range(3):
            nxt = _js[_k + 1] if _k + 1 < 3 and _js[_k + 1] else None
            AXIS_CHILD[f'f{_i}_{_k + 1}.{_s}'] = f'joint{nxt}_{_s}' if nxt else None


def rest_axis(rig, bone_name, child_name):
    """Оста на костта в rest, в пространството на армейчъра."""
    b = rig.data.bones.get(bone_name)
    c = rig.data.bones.get(child_name) if child_name else None
    if b is None:
        return None
    if c is not None:
        v = c.head_local - b.head_local
        if v.length > 1e-6:
            return v.normalized()
    return (b.tail_local - b.head_local).normalized()


def aim_joint(pb, rest_dir, target_dir, twist=0.0):
    """Върти костта така, че СТАВНАТА ѝ ос да легне по target_dir.

    aim_bone подравняваше Y (глава->опашка), което при този риг е случайна
    посока и мачкаше позата. `twist` върти около самата ос — минималната
    ротация оставя ролът произволен и подметката гледаше към камерата.
    """
    q = rest_dir.rotation_difference(target_dir)
    m3 = q.to_matrix() @ pb.bone.matrix_local.to_3x3()
    if twist:
        m3 = Matrix.Rotation(twist, 3, target_dir) @ m3
    m = m3.to_4x4()
    m.translation = pb.matrix.translation
    pb.matrix = m
    bpy.context.view_layer.update()


def finger_bend_axis(rig, side):
    """Оста на сгъване на пръстите — перпендикуляр на дланта."""
    idx = rig.data.bones.get(f'joint30_{side}')
    pky = rig.data.bones.get(f'joint18_{side}')
    wri = rig.data.bones.get(f'joint10_{side}')
    mid = rig.data.bones.get(f'joint26_{side}')
    if not all((idx, pky, wri, mid)):
        return Vector((1, 0, 0))
    spread = (idx.head_local - pky.head_local).normalized()
    along = (mid.head_local - wri.head_local).normalized()
    ax = along.cross(spread)
    return ax.normalized() if ax.length > 1e-6 else Vector((1, 0, 0))


def _pbr_material():
    """Principled с картите от доставчика на модела."""
    m = bpy.data.materials.new('SpideySuit')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']

    def tex(fname, colorspace, x, y):
        path = os.path.join(ASSETS, fname)
        if not os.path.exists(path):
            return None
        img = bpy.data.images.load(path, check_existing=True)
        img.colorspace_settings.name = colorspace
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = img
        n.location = (x, y)
        return n

    base = tex('tex_basecolor.png', 'sRGB', -900, 300)
    rough = tex('tex_roughness.png', 'Non-Color', -900, 0)
    ao = tex('tex_ao.png', 'Non-Color', -900, -300)
    nrm = tex('tex_normal.png', 'Non-Color', -900, -600)

    if base:
        if ao:
            # AO се вмъква меко в албедото, не се налага директно
            mix = nt.nodes.new('ShaderNodeMixRGB')
            mix.blend_type = 'MULTIPLY'
            mix.inputs['Fac'].default_value = 0.35
            mix.location = (-560, 300)
            nt.links.new(base.outputs['Color'], mix.inputs[1])
            nt.links.new(ao.outputs['Color'], mix.inputs[2])
            nt.links.new(mix.outputs['Color'], b.inputs['Base Color'])
        else:
            nt.links.new(base.outputs['Color'], b.inputs['Base Color'])
    if rough:
        nt.links.new(rough.outputs['Color'], b.inputs['Roughness'])
    if nrm:
        nm = nt.nodes.new('ShaderNodeNormalMap')
        nm.location = (-560, -600)
        nm.inputs['Strength'].default_value = 1.0
        nt.links.new(nrm.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])

    b.inputs['Metallic'].default_value = 0.0
    if 'Specular IOR Level' in b.inputs:
        b.inputs['Specular IOR Level'].default_value = 0.55
    for name, val in (('Coat Weight', 0.20), ('Coat Roughness', 0.22),
                      ('Sheen Weight', 0.14), ('Sheen Roughness', 0.40)):
        if name in b.inputs:
            b.inputs[name].default_value = val
    return m


def load_character():
    """Внася FBX-а, връща (контролер, армейчър, мрежа, axis-кватернион).

    Файлът е Y-up в сантиметри; конверсията седи в матрицата на обекта.
    Вместо да я прилагам разрушително върху скинирана мрежа, я запазвам и
    превеждам посоките на позите през нея.
    """
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=FBX)
    new = [o for o in bpy.data.objects if o not in before]

    rig = next(o for o in new if o.type == 'ARMATURE')
    mesh = next(o for o in new if o.type == 'MESH')
    mesh.name, mesh.data.name = 'Spidey_Body', 'Spidey_Body'
    rig.name = 'Spidey_Rig'

    mesh.data.materials.clear()
    mesh.data.materials.append(_pbr_material())
    for p in mesh.data.polygons:
        p.use_smooth = True
    sub = mesh.modifiers.new('Subdiv', 'SUBSURF')
    sub.levels, sub.render_levels = 0, 1
    for md in mesh.modifiers:
        if md.type == 'ARMATURE':
            md.use_deform_preserve_volume = True

    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'

    # осевата корекция, през която минават посоките на позите
    axis = rig.matrix_world.to_quaternion()

    # стъпалата на нула, после всичко под един контролер
    bpy.context.view_layer.update()
    zs = [(mesh.matrix_world @ v.co).z for v in mesh.data.vertices]
    lift = -min(zs)

    ctrl = bpy.data.objects.new('Spidey_CTRL', None)
    ctrl.empty_display_size = 0.4
    bpy.context.scene.collection.objects.link(ctrl)
    for o in new:
        if o.parent is None:
            o.parent = ctrl
            o.matrix_parent_inverse = Matrix.Translation((0, 0, lift))
    ctrl['lift'] = lift
    return ctrl, rig, mesh, axis

