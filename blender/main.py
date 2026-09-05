"""Изгражда цялата сцена и анимацията, записва .blend."""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler, Quaternion

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_build import aim_bone
import lib_fbx as F

FPS, F_END = 30, 180
# ---- тайминг (кадри) -------------------------------------------------
F_CALM_END   = 34    # празен океан
F_ANTIC      = 38    # свива се под водата (anticipation)
F_BURST      = 42    # изстрелването
F_SURFACE    = 44    # пробива повърхността
F_EXTEND     = 50    # тялото е напълно изпънато като стрела
F_SPREAD     = 58    # краката се разтварят в широк ритник
F_APEX       = 64    # най-високата точка
F_WEB_A      = 67    # първи изстрел паяжина
F_WEB_B      = 73    # втори
F_TUCK       = 81    # коленете се прибират към гърдите
F_OVER       = 89    # overshoot отвъд позата
F_RECOIL     = 95    # откат
F_SETTLE     = 101   # позата е заключена
WATER_Z      = 0.0


# =====================================================================
# ПОЗИ — посоки на костите в световни координати (героят гледа към -Y,
# неговата дясна страна е -X = ляво на екрана)
# =====================================================================
POSE_TUCK = {                       # свит под водата
    'hips': (0, -0.62, 0.78), 'spine': (0, -0.48, 0.88), 'chest': (0, -0.32, 0.95),
    'head': (0, -0.18, 0.98),
    'upperarm.R': (-0.32, -0.42, -0.85), 'forearm.R': (-0.18, -0.90, 0.40),
    'upperarm.L': (0.32, -0.42, -0.85),  'forearm.L': (0.18, -0.90, 0.40),
    'thigh.R': (-0.22, -0.90, 0.38), 'shin.R': (-0.12, 0.60, -0.79),
    'foot.R': (-0.12, -0.50, -0.86),
    'thigh.L': (0.22, -0.90, 0.38),  'shin.L': (0.12, 0.60, -0.79),
    'foot.L': (0.12, -0.50, -0.86),
}

POSE_COIL = {                       # плътно свит точно преди изстрелването
    'hips': (0, -0.78, 0.63), 'spine': (0, -0.60, 0.80), 'chest': (0, -0.40, 0.92),
    'head': (0, -0.30, 0.95),
    'upperarm.R': (-0.28, -0.28, -0.92), 'forearm.R': (-0.14, -0.94, 0.31),
    'upperarm.L': (0.28, -0.28, -0.92),  'forearm.L': (0.14, -0.94, 0.31),
    'thigh.R': (-0.20, -0.95, 0.24), 'shin.R': (-0.10, 0.70, -0.71),
    'foot.R': (-0.10, -0.42, -0.90),
    'thigh.L': (0.20, -0.95, 0.24),  'shin.L': (0.10, 0.70, -0.71),
    'foot.L': (0.10, -0.42, -0.90),
}

POSE_ARROW = {                      # стрела: тяло изпънато, крака събрани, пръсти опънати
    'hips': (0, 0.02, 1.0), 'spine': (0, 0.01, 1.0), 'chest': (0, 0.0, 1.0),
    'neck': (0, 0.03, 1.0), 'head': (0, 0.06, 1.0),
    'upperarm.R': (-0.14, 0.05, 0.989), 'forearm.R': (-0.09, 0.02, 0.996),
    'hand.R': (-0.07, 0.0, 0.998),
    'upperarm.L': (0.14, 0.05, 0.989),  'forearm.L': (0.09, 0.02, 0.996),
    'hand.L': (0.07, 0.0, 0.998),
    'thigh.R': (-0.04, 0.03, -0.999), 'shin.R': (-0.02, 0.01, -1.0),
    'foot.R': (-0.02, -0.72, -0.69),                    # опънато ходило
    'thigh.L': (0.04, 0.03, -0.999),  'shin.L': (0.02, 0.01, -1.0),
    'foot.L': (0.02, -0.72, -0.69),
}

POSE_SPREAD = {                     # краката се разтварят широко, ръцете настрани
    'hips': (0, -0.20, 0.98), 'spine': (0, -0.09, 0.996), 'chest': (0.02, -0.05, 0.998),
    'neck': (0, -0.04, 0.999), 'head': (0, -0.02, 1.0),
    'upperarm.R': (-0.80, -0.26, 0.54), 'forearm.R': (-0.66, -0.36, 0.66),
    'hand.R': (-0.62, -0.40, 0.67),
    'upperarm.L': (0.80, -0.26, 0.54),  'forearm.L': (0.66, -0.36, 0.66),
    'hand.L': (0.62, -0.40, 0.67),
    'thigh.R': (-0.60, -0.32, -0.73), 'shin.R': (-0.46, -0.26, -0.85),
    'foot.R': (-0.42, -0.66, -0.62),
    'thigh.L': (0.60, -0.32, -0.73),  'shin.L': (0.46, -0.26, -0.85),
    'foot.L': (0.42, -0.66, -0.62),
}

POSE_WEB = {                        # изстрелване на паяжините напред
    'hips': (0.02, -0.28, 0.96), 'spine': (0.02, -0.14, 0.99), 'chest': (0.04, -0.07, 0.997),
    'neck': (0, -0.05, 0.999), 'head': (0, -0.03, 1.0),
    'upperarm.R': (-0.30, -0.88, 0.37), 'forearm.R': (-0.14, -0.97, 0.19),
    'hand.R': (-0.11, -0.98, 0.16),
    'upperarm.L': (0.38, -0.84, 0.39),  'forearm.L': (0.20, -0.95, 0.24),
    'hand.L': (0.16, -0.97, 0.18),
    'thigh.R': (-0.40, -0.62, -0.67), 'shin.R': (-0.20, 0.06, -0.98),
    'foot.R': (-0.38, -0.64, -0.67),
    'thigh.L': (0.44, -0.58, -0.69),  'shin.L': (0.18, 0.24, -0.95),
    'foot.L': (0.34, -0.62, -0.71),
}

POSE_TUCKIN = {                     # коленете се прибират към гърдите
    'hips': (0.04, -0.30, 0.95), 'spine': (0.03, -0.16, 0.987), 'chest': (0.06, -0.10, 0.993),
    'neck': (0.01, -0.06, 0.998), 'head': (0, -0.03, 1.0),
    'upperarm.R': (-0.60, -0.42, 0.68), 'forearm.R': (-0.52, -0.34, 0.78),
    'hand.R': (-0.50, -0.32, 0.80),
    'upperarm.L': (0.60, -0.60, -0.53), 'forearm.L': (0.22, -0.90, 0.38),
    'hand.L': (0.18, -0.92, 0.35),
    'thigh.R': (-0.62, -0.62, -0.48), 'shin.R': (-0.12, -0.10, -0.99),
    'foot.R': (-0.52, -0.58, -0.63),
    'thigh.L': (0.62, -0.52, 0.59),  'shin.L': (0.20, 0.32, 0.93),
    'foot.L': (-0.10, -0.62, 0.78),
}

POSE_FINAL = {                      # финалната поза от референцията
    'hips':  (0.06, -0.30, 0.952),
    'spine': (0.04, -0.17, 0.985),
    'chest': (0.08, -0.10, 0.992),
    'neck':  (0.01, -0.06, 0.998),
    'head':  (0.00, -0.02, 1.000),
    # дясна ръка — изпъната нагоре и встрани (ляво на екрана)
    'upperarm.R': (-0.72, -0.17, 0.672), 'forearm.R': (-0.62, -0.12, 0.775),
    'hand.R':     (-0.58, -0.10, 0.808),
    # ръката стои ПРЕД тялото: без силна -Y компонента мишницата потъва в
    # гръдния кош и скинирането слива двете в безформена маса
    'upperarm.L': (0.72, -0.42, -0.550), 'forearm.L': (0.10, -0.90, 0.42),
    'hand.L':     (0.05, -0.92, 0.39),
    # ляв крак — вдигнат високо, коляното силно свито (дясно на екрана)
    'thigh.L': (0.70, -0.25, 0.668), 'shin.L': (0.05, 0.20, 0.978),
    'foot.L': (-0.32, -0.22, 0.92), 'foot.L#twist': 1.55,
    # десен крак — бедрото напред, подбедрицата надолу-наляво
    'thigh.R': (-0.68, -0.48, -0.55), 'shin.R': (0.05, -0.18, -0.982),
    'foot.R': (-0.58, -0.52, -0.63),
}


def blend(a, b, t):
    """Междинна поза между две ключови — за плавни дъги на крайниците."""
    out = dict(a)
    for k, v in b.items():
        if k.endswith('#twist'):
            out[k] = a.get(k, 0.0) * (1 - t) + v * t
        elif k in a:
            out[k] = tuple(Vector(a[k]).normalized().lerp(
                Vector(v).normalized(), t).normalized())
        else:
            out[k] = v
    return out


def drift(pose, phase, amt=0.030):
    """Лек живот в задържането — крайниците не са замразени."""
    out = {}
    for i, (k, v) in enumerate(sorted(pose.items())):
        if k.endswith('#twist'):
            out[k] = v
            continue
        d = Vector(v).normalized()
        w = math.sin(phase + i * 1.7) * amt
        out[k] = tuple((d + Vector((w, w * 0.5, -w * 0.7))).normalized())
    return out


def exaggerate(pose, k):
    """Overshoot: избутва посоките малко по-нататък от неутралното."""
    out = {}
    for b, d in pose.items():
        if b.endswith('#twist'):
            out[b] = d
            continue
        v = Vector(d).normalized()
        n = Vector((0, 0, 1)) if 'thigh' not in b and 'shin' not in b and 'foot' not in b else Vector((0, 0, -1))
        out[b] = (v + (v - n) * k).normalized()[:]
    return out


ORDER = ['hips', 'spine', 'chest', 'neck', 'head',
         'shoulder.L', 'upperarm.L', 'forearm.L', 'hand.L',
         'shoulder.R', 'upperarm.R', 'forearm.R', 'hand.R',
         'thigh.L', 'shin.L', 'foot.L', 'toe.L',
         'thigh.R', 'shin.R', 'foot.R', 'toe.R']

# пръсти: 1=палец 2=показалец 3=среден 4=безименен 5=кутре
FINGERS = [f'f{i}_{s}.{t}' for t in 'LR' for i in range(1, 6) for s in range(1, 4)]

# свиване на фалангите в радиани за всеки жест
GRIP = {
    'open':  {1: (0.05, 0.05, 0.05), 2: (0.02, 0.02, 0.05), 3: (0.02, 0.03, 0.06),
              4: (0.04, 0.05, 0.08), 5: (0.08, 0.10, 0.12)},
    'thwip': {1: (0.10, 0.05, 0.05), 2: (0.00, 0.00, 0.02), 3: (1.35, 1.45, 1.20),
              4: (1.40, 1.50, 1.25), 5: (0.05, 0.05, 0.08)},
    'fist':  {1: (0.70, 0.60, 0.40), 2: (1.30, 1.45, 1.20), 3: (1.35, 1.50, 1.25),
              4: (1.35, 1.50, 1.25), 5: (1.30, 1.45, 1.20)},
}


_BEND_AXIS = {}


def apply_grip(rig, side, gesture, frame):
    """Свива фалангите около истинската ос на дланта.

    Ставите на Maya имат произволна ориентация, затова фиксирана локална X
    ос ги въртеше настрани вместо да ги свива.
    """
    g = GRIP[gesture]
    if side not in _BEND_AXIS:
        _BEND_AXIS[side] = F.finger_bend_axis(rig, side)
    ax_arm = _BEND_AXIS[side]
    for fi in range(1, 6):
        for seg in range(1, 4):
            pb = _pb(rig, f'f{fi}_{seg}.{side}')
            if pb is None:
                continue
            local = pb.bone.matrix_local.to_3x3().inverted() @ ax_arm
            pb.rotation_quaternion = Quaternion(local.normalized(), g[fi][seg - 1])
            pb.keyframe_insert('rotation_quaternion', frame=frame)


AXIS = None          # кватернионът на вносната ос; задава се от main()


def _pb(rig, name):
    """Име от анимацията -> pose bone на production рига."""
    real = F.BONE_MAP.get(name, name)
    return rig.pose.bones.get(real) if real else None


_REST_AXIS = {}


def apply_pose(rig, pose, frame):
    bpy.context.scene.frame_set(frame)
    inv = AXIS.inverted() if AXIS else None
    touched = []
    for name in ORDER:
        pb = _pb(rig, name)
        if pb is None:
            continue
        touched.append(pb)
        if name in pose and F.AXIS_CHILD.get(name):
            if name not in _REST_AXIS:
                _REST_AXIS[name] = F.rest_axis(
                    rig, F.BONE_MAP[name], F.AXIS_CHILD[name])
            d = Vector(pose[name])
            tw = pose.get(name + '#twist', 0.0)
            F.aim_joint(pb, _REST_AXIS[name],
                        (inv @ d if inv else d).normalized(), tw)
        else:
            pb.rotation_quaternion = (1, 0, 0, 0)
            bpy.context.view_layer.update()
    for pb in touched:
        pb.keyframe_insert('rotation_quaternion', frame=frame)


# =====================================================================
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, F_END
    sc.render.fps = FPS


def water_shader(name, deep=(0.004, 0.030, 0.055), rough=0.02):
    """Физически коректна вода: пропускане, IOR 1.33 и обемно поглъщане.

    Непрозрачният син материал изглеждаше като пластмаса; истинската
    рефракция е това, което прави кадъра CGI, а не илюстрация.
    """
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    out = nt.nodes['Material Output']
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (1, 1, 1, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['IOR'].default_value = 1.333
    if 'Transmission Weight' in b.inputs:
        b.inputs['Transmission Weight'].default_value = 1.0
    # обемно поглъщане -> дълбочината потъмнява естествено
    vol = nt.nodes.new('ShaderNodeVolumeAbsorption')
    vol.inputs['Color'].default_value = (*deep, 1)
    vol.inputs['Density'].default_value = 0.55
    nt.links.new(vol.outputs['Volume'], out.inputs['Volume'])
    return m, nt, b


def build_ocean():
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, WATER_Z))
    oc = bpy.context.object
    oc.name = 'Ocean'
    m = oc.modifiers.new('Ocean', 'OCEAN')
    m.spatial_size = 34
    m.resolution = 12
    m.wave_scale = 1.75
    m.wave_scale_min = 0.03
    m.choppiness = 1.5
    m.wind_velocity = 15.0
    m.random_seed = 7
    m.use_foam = True                  # реална пяна по гребените
    m.foam_coverage = 0.055
    m.foam_layer_name = 'foam'
    for f, t in ((1, 0.0), (F_END, F_END / FPS * 1.4)):
        m.time = t
        m.keyframe_insert('time', frame=f)
    for fc in oc.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    mat, nt, b = water_shader('Water')
    # пяната от модификатора се смесва като бяла разсейваща повърхност
    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'foam'
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[1].position = 0.72
    foam = nt.nodes.new('ShaderNodeBsdfDiffuse')
    foam.inputs['Color'].default_value = (0.92, 0.96, 1.0, 1)
    mix = nt.nodes.new('ShaderNodeMixShader')
    out = nt.nodes['Material Output']
    nt.links.new(ca.outputs['Color'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], mix.inputs['Fac'])
    nt.links.new(b.outputs['BSDF'], mix.inputs[1])
    nt.links.new(foam.outputs['BSDF'], mix.inputs[2])
    nt.links.new(mix.outputs['Shader'], out.inputs['Surface'])

    oc.data.materials.append(mat)
    for p in oc.data.polygons:
        p.use_smooth = True
    return oc


def build_interaction():
    """Кратер и разширяваща се вълна там, където тялото пробива водата.

    Mantaflow в този bpy build е счупен (Manta bindings крашват при bake),
    затова изместването на водата е геометрично: радиална вълнова функция,
    изпечена като shape keys, вместо частична физика.
    """
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=96, y_subdivisions=96,
                                    size=13, location=(0, 0, WATER_Z + 0.005))
    g = bpy.context.object
    g.name = 'WaterImpact'
    mat, nt, b = water_shader('ImpactWater', rough=0.04)
    g.data.materials.append(mat)
    for p in g.data.polygons:
        p.use_smooth = True

    # преди удара решетката не съществува за камерата (иначе се вижда
    # като тъмен правоъгълник върху океана)
    for f, hide in ((1, True), (F_BURST - 4, True), (F_BURST - 3, False), (F_END, False)):
        g.hide_render = g.hide_viewport = hide
        g.keyframe_insert('hide_render', frame=f)
        g.keyframe_insert('hide_viewport', frame=f)
    for fc in g.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'CONSTANT'

    base = [v.co.copy() for v in g.data.vertices]
    g.shape_key_add(name='rest', from_mix=False)
    import math as _m
    for f in range(F_BURST - 3, min(F_END, F_BURST + 60), 3):
        t = (f - F_BURST) / FPS
        key = g.shape_key_add(name=f'k{f}', from_mix=False)
        for i, co in enumerate(base):
            r = _m.hypot(co.x, co.y)
            if t <= 0:
                key.data[i].co.z = co.z
                continue
            # кратер, който се затваря + пръстеновидна вълна, която бяга навън
            crater = -1.9 * _m.exp(-(r / (0.75 + t * 2.6)) ** 2) * _m.exp(-t * 2.4)
            front = r - t * 6.2
            ring = 0.85 * _m.exp(-(front / 0.85) ** 2) * _m.cos(front * 2.6) \
                * _m.exp(-t * 0.85) / (1 + r * 0.28)
            key.data[i].co.z = co.z + crater + ring
        key.value = 0.0
        key.keyframe_insert('value', frame=f - 3)
        key.value = 1.0
        key.keyframe_insert('value', frame=f)
        key.value = 0.0
        key.keyframe_insert('value', frame=f + 3)
    return g


def build_splash():
    """Пръски, пяна и воден стълб — истински анимирани обекти."""
    objs = []

    # --- капката-инстанция ---
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.030,
                                          location=(0, 0, -50))
    drop = bpy.context.object
    drop.name = 'DropInstance'
    for _p in drop.data.polygons:
        _p.use_smooth = True
    wat, _, _ = water_shader('DropWater', deep=(0.05, 0.14, 0.20), rough=0.0)
    drop.data.materials.append(wat)
    drop.hide_render = True
    objs.append(drop)

    # --- емитер: полусфера, за да летят пръските нагоре ---
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.32, location=(0, 0, 0.06))
    em = bpy.context.object
    em.name = 'SplashEmitter'
    bm = bmesh.new(); bm.from_mesh(em.data)
    for f in list(bm.faces):
        if f.calc_center_median().z < 0.06:
            bm.faces.remove(f)
    bm.to_mesh(em.data); bm.free()
    em.show_instancer_for_render = False      # hide_render би скрил и частиците
    em.show_instancer_for_viewport = False

    ps = em.modifiers.new('Splash', 'PARTICLE_SYSTEM').particle_system
    s = ps.settings
    s.count = 2200
    s.frame_start, s.frame_end = F_BURST, F_BURST + 9
    s.lifetime, s.lifetime_random = 62, 0.6
    s.normal_factor = 11.0
    s.factor_random = 4.5
    s.object_align_factor[2] = 6.0
    s.particle_size, s.size_random = 0.42, 0.8
    s.render_type = 'OBJECT'
    s.instance_object = drop
    s.physics_type = 'NEWTON'
    s.mass, s.effector_weights.gravity = 0.6, 1.0
    s.use_rotations = True
    s.angular_velocity_mode = 'RAND'
    objs.append(em)

    # --- воден стълб ---
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=0.95, radius2=0.22,
                                    depth=2.1, location=(0, 0, 1.05))
    col = bpy.context.object
    col.name = 'WaterColumn'
    sm = col.modifiers.new('Sub', 'SUBSURF')
    sm.levels, sm.render_levels = 2, 2
    disp_tex = bpy.data.textures.new('ColumnNoise', 'CLOUDS')
    disp_tex.noise_scale = 0.42
    dm = col.modifiers.new('Rough', 'DISPLACE')      # след Subsurf, за да остане назъбен
    dm.texture = disp_tex
    dm.strength = 0.85
    dm.mid_level = 0.5
    cm, _, nb = water_shader('ColumnWater', deep=(0.08, 0.18, 0.24), rough=0.05)
    col.data.materials.append(cm)
    for p in col.data.polygons:
        p.use_smooth = True
    for f, sc, al in ((F_BURST - 1, (0.05, 0.05, 0.02), 0.0),
                      (F_BURST + 2, (1.10, 1.10, 1.05), 0.80),
                      (F_BURST + 5, (1.40, 1.40, 0.55), 0.45),
                      (F_BURST + 11, (1.8, 1.8, 0.05), 0.0)):
        col.scale = sc
        col.keyframe_insert('scale', frame=f)
        nb.inputs['Alpha'].default_value = al
        nb.inputs['Alpha'].keyframe_insert('default_value', frame=f)
    objs.append(col)

    # --- пръстен пяна ---
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.09,
                                     location=(0, 0, 0.04))
    ring = bpy.context.object
    ring.name = 'FoamRing'
    rm = bpy.data.materials.new('Foam')
    rm.use_nodes = True
    rb = rm.node_tree.nodes['Principled BSDF']
    rb.inputs['Base Color'].default_value = (0.92, 0.97, 1.0, 1)
    rb.inputs['Roughness'].default_value = 0.55
    rm.blend_method = 'BLEND'
    ring.data.materials.append(rm)
    for p in ring.data.polygons:
        p.use_smooth = True
    for f, sc, al in ((F_BURST - 1, (0.2, 0.2, 0.4), 0.0),
                      (F_BURST + 1, (0.8, 0.8, 1.0), 0.9),
                      (F_BURST + 30, (4.2, 4.2, 0.35), 0.35),
                      (F_END, (6.5, 6.5, 0.2), 0.0)):
        ring.scale = sc
        ring.keyframe_insert('scale', frame=f)
        rb.inputs['Alpha'].default_value = al
        rb.inputs['Alpha'].keyframe_insert('default_value', frame=f)
    objs.append(ring)

    # втора емисия: фина мъгла, която виси във въздуха дълго след удара
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.5, location=(0, 0, 0.9))
    mist = bpy.context.object
    mist.name = 'MistEmitter'
    mist.show_instancer_for_render = False
    ps2 = mist.modifiers.new('Mist', 'PARTICLE_SYSTEM').particle_system
    m2 = ps2.settings
    m2.count = 900
    m2.frame_start, m2.frame_end = F_BURST + 1, F_BURST + 16
    m2.lifetime, m2.lifetime_random = 90, 0.5
    m2.normal_factor = 3.2
    m2.factor_random = 2.2
    m2.object_align_factor[2] = 2.0
    m2.particle_size, m2.size_random = 0.30, 0.9
    m2.render_type = 'OBJECT'
    m2.instance_object = drop
    m2.physics_type = 'NEWTON'
    m2.mass = 0.12
    m2.effector_weights.gravity = 0.28          # мъглата пада бавно
    m2.use_rotations = True
    m2.angular_velocity_mode = 'RAND'
    objs.append(mist)
    return objs


def build_webs(rig):
    """Паяжини като криви, които наистина израстват от дланите."""
    webmat = bpy.data.materials.new('Web')
    webmat.use_nodes = True
    wb = webmat.node_tree.nodes['Principled BSDF']
    wb.inputs['Base Color'].default_value = (0.95, 0.97, 1.0, 1)
    wb.inputs['Roughness'].default_value = 0.35

    out = []
    # посоките са встрани от главата, за да не пресича паяжината лицето
    for tag, bone, tip, start in (('R', F.BONE_MAP['hand.R'], Vector((-7.0, -3.0, 6.5)), F_WEB_A),
                                  ('L', F.BONE_MAP['hand.L'], Vector((7.5, -3.5, 2.2)), F_WEB_B)):
        cu = bpy.data.curves.new(f'Web_{tag}', 'CURVE')
        cu.dimensions = '3D'
        cu.bevel_depth = 0.013
        cu.bevel_resolution = 2
        sp = cu.splines.new('BEZIER')
        sp.bezier_points.add(3)
        for i, pt in enumerate(sp.bezier_points):
            u = i / 3
            pt.co = tip * u + Vector((0, 0, math.sin(u * 3.1416) * 0.7))
            pt.handle_left_type = pt.handle_right_type = 'AUTO'
        ob = bpy.data.objects.new(f'Web_{tag}', cu)
        bpy.context.scene.collection.objects.link(ob)
        ob.data.materials.append(webmat)
        # Copy Location: дръжката стои в дланта, но посоката на изстрела
        # остава фиксирана в света (bone parenting я въртеше надолу)
        con = ob.constraints.new('COPY_LOCATION')
        con.target = rig
        con.subtarget = bone
        con.head_tail = 1.0
        for f, v in ((start - 1, 0.0), (start, 0.02), (start + 4, 1.0)):
            cu.bevel_factor_end = v
            cu.keyframe_insert('bevel_factor_end', frame=f)
        # и двете се прибират докрай по един и същи начин, без остатъчни чуканчета
        for f, v in ((F_WEB_B + 26, 0.0), (F_WEB_B + 40, 1.0)):
            cu.bevel_factor_start = v
            cu.keyframe_insert('bevel_factor_start', frame=f)
        out.append(ob)
    return out


def build_camera(rig):
    tgt = bpy.data.objects.new('CamTarget', None)
    bpy.context.scene.collection.objects.link(tgt)
    for f, loc in ((1, (0, 0, 0.5)), (F_CALM_END, (0, 0, 0.7)),
                   (F_BURST, (0, 0, 1.2)), (F_EXTEND, (0, 0, 3.6)),
                   (F_SPREAD, (0, 0, 5.1)), (F_APEX, (0, 0, 5.85)),
                   (F_TUCK, (0.06, 0, 5.45)),
                   (F_SETTLE, (0.08, 0, 5.25)), (F_END, (0.08, 0, 5.28))):
        tgt.location = loc
        tgt.keyframe_insert('location', frame=f)

    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.data.lens = 40
    cam.data.sensor_width = 36
    cam.data.dof.use_dof = True                  # киното иска дълбочина
    cam.data.dof.focus_object = tgt
    cam.data.dof.aperture_fstop = 4.5
    con = cam.constraints.new('TRACK_TO')
    con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'

    # При портретен кадър Blender ляга сензора (36 мм) по ВИСОЧИНАТА, значи
    # видимата височина = разстояние * 36 / фокус. Героят е 1.86 м.
    # При портретен кадър Blender ляга сензора (36 мм) по ВИСОЧИНАТА, значи
    # видимата височина = разстояние * 36 / фокус. Героят е 1.86 м.
    for f, loc, lens in ((1, (1.4, -13.5, 1.05), 30),
                         (F_CALM_END, (0.8, -12.6, 1.15), 32),
                         (F_BURST, (0.2, -11.2, 1.55), 38),
                         (F_SURFACE, (0.15, -9.8, 1.95), 42),
                         (F_EXTEND, (-0.1, -6.4, 3.20), 48),
                         (F_SPREAD, (-0.3, -5.9, 4.80), 50),
                         (F_APEX, (-0.45, -5.8, 5.50), 52),
                         (F_TUCK, (-0.6, -5.0, 5.30), 60),
                         (F_SETTLE, (-0.80, -4.95, 5.00), 62),
                         (F_END, (-0.90, -4.65, 5.03), 65)):
        cam.location = loc
        cam.keyframe_insert('location', frame=f)
        cam.data.lens = lens
        cam.data.keyframe_insert('lens', frame=f)

    # удар/тресене на камерата точно при изскачането
    cam.rotation_mode = 'XYZ'
    for i in range(3):
        cam.keyframe_insert('delta_rotation_euler', frame=1, index=i)
        cam.keyframe_insert('delta_rotation_euler', frame=F_END, index=i)
    for fc in cam.animation_data.action.fcurves:
        if fc.data_path != 'delta_rotation_euler':
            continue
        n = fc.modifiers.new('NOISE')
        n.scale = 1.6
        n.strength = 0.055
        n.phase = fc.array_index * 13.7
        n.use_restricted_range = True
        n.frame_start, n.frame_end = F_BURST, F_BURST + 22
        n.blend_in, n.blend_out = 1, 14
    return cam, tgt


def build_lights():
    w = bpy.context.scene.world or bpy.data.worlds.new('World')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes['Background']
    sky = nt.nodes.new('ShaderNodeTexSky')
    sky.sky_type = 'NISHITA'
    sky.sun_elevation = math.radians(6.5)
    sky.sun_rotation = math.radians(-38)
    sky.altitude = 200
    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 0.42

    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    bpy.context.scene.collection.objects.link(sun)
    sun.data.energy = 5.2
    sun.data.angle = math.radians(2.5)
    sun.data.color = (1.0, 0.86, 0.72)
    sun.rotation_euler = (math.radians(58), 0, math.radians(-42))

    fill = bpy.data.objects.new('Fill', bpy.data.lights.new('Fill', 'AREA'))
    bpy.context.scene.collection.objects.link(fill)
    fill.data.energy = 620
    fill.data.size = 9
    fill.data.color = (0.62, 0.78, 1.0)
    fill.location = (7.5, -9.0, 7.0)
    fill.rotation_euler = (math.radians(58), 0, math.radians(52))
    fill.visible_camera = False
    fill.visible_glossy = False

    rim = bpy.data.objects.new('Rim', bpy.data.lights.new('Rim', 'AREA'))
    bpy.context.scene.collection.objects.link(rim)
    rim.data.energy = 2100
    rim.data.size = 6
    rim.data.color = (1.0, 0.72, 0.45)
    rim.location = (-6.0, 6.5, 6.0)
    rim.rotation_euler = (math.radians(112), 0, math.radians(-140))
    rim.visible_camera = False
    rim.visible_glossy = False


def animate_body(rig):
    """Траектория на целия герой: coil -> взрив -> дъга -> заковаване."""
    rig.rotation_mode = 'XYZ'
    keys = [
        # кадър, z,     scale(x,y,z),        rot z
        (1,            -9.20, (1.00, 1.00, 1.00), 0.34),
        (F_CALM_END,   -8.70, (1.00, 1.00, 1.00), 0.28),
        (F_ANTIC,      -9.55, (1.14, 1.14, 0.82), 0.22),   # свива се
        (F_BURST,      -5.60, (0.72, 0.72, 1.58), 0.08),   # изстрелване
        (F_SURFACE,    -0.20, (0.70, 0.70, 1.66), 0.02),
        (F_EXTEND,      2.90, (0.82, 0.82, 1.34), -0.06),
        (F_SPREAD,      4.35, (0.96, 0.96, 1.06), -0.13),
        (F_APEX,        4.95, (1.04, 1.04, 0.95), -0.19),  # сплескване на върха
        (F_WEB_B,       4.72, (1.00, 1.00, 1.00), -0.24),
        (F_TUCK,        4.46, (0.98, 0.98, 1.03), -0.30),
        (F_OVER,        4.24, (0.96, 0.96, 1.05), -0.38),  # overshoot
        (F_RECOIL,      4.40, (1.03, 1.03, 0.97), -0.27),  # откат
        (F_SETTLE,      4.33, (1.00, 1.00, 1.00), -0.30),
        (F_END,         4.24, (1.00, 1.00, 1.00), -0.30),
    ]
    for f, z, sc, rz in keys:
        rig.location = (0, 0, z)
        rig.scale = sc
        rig.rotation_euler = (0, 0, rz)
        rig.keyframe_insert('location', frame=f)
        rig.keyframe_insert('scale', frame=f)
        rig.keyframe_insert('rotation_euler', frame=f)

    act = rig.animation_data.action
    for fc in act.fcurves:
        for kp in fc.keyframe_points:
            fr = kp.co.x
            if fr <= F_ANTIC:
                kp.interpolation = 'BEZIER'; kp.easing = 'EASE_IN_OUT'
            elif fr <= F_SURFACE:
                kp.interpolation = 'QUAD'; kp.easing = 'EASE_IN'      # взрив
            elif fr <= F_APEX:
                kp.interpolation = 'QUART'; kp.easing = 'EASE_OUT'    # твърдо спиране
            else:
                kp.interpolation = 'BEZIER'; kp.easing = 'EASE_IN_OUT'


def animate_hands(rig):
    """Жестовете на дланите вървят с фазите на екшъна."""
    for f, l, r in ((1, 'fist', 'fist'),
                    (F_ANTIC, 'fist', 'fist'),
                    (F_SURFACE + 2, 'open', 'open'),
                    (F_SPREAD, 'open', 'open'),
                    (F_WEB_A, 'thwip', 'thwip'),
                    (F_WEB_B, 'thwip', 'thwip'),
                    (F_TUCK, 'thwip', 'open'),
                    (F_SETTLE, 'thwip', 'open'),   # финалът: thwip длан + разперена
                    (F_END, 'thwip', 'open')):
        apply_grip(rig, 'L', l, f)
        apply_grip(rig, 'R', r, f)


def animate_pose(rig):
    """Крайниците пътуват през реални междинни пози, не се телепортират."""
    apply_pose(rig, POSE_TUCK, 1)
    apply_pose(rig, POSE_TUCK, F_CALM_END)
    apply_pose(rig, POSE_COIL, F_ANTIC)
    # изстрелването: от свито към изпънато за 4 кадъра
    apply_pose(rig, blend(POSE_COIL, POSE_ARROW, 0.45), F_BURST)
    apply_pose(rig, POSE_ARROW, F_SURFACE + 2)
    apply_pose(rig, POSE_ARROW, F_EXTEND)
    # краката се разтварят
    apply_pose(rig, blend(POSE_ARROW, POSE_SPREAD, 0.5), F_EXTEND + 4)
    apply_pose(rig, POSE_SPREAD, F_SPREAD)
    apply_pose(rig, blend(POSE_SPREAD, POSE_WEB, 0.55), F_APEX)
    apply_pose(rig, POSE_WEB, F_WEB_A)
    apply_pose(rig, POSE_WEB, F_WEB_B)
    # прибиране на коленете, после щракване в позата
    apply_pose(rig, POSE_TUCKIN, F_TUCK)
    apply_pose(rig, exaggerate(POSE_FINAL, 0.14), F_OVER)
    apply_pose(rig, exaggerate(POSE_FINAL, -0.05), F_RECOIL)
    apply_pose(rig, POSE_FINAL, F_SETTLE)
    # задържането диша, вместо да е замразен кадър
    for k, f in enumerate((122, 143, 164, F_END)):
        apply_pose(rig, drift(POSE_FINAL, k * 1.9), f)

    act = rig.animation_data.action
    for fc in act.fcurves:
        if not fc.data_path.startswith('pose.bones'):
            continue
        for kp in fc.keyframe_points:
            fr = kp.co.x
            if F_TUCK <= fr <= F_RECOIL:
                kp.interpolation = 'QUART'; kp.easing = 'EASE_OUT'   # snap
            elif fr <= F_SURFACE + 2:
                kp.interpolation = 'QUAD'; kp.easing = 'EASE_IN'     # взрив
            elif fr <= F_APEX:
                kp.interpolation = 'SINE'; kp.easing = 'EASE_IN_OUT'
            else:
                kp.interpolation = 'BEZIER'; kp.easing = 'EASE_IN_OUT'


def build_compositor():
    """Кинематографско компoзитиране: bloom, хроматична аберация, винетка,
    зърно и цветови грейд. Това е разликата между render и кадър от филм."""
    sc = bpy.context.scene
    sc.use_nodes = True
    nt = sc.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)

    rl = nt.nodes.new('CompositorNodeRLayers')
    x = 300

    def add(t, **kw):
        nonlocal x
        n = nt.nodes.new(t)
        n.location = (x, 0)
        x += 220
        for k, v in kw.items():
            setattr(n, k, v)
        return n

    prev = rl.outputs['Image']

    # 1) сияние по ярките отблясъци на водата
    glare = add('CompositorNodeGlare')
    glare.glare_type = 'BLOOM' if hasattr(glare, 'quality') and 'BLOOM' in \
        [i.identifier for i in glare.bl_rna.properties['glare_type'].enum_items] else 'FOG_GLOW'
    glare.quality = 'HIGH'
    if hasattr(glare, 'threshold'):
        glare.threshold = 0.82
    if hasattr(glare, 'mix'):
        glare.mix = -0.62
    if hasattr(glare, 'size'):
        glare.size = 8
    nt.links.new(prev, glare.inputs['Image'])
    prev = glare.outputs['Image']

    # 2) лека дисперсия по краищата на кадъра
    lens = add('CompositorNodeLensdist')
    for nm, val in (('Dispersion', 0.006), ('Distort', 0.004),
                    ('Distortion', 0.004)):
        if nm in lens.inputs:
            lens.inputs[nm].default_value = val
    nt.links.new(prev, lens.inputs['Image'])
    prev = lens.outputs['Image']

    # 3) грейд: студени сенки, топли акценти
    bal = add('CompositorNodeColorBalance')
    bal.correction_method = 'LIFT_GAMMA_GAIN'
    bal.lift = (0.97, 0.99, 1.05)
    bal.gamma = (1.00, 1.00, 0.99)
    bal.gain = (1.06, 1.02, 0.96)
    nt.links.new(prev, bal.inputs['Image'])
    prev = bal.outputs['Image']

    hs = add('CompositorNodeHueSat')
    hs.inputs['Saturation'].default_value = 1.12
    nt.links.new(prev, hs.inputs['Image'])
    prev = hs.outputs['Image']

    # 4) винетка
    ell = nt.nodes.new('CompositorNodeEllipseMask')
    ell.location = (x - 220, -320)
    ell.width, ell.height = 0.92, 0.86
    blur = nt.nodes.new('CompositorNodeBlur')
    blur.location = (x - 60, -320)
    blur.size_x = blur.size_y = 220
    blur.use_relative = False
    vig = add('CompositorNodeMixRGB')
    vig.blend_type = 'MULTIPLY'
    vig.inputs['Fac'].default_value = 0.34
    nt.links.new(ell.outputs['Mask'], blur.inputs['Image'])
    nt.links.new(prev, vig.inputs[1])
    nt.links.new(blur.outputs['Image'], vig.inputs[2])
    prev = vig.outputs['Image']

    # 5) фино филмово зърно
    noise = nt.nodes.new('CompositorNodeTexture')
    noise.location = (x - 220, -560)
    tex = bpy.data.textures.new('Grain', 'NOISE')
    noise.texture = tex
    grain = add('CompositorNodeMixRGB')
    grain.blend_type = 'OVERLAY'
    grain.inputs['Fac'].default_value = 0.045
    nt.links.new(prev, grain.inputs[1])
    nt.links.new(noise.outputs['Color'], grain.inputs[2])
    prev = grain.outputs['Image']

    comp = add('CompositorNodeComposite')
    nt.links.new(prev, comp.inputs['Image'])


def animate_wetness(rig):
    """Костюмът излиза от океана огледално мокър и постепенно изсъхва.

    Това е най-силният реалистичен знак, че тялото току-що е било във
    водата — по-силен от всяка добавена частица.
    """
    mat = bpy.data.materials.get('SpideySuit')
    if mat is None:
        return
    b = mat.node_tree.nodes['Principled BSDF']
    keys = [(1, 0.055, 0.85), (F_SURFACE, 0.055, 0.85),
            (F_APEX, 0.085, 0.70), (F_SETTLE, 0.17, 0.45),
            (140, 0.28, 0.26), (F_END, 0.30, 0.22)]
    for f, rough, coat in keys:
        b.inputs['Roughness'].default_value = rough
        b.inputs['Roughness'].keyframe_insert('default_value', frame=f)
        if 'Coat Weight' in b.inputs:
            b.inputs['Coat Weight'].default_value = coat
            b.inputs['Coat Weight'].keyframe_insert('default_value', frame=f)


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 48
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 10
    sc.cycles.transmission_bounces = 6
    sc.render.resolution_x, sc.render.resolution_y = 720, 1280
    sc.render.film_transparent = False
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.55
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    sc.view_settings.exposure = -0.05


def main():
    global AXIS
    clean()
    ctrl, rig, body, AXIS = F.load_character()
    build_ocean()
    build_interaction()
    build_splash()
    animate_body(ctrl)
    animate_pose(rig)
    animate_hands(rig)
    animate_wetness(rig)
    build_webs(rig)
    build_camera(ctrl)
    build_lights()
    build_compositor()
    setup_render()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spiderman_ocean.blend')
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('SAVED', out)
    print('objects:', len(bpy.data.objects), '| verts body:', len(body.data.vertices))


if __name__ == '__main__':
    main()
