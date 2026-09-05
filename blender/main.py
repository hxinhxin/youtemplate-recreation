"""Изгражда цялата сцена и анимацията, записва .blend."""
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix, Euler

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lib_build import aim_bone
import lib_char2 as C

FPS, F_END = 30, 150
# ---- тайминг (кадри) -------------------------------------------------
F_CALM_END   = 30    # празен океан
F_ANTIC      = 34    # антиципация под водата
F_BURST      = 37    # изскачането
F_SURFACE    = 39    # пробива повърхността
F_APEX       = 48    # най-високата точка
F_WEB_A      = 50    # първи изстрел паяжина
F_WEB_B      = 54    # втори
F_SNAP_START = 58
F_OVER       = 64    # overshoot
F_RECOIL     = 68
F_SETTLE     = 72    # финалната поза е заключена
WATER_Z      = 0.0


# =====================================================================
# ПОЗИ — посоки на костите в световни координати (героят гледа към -Y,
# неговата дясна страна е -X = ляво на екрана)
# =====================================================================
POSE_TUCK = {
    'hips': (0, -0.55, 0.84), 'spine': (0, -0.42, 0.91), 'chest': (0, -0.30, 0.95),
    'head': (0, -0.20, 0.98),
    'upperarm.R': (-0.35, -0.55, -0.76), 'forearm.R': (-0.20, -0.90, 0.38),
    'upperarm.L': (0.35, -0.55, -0.76),  'forearm.L': (0.20, -0.90, 0.38),
    'thigh.R': (-0.18, -0.86, 0.48), 'shin.R': (-0.10, 0.55, -0.83), 'foot.R': (-0.12, -0.55, -0.83),
    'thigh.L': (0.18, -0.86, 0.48),  'shin.L': (0.10, 0.55, -0.83),  'foot.L': (0.12, -0.55, -0.83),
}

POSE_BURST = {                      # изправено, издължено тяло, ръце нагоре
    'hips': (0, 0.02, 1.0), 'spine': (0, 0.01, 1.0), 'chest': (0, 0, 1.0),
    'head': (0, 0.04, 1.0),
    'upperarm.R': (-0.16, 0.05, 0.985), 'forearm.R': (-0.10, 0.03, 0.994), 'hand.R': (-0.08, 0, 0.997),
    'upperarm.L': (0.16, 0.05, 0.985),  'forearm.L': (0.10, 0.03, 0.994),  'hand.L': (0.08, 0, 0.997),
    'thigh.R': (-0.05, 0.05, -0.997), 'shin.R': (-0.03, 0.02, -0.999), 'foot.R': (-0.03, -0.60, -0.80),
    'thigh.L': (0.05, 0.05, -0.997),  'shin.L': (0.03, 0.02, -0.999),  'foot.L': (0.03, -0.60, -0.80),
}

POSE_WEB = {                        # двете ръце изстрелват рязко напред-нагоре
    'hips': (0.02, -0.26, 0.965), 'spine': (0.02, -0.14, 0.990), 'chest': (0.04, -0.06, 0.997),
    'neck': (0, -0.05, 0.999), 'head': (0, -0.02, 1.0),
    'upperarm.R': (-0.26, -0.90, 0.35), 'forearm.R': (-0.12, -0.98, 0.12), 'hand.R': (-0.09, -0.99, 0.10),
    'upperarm.L': (0.34, -0.86, 0.38),  'forearm.L': (0.18, -0.96, 0.20),  'hand.L': (0.14, -0.98, 0.16),
    # краката вече се подгъват към финалната поза
    'thigh.R': (-0.26, -0.60, -0.76), 'shin.R': (-0.05, 0.34, -0.94), 'foot.R': (-0.28, -0.66, -0.70),
    'thigh.L': (0.34, -0.56, -0.76),  'shin.L': (0.10, 0.40, -0.91),  'foot.L': (0.30, -0.62, -0.72),
}

POSE_FINAL = {                      # финалната поза от референцията
    'hips':  (0.06, -0.30, 0.952),   # тазът назад, тялото компактно
    'spine': (0.04, -0.17, 0.985),
    'chest': (0.08, -0.10, 0.992),
    'neck':  (0.01, -0.06, 0.998),
    'head':  (0.00, -0.02, 1.000),
    # дясна ръка — изпъната нагоре и силно встрани (ляво на екрана)
    'upperarm.R': (-0.72, -0.17, 0.672), 'forearm.R': (-0.62, -0.12, 0.775),
    'hand.R':     (-0.58, -0.10, 0.808),
    # лява ръка — свита пред гърдите, дланта в "thwip" жест
    # ръката стои ПРЕД тялото: без силна -Y компонента мишницата потъва в
    # гръдния кош и скинирането слива двете в безформена маса
    'upperarm.L': (0.72, -0.42, -0.550), 'forearm.L': (0.10, -0.90, 0.42),
    'hand.L':     (0.05, -0.92, 0.39),
    # ляв крак — вдигнат високо, коляното силно свито (дясно на екрана)
    'thigh.L': (0.70, -0.25, 0.668), 'shin.L': (0.05, 0.20, 0.978), 'foot.L': (-0.30, -0.55, 0.78),
    # десен крак — бедрото напред, подбедрицата увиснала надолу-наляво
    'thigh.R': (-0.68, -0.48, -0.55), 'shin.R': (0.05, -0.18, -0.982), 'foot.R': (-0.58, -0.52, -0.63),
}


def exaggerate(pose, k):
    """Overshoot: избутва посоките малко по-нататък от неутралното."""
    out = {}
    for b, d in pose.items():
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


def apply_grip(rig, side, gesture, frame):
    """Свива фалангите около локалната ос на всяка кост."""
    from mathutils import Quaternion
    g = GRIP[gesture]
    for fi in range(1, 6):
        for seg in range(1, 4):
            pb = rig.pose.bones.get(f'f{fi}_{seg}.{side}')
            if pb is None:
                continue
            pb.rotation_quaternion = Quaternion((1, 0, 0), -g[fi][seg - 1])
            pb.keyframe_insert('rotation_quaternion', frame=frame)


def apply_pose(rig, pose, frame):
    bpy.context.scene.frame_set(frame)
    for name in ORDER:
        pb = rig.pose.bones[name]
        if name in pose:
            aim_bone(pb, pose[name])
        else:
            pb.rotation_quaternion = (1, 0, 0, 0)
            bpy.context.view_layer.update()
    for name in ORDER:
        rig.pose.bones[name].keyframe_insert('rotation_quaternion', frame=frame)


# =====================================================================
def clean():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.frame_start, sc.frame_end = 1, F_END
    sc.render.fps = FPS


def build_ocean():
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, WATER_Z))
    oc = bpy.context.object
    oc.name = 'Ocean'
    m = oc.modifiers.new('Ocean', 'OCEAN')
    m.spatial_size = 34
    m.resolution = 11
    m.wave_scale = 1.75
    m.wave_scale_min = 0.03
    m.choppiness = 1.45
    m.wind_velocity = 15.0
    m.random_seed = 7
    for f, t in ((1, 0.0), (F_END, F_END / FPS * 1.4)):
        m.time = t
        m.keyframe_insert('time', frame=f)
    for fc in oc.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    mat = bpy.data.materials.new('Water')
    mat.use_nodes = True
    b = mat.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (0.004, 0.026, 0.055, 1)
    b.inputs['Roughness'].default_value = 0.13
    if 'Specular IOR Level' in b.inputs:
        b.inputs['Specular IOR Level'].default_value = 0.85
    oc.data.materials.append(mat)
    for p in oc.data.polygons:
        p.use_smooth = True
    return oc


def build_splash():
    """Пръски, пяна и воден стълб — истински анимирани обекти."""
    objs = []

    # --- капката-инстанция ---
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.05,
                                          location=(0, 0, -50))
    drop = bpy.context.object
    drop.name = 'DropInstance'
    for _p in drop.data.polygons:
        _p.use_smooth = True
    wat = bpy.data.materials.new('SplashWhite')
    wat.use_nodes = True
    nb = wat.node_tree.nodes['Principled BSDF']
    nb.inputs['Base Color'].default_value = (0.86, 0.94, 1.0, 1)
    nb.inputs['Roughness'].default_value = 0.15
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
    s.count = 1050
    s.frame_start, s.frame_end = F_BURST, F_BURST + 5
    s.lifetime, s.lifetime_random = 42, 0.55
    s.normal_factor = 11.0
    s.factor_random = 4.5
    s.object_align_factor[2] = 6.0
    s.particle_size, s.size_random = 1.35, 0.8
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
    cm = bpy.data.materials.new('ColumnWhite')
    cm.use_nodes = True
    nt = cm.node_tree
    nb = nt.nodes['Principled BSDF']
    nb.inputs['Base Color'].default_value = (0.82, 0.93, 1.0, 1)
    nb.inputs['Roughness'].default_value = 0.2
    cm.blend_method = 'BLEND'
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
    for tag, bone, tip, start in (('R', 'hand.R', Vector((-7.0, -3.0, 6.5)), F_WEB_A),
                                  ('L', 'hand.L', Vector((7.5, -3.5, 2.2)), F_WEB_B)):
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
                   (F_BURST, (0, 0, 1.4)), (F_APEX, (0, 0, 5.05)),
                   (F_SETTLE, (0.08, 0, 5.25)), (F_END, (0.08, 0, 5.28))):
        tgt.location = loc
        tgt.keyframe_insert('location', frame=f)

    cam = bpy.data.objects.new('Camera', bpy.data.cameras.new('Camera'))
    bpy.context.scene.collection.objects.link(cam)
    bpy.context.scene.camera = cam
    cam.data.lens = 40
    cam.data.sensor_width = 36
    con = cam.constraints.new('TRACK_TO')
    con.target = tgt
    con.track_axis = 'TRACK_NEGATIVE_Z'
    con.up_axis = 'UP_Y'

    # При портретен кадър Blender ляга сензора (36 мм) по ВИСОЧИНАТА, значи
    # видимата височина = разстояние * 36 / фокус. Героят е 1.86 м.
    for f, loc, lens in ((1, (1.2, -13.0, 1.10), 31),
                         (F_CALM_END, (0.7, -12.4, 1.20), 32),
                         (F_BURST, (0.2, -11.0, 1.70), 40),
                         (F_APEX, (-0.4, -7.3, 4.60), 58),
                         (F_SETTLE, (-0.7, -4.5, 5.05), 66),
                         (F_END, (-0.8, -4.2, 5.08), 68)):
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
    sky.sun_elevation = math.radians(5.0)
    sky.sun_rotation = math.radians(-38)
    sky.altitude = 200
    nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = 0.45

    sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
    bpy.context.scene.collection.objects.link(sun)
    sun.data.energy = 6.0
    sun.data.angle = math.radians(2.5)
    sun.data.color = (1.0, 0.86, 0.72)
    sun.rotation_euler = (math.radians(58), 0, math.radians(-42))

    fill = bpy.data.objects.new('Fill', bpy.data.lights.new('Fill', 'AREA'))
    bpy.context.scene.collection.objects.link(fill)
    fill.data.energy = 900
    fill.data.size = 9
    fill.data.color = (0.62, 0.78, 1.0)
    fill.location = (7.5, -9.0, 7.0)
    fill.rotation_euler = (math.radians(58), 0, math.radians(52))
    fill.visible_camera = False
    fill.visible_glossy = False

    rim = bpy.data.objects.new('Rim', bpy.data.lights.new('Rim', 'AREA'))
    bpy.context.scene.collection.objects.link(rim)
    rim.data.energy = 1400
    rim.data.size = 6
    rim.data.color = (1.0, 0.72, 0.45)
    rim.location = (-6.0, 6.5, 6.0)
    rim.rotation_euler = (math.radians(112), 0, math.radians(-140))
    rim.visible_camera = False
    rim.visible_glossy = False


def animate_body(rig):
    """Движение на целия герой: под водата -> експлозивно нагоре -> застива."""
    rig.rotation_mode = 'XYZ'

    keys = [
        # кадър, z,     scale(x,y,z),      rot z
        (1,            -9.00, (1.00, 1.00, 1.00), 0.35),
        (F_CALM_END,   -8.60, (1.00, 1.00, 1.00), 0.30),
        (F_ANTIC,      -9.35, (1.10, 1.10, 0.86), 0.25),   # антиципация: сгъва се
        (F_BURST,      -5.20, (0.74, 0.74, 1.55), 0.10),   # изстрелване, издължен
        (F_SURFACE,    -0.30, (0.72, 0.72, 1.62), 0.02),
        (F_SURFACE + 1, 1.45, (0.76, 0.76, 1.52), 0.00),
        (F_BURST + 4,   2.35, (0.80, 0.80, 1.42), -0.05),
        (F_BURST + 7,   3.75, (0.94, 0.94, 1.10), -0.12),
        (F_APEX,        4.42, (1.03, 1.03, 0.95), -0.18),  # леко сплескване на върха
        (F_WEB_B,       4.30, (1.00, 1.00, 1.00), -0.22),
        (F_OVER,        4.18, (0.97, 0.97, 1.04), -0.34),  # overshoot
        (F_RECOIL,      4.30, (1.02, 1.02, 0.98), -0.26),  # откат
        (F_SETTLE,      4.26, (1.00, 1.00, 1.00), -0.29),
        (F_END,         4.20, (1.00, 1.00, 1.00), -0.29),
    ]
    for f, z, sc, rz in keys:
        rig.location = (0, 0, z)
        rig.scale = sc
        rig.rotation_euler = (0, 0, rz)
        rig.keyframe_insert('location', frame=f)
        rig.keyframe_insert('scale', frame=f)
        rig.keyframe_insert('rotation_euler', frame=f)

    # рязко ускорение: без плавно влизане в изстрелването
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
    for f, l, r in ((1, 'fist', 'fist'),
                    (F_BURST + 2, 'open', 'open'),
                    (F_WEB_A, 'thwip', 'thwip'),
                    (F_WEB_B + 1, 'thwip', 'thwip'),
                    (F_SETTLE, 'thwip', 'open'),      # финалът: thwip длан + разперена
                    (F_END, 'thwip', 'open')):
        apply_grip(rig, 'L', l, f)
        apply_grip(rig, 'R', r, f)


def animate_pose(rig):
    apply_pose(rig, POSE_TUCK, 1)
    apply_pose(rig, POSE_TUCK, F_ANTIC)
    apply_pose(rig, POSE_BURST, F_BURST + 2)
    apply_pose(rig, POSE_BURST, F_APEX - 3)
    apply_pose(rig, POSE_WEB, F_WEB_A)
    apply_pose(rig, POSE_WEB, F_WEB_B + 1)
    apply_pose(rig, exaggerate(POSE_FINAL, 0.16), F_OVER)
    apply_pose(rig, exaggerate(POSE_FINAL, -0.05), F_RECOIL)
    apply_pose(rig, POSE_FINAL, F_SETTLE)
    apply_pose(rig, POSE_FINAL, F_END)

    act = rig.animation_data.action
    for fc in act.fcurves:
        if not fc.data_path.startswith('pose.bones'):
            continue
        for kp in fc.keyframe_points:
            fr = kp.co.x
            if F_SNAP_START <= fr <= F_RECOIL:
                kp.interpolation = 'QUART'
                kp.easing = 'EASE_OUT'
            elif fr <= F_APEX:
                kp.interpolation = 'QUAD'
                kp.easing = 'EASE_IN_OUT'
            else:
                kp.interpolation = 'BEZIER'
                kp.easing = 'EASE_IN_OUT'


def setup_render():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 40
    sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 6
    sc.cycles.transmission_bounces = 2
    sc.render.resolution_x, sc.render.resolution_y = 540, 960
    sc.render.film_transparent = False
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.6
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    sc.view_settings.exposure = 0.35


def main():
    clean()
    rig, body, lenses, J = C.build()
    build_ocean()
    build_splash()
    animate_body(rig)
    animate_pose(rig)
    animate_hands(rig)
    build_webs(rig)
    build_camera(rig)
    build_lights()
    setup_render()
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'spiderman_ocean.blend')
    bpy.ops.wm.save_as_mainfile(filepath=out)
    print('SAVED', out)
    print('objects:', len(bpy.data.objects), '| verts body:', len(body.data.vertices))


if __name__ == '__main__':
    main()
