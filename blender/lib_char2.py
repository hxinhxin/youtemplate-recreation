"""Истински персонаж: MakeHuman CC0 базова мрежа (13 378 квада с UV) ->
героични пропорции -> костюм -> анатомичен скелет -> скиниране.

Никакви примитиви: тялото, главата, дланите с пръсти и ходилата идват от
реална човешка топология, годна за деформация.
"""
import bpy, bmesh, math, os, json
from mathutils import Vector, Matrix

MH_OBJ = '/tmp/mh_base.obj'
HEIGHT = 1.86                      # метра
M_RED, M_BLUE, M_BLACK, M_WHITE = 0, 1, 2, 3


# ------------------------------------------------------------------ парсване
def load_mh(path=MH_OBJ):
    """Чете само групата `body` + центроидите на всички `joint-*` кубчета."""
    V, VT, groups, cur = [], [], {}, None
    with open(path) as fh:
        for line in fh:
            if line.startswith('v '):
                V.append(tuple(map(float, line.split()[1:4])))
            elif line.startswith('vt '):
                VT.append(tuple(map(float, line.split()[1:3])))
            elif line.startswith('g '):
                cur = line[2:].strip()
                groups.setdefault(cur, [])
            elif line.startswith('f '):
                face = []
                for tok in line.split()[1:]:
                    p = tok.split('/')
                    face.append((int(p[0]) - 1, int(p[1]) - 1 if len(p) > 1 and p[1] else -1))
                groups[cur].append(face)

    body = groups['body']
    joints = {}
    for g, fs in groups.items():
        if g.startswith('joint-') and fs:
            vs = {i for f in fs for i, _ in f}
            joints[g[6:]] = Vector([sum(V[i][k] for i in vs) / len(vs) for k in range(3)])

    # MakeHuman е Y-нагоре, +Z напред. Blender: Z-нагоре, героят гледа към -Y.
    ymin = min(V[i][1] for f in body for i, _ in f)
    s = HEIGHT / (max(V[i][1] for f in body for i, _ in f) - ymin)

    def conv(p):
        return Vector((p[0] * s, -p[2] * s, (p[1] - ymin) * s))

    used = sorted({i for f in body for i, _ in f})
    remap = {old: n for n, old in enumerate(used)}
    verts = [conv(V[i]) for i in used]
    faces = [[remap[i] for i, _ in f] for f in body]
    uvloops = [[VT[t] if t >= 0 else (0.0, 0.0) for _, t in f] for f in body]
    joints = {k: conv(v) for k, v in joints.items()}
    return verts, faces, uvloops, joints


# ------------------------------------------------- героични пропорции
def heroic_reshape(verts, J):
    """Мека, тежестна преоформяне на неутралната фигура към атлетичен герой."""
    sh_z = J['l-shoulder'].z
    hip_z = J['l-upper-leg'].z
    waist_z = hip_z + (sh_z - hip_z) * 0.42
    chest_z = hip_z + (sh_z - hip_z) * 0.86
    head_z = J['head'].z

    def band(z, c, w):                       # гладка гаусова маска по височина
        return math.exp(-((z - c) / w) ** 2)

    out = []
    for v in verts:
        p = v.copy()
        # по-широки рамене и гръден кош
        k = band(p.z, chest_z, 0.16)
        p.x *= 1 + 0.36 * k
        p.y *= 1 + 0.04 * k
        # стеснен кръст
        k = band(p.z, waist_z, 0.10)
        p.x *= 1 - 0.21 * k
        p.y *= 1 - 0.16 * k
        # по-мощни бедра и прасци
        k = band(p.z, hip_z - 0.20, 0.13) + band(p.z, hip_z - 0.55, 0.11)
        p.x *= 1 + 0.10 * min(k, 1)
        p.y *= 1 + 0.10 * min(k, 1)
        # по-тънка шия
        k = band(p.z, J['neck'].z + 0.02, 0.05)
        p.x *= 1 - 0.16 * k
        p.y *= 1 - 0.16 * k
        # мъжки гръден кош: премахва бюста на неутралната фигура
        bust = band(p.z, chest_z - 0.050, 0.105)
        if p.y < 0 and bust > 0.02:
            p.y *= 1 - 0.62 * bust
        # по-тесен таз
        k = band(p.z, hip_z + 0.03, 0.09)
        p.x *= 1 - 0.15 * k
        out.append(p)

    # устните: процепът се запълва, като предните върхове се изтеглят напред
    lip_z = J['mouth'].z
    lip = [i for i, v in enumerate(out)
           if abs(v.z - lip_z) < 0.026 and v.y < -0.08 and abs(v.x) < 0.045]
    if lip:
        front = min(out[i].y for i in lip)
        for i in lip:
            w = 1.0 - min(1.0, abs(out[i].z - lip_z) / 0.026)
            out[i].y = out[i].y * (1 - 0.9 * w) + (front + 0.002) * (0.9 * w)

    # ботуши: стъпалото се изтегля към гладък калъп, пръстите изчезват
    for sgn in (1, -1):
        fv = [i for i, v in enumerate(out)
              if v.z < J['l-ankle'].z + 0.075 and (v.x * sgn) > 0]
        if not fv:
            continue
        xs = [out[i].x for i in fv]; ys = [out[i].y for i in fv]; zs = [out[i].z for i in fv]
        c = Vector(((min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, max(zs)))
        r = Vector(((max(xs) - min(xs)) / 2 * 1.02, (max(ys) - min(ys)) / 2 * 1.02,
                    (max(zs) - min(zs)) * 1.02))
        for i in fv:
            d = out[i] - c
            q = Vector((d.x / r.x, d.y / r.y, d.z / r.z))
            if q.length < 1e-6:
                continue
            k = max(q.length, 1e-6)
            proj = c + Vector((q.x / k * r.x, q.y / k * r.y, q.z / k * r.z))
            # най-силно към пръстите, почти никак към глезена
            toe = max(0.0, -(d.y / r.y))
            t = 0.25 + 0.60 * toe
            out[i] = out[i].lerp(proj, min(t, 0.85))
    return out


# ------------------------------------------------------------------ материали
def _suit_shader():
    """Един материал: червено/синьо се смесват по изгладения атрибут `suit`,
    паяжинните линии се чертаят в UV пространството."""
    RED = (0.430, 0.022, 0.028, 1)
    BLUE = (0.014, 0.062, 0.330, 1)
    m = bpy.data.materials.new('Suit')
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Roughness'].default_value = 0.32
    if 'Specular IOR Level' in b.inputs:
        b.inputs['Specular IOR Level'].default_value = 0.55

    ca = nt.nodes.new('ShaderNodeVertexColor')
    ca.layer_name = 'suit'
    sharp = nt.nodes.new('ShaderNodeValToRGB')       # свива прехода в тънък кант
    sharp.color_ramp.elements[0].position = 0.44
    sharp.color_ramp.elements[1].position = 0.56
    mix = nt.nodes.new('ShaderNodeMixRGB')
    mix.blend_type = 'MIX'
    mix.inputs['Color1'].default_value = BLUE
    mix.inputs['Color2'].default_value = RED
    nt.links.new(ca.outputs['Color'], sharp.inputs['Fac'])
    nt.links.new(sharp.outputs['Color'], mix.inputs['Fac'])

    uv = nt.nodes.new('ShaderNodeUVMap')
    uv.uv_map = 'UVMap'
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(uv.outputs['UV'], sep.inputs['Vector'])

    def stripes(chan, freq):
        """|frac(uv*freq) - 0.5| -> тънки линии, които следват тялото."""
        mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        mul.inputs[1].default_value = freq
        fr = nt.nodes.new('ShaderNodeMath'); fr.operation = 'FRACT'
        sub = nt.nodes.new('ShaderNodeMath'); sub.operation = 'SUBTRACT'
        sub.inputs[1].default_value = 0.5
        ab = nt.nodes.new('ShaderNodeMath'); ab.operation = 'ABSOLUTE'
        nt.links.new(sep.outputs[chan], mul.inputs[0])
        nt.links.new(mul.outputs[0], fr.inputs[0])
        nt.links.new(fr.outputs[0], sub.inputs[0])
        nt.links.new(sub.outputs[0], ab.inputs[0])
        return ab

    a = stripes('X', 90.0)
    b2 = stripes('Y', 62.0)
    mn = nt.nodes.new('ShaderNodeMath'); mn.operation = 'MINIMUM'
    nt.links.new(a.outputs[0], mn.inputs[0])
    nt.links.new(b2.outputs[0], mn.inputs[1])
    web = nt.nodes.new('ShaderNodeValToRGB')
    web.color_ramp.interpolation = 'B_SPLINE'
    web.color_ramp.elements[0].position = 0.000
    web.color_ramp.elements[0].color = (0.0, 0.0, 0.0, 1)
    web.color_ramp.elements[1].position = 0.055
    web.color_ramp.elements[1].color = (1, 1, 1, 1)
    tint = nt.nodes.new('ShaderNodeMixRGB')
    tint.blend_type = 'MULTIPLY'
    tint.inputs['Fac'].default_value = 1.0
    bump = nt.nodes.new('ShaderNodeBump')
    bump.inputs['Strength'].default_value = 0.30
    bump.inputs['Distance'].default_value = 0.004
    nt.links.new(mn.outputs[0], web.inputs['Fac'])
    nt.links.new(mix.outputs['Color'], tint.inputs['Color1'])
    nt.links.new(web.outputs['Color'], tint.inputs['Color2'])
    nt.links.new(tint.outputs['Color'], b.inputs['Base Color'])
    nt.links.new(mn.outputs[0], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])
    return m


def _suit_materials():
    """[костюм, синьо-резерв, черно, бяло] — индексите съвпадат с M_* горе."""
    mats = [_suit_shader()]
    for name, col, rough in (('Suit_Blue', (0.014, 0.062, 0.330, 1), 0.32),
                             ('Suit_Black', (0.008, 0.008, 0.010, 1), 0.16),
                             ('Lens_White', (0.86, 0.90, 0.94, 1), 0.14)):
        m = bpy.data.materials.new(name)
        m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = col
        b.inputs['Roughness'].default_value = rough
        if 'Specular IOR Level' in b.inputs:
            b.inputs['Specular IOR Level'].default_value = 0.6
        mats.append(m)
    return mats


ARM_BONES = ('upperarm.', 'forearm.', 'hand.', 'f1_', 'f2_', 'f3_', 'f4_', 'f5_')


def clean_weights(ob, rig, J):
    """Гаси разлятото влияние на ръцете върху торса.

    Bone-heat дава на пекторалните върхове тегло от `upperarm`, затова при
    вдигане на ръцете гърдите се издуваха. Теглата се НАМАЛЯВАТ, а не се
    трият: върхове, останали без никакво влияние, се откъсват от скелета и
    увисват като парцали.
    """
    sh_z = J['l-shoulder'].z
    hip_z = J['l-upper-leg'].z
    # ширината се мери от РЕАЛНАТА мрежа: heroic_reshape е разширил торса,
    # затова ориентир само по ставите оставяше пекторалите в обхвата на ръката
    torso = [abs(v.co.x) for v in ob.data.vertices if hip_z < v.co.z < sh_z]
    arm_x = (max(torso) if torso else abs(J['l-shoulder'].x)) * 0.93

    groups = {g.name: g for g in ob.vertex_groups}
    idx2name = {g.index: g.name for g in ob.vertex_groups}
    touched = 0

    for v in ob.data.vertices:
        if not (abs(v.co.x) < arm_x and hip_z < v.co.z < sh_z - 0.015):
            continue
        ws = {idx2name[g.group]: g.weight for g in v.groups}
        arm = {n: w for n, w in ws.items() if n.startswith(ARM_BONES)}
        body_w = sum(w for n, w in ws.items() if n not in arm)
        if not arm or body_w < 1e-4:
            continue                      # няма на какво да стъпи -> не пипаме
        # колкото по-навътре в торса, толкова по-силно гасене
        k = min(1.0, abs(v.co.x) / arm_x)
        fac = 0.02 + 0.22 * k ** 8
        new_w = {n: w for n, w in ws.items() if n not in arm}
        new_w.update({n: w * fac for n, w in arm.items()})
        tot = sum(new_w.values())
        for n, w in new_w.items():
            groups[n].add([v.index], w / tot, 'REPLACE')
        touched += 1
    return touched


BLUE_BONES = {'hips', 'thigh.L', 'thigh.R', 'shin.L', 'shin.R'}


def paint_suit(ob, rig, J):
    """Раздава червено/синьо по ДОМИНИРАЩАТА кост на всеки връх.

    Праговете по координати лепяха червени петна по бедрата, защото тазът е
    по-широк от началото на ръката; тегловните групи следват анатомията точно.
    """
    gname = {g.index: g.name for g in ob.vertex_groups}
    ank_z = J['l-ankle'].z
    boot_top = ank_z + 0.20

    vred = []
    for v in ob.data.vertices:
        best, bw = None, -1.0
        for g in v.groups:
            if g.weight > bw and gname.get(g.group) in {b.name for b in rig.data.bones}:
                best, bw = gname[g.group], g.weight
        red = best not in BLUE_BONES if best else True
        if best in ('shin.L', 'shin.R') and v.co.z < boot_top:
            red = True                                   # кончов на ботуша
        vred.append(red)

    # Записваме маската като атрибут и я изглаждаме по ребрата: границата
    # червено/синьо става плавна крива вместо зъбер по полигони.
    me = ob.data
    val = [1.0 if r else 0.0 for r in vred]
    nb = [[] for _ in val]
    for e in me.edges:
        a, b = e.vertices
        nb[a].append(b)
        nb[b].append(a)
    for _ in range(7):
        val = [(0.45 * val[i] + 0.55 * (sum(val[j] for j in nb[i]) / len(nb[i])))
               if nb[i] else val[i] for i in range(len(val))]
    attr = me.color_attributes.new(name='suit', type='FLOAT_COLOR', domain='POINT')
    for i, v in enumerate(val):
        attr.data[i].color = (v, v, v, 1.0)
    for poly in me.polygons:
        poly.material_index = M_RED


# ---------------------------------------------------------------- очни лещи
def _teardrop_patch(rings=7, segs=34):
    """Параметрична капковидна лепенка (пръстени x сегменти) в равнина."""
    verts, faces = [], []
    verts.append((0.0, 0.0))
    for r in range(1, rings + 1):
        rr = r / rings
        for k in range(segs):
            a = 2 * math.pi * k / segs
            # яйцевидно сечение: по-широко навътре, заострено навън-нагоре
            ru = 1.0 + 0.30 * math.cos(a)
            rv = 1.0 - 0.18 * math.cos(a)
            verts.append((rr * ru * math.cos(a), rr * rv * math.sin(a)))
    def idx(r, k):
        return 0 if r == 0 else 1 + (r - 1) * segs + (k % segs)
    for k in range(segs):
        faces.append([idx(0, 0), idx(1, k), idx(1, k + 1)])
    for r in range(1, rings):
        for k in range(segs):
            faces.append([idx(r, k), idx(r + 1, k), idx(r + 1, k + 1), idx(r, k + 1)])
    return verts, faces


def make_lens(bvh, eye, sgn, su, sv, tilt, offset, name, mats, mat_idx):
    """Конформира лепенката върху черепа с raycast отпред и я издува навън."""
    from mathutils.bvhtree import BVHTree
    flat, faces = _teardrop_patch()
    ca, sa = math.cos(tilt * sgn), math.sin(tilt * sgn)
    co, nrms = [], []
    for u, v in flat:
        u *= sgn
        x = eye.x + (u * su) * ca - (v * sv) * sa
        z = eye.z + (u * su) * sa + (v * sv) * ca
        origin = Vector((x, eye.y - 0.30, z))
        hit, nrm, *_ = bvh.ray_cast(origin, Vector((0, 1, 0)))
        if hit is None:
            hit, nrm = Vector((x, eye.y, z)), Vector((0, -1, 0))
        co.append(hit)
        nrms.append(nrm.normalized())

    # очната кухина е вдлъбната; изглаждаме лепенката, иначе клепачите
    # и кухината стърчат през лещата
    ring = {}
    for f in faces:
        for a in range(len(f)):
            ring.setdefault(f[a], set()).update(f[:a] + f[a + 1:])
    for _ in range(10):
        co = [co[i].lerp(sum((co[j] for j in ring[i]), Vector()) / len(ring[i]), 0.65)
              if ring.get(i) else co[i] for i in range(len(co))]
    n_avg = sum(nrms, Vector()).normalized()
    co = [c + n_avg * offset for c in co]

    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(c) for c in co], [], faces)
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for m in mats:
        ob.data.materials.append(m)
    for p in ob.data.polygons:
        p.material_index = mat_idx
        p.use_smooth = True
    sol = ob.modifiers.new('Solid', 'SOLIDIFY')
    sol.thickness = 0.006
    sol.offset = -1
    sub = ob.modifiers.new('Sub', 'SUBSURF')
    sub.levels, sub.render_levels = 1, 2
    return ob


def build_lens_pair(verts, faces, J, mats):
    from mathutils.bvhtree import BVHTree
    bvh = BVHTree.FromPolygons([tuple(v) for v in verts], faces, all_triangles=False)
    out = []
    for side, sgn in (('l', 1), ('r', -1)):
        eye = J[f'{side}-eye']
        e = Vector((0.040 * sgn, eye.y, eye.z + 0.009))
        tilt = math.radians(15)
        out.append(make_lens(bvh, e, sgn, 0.0430, 0.0290, tilt, 0.0125,
                             f'LensRim_{side}', mats, M_BLACK))
        out.append(make_lens(bvh, e, sgn, 0.0355, 0.0235, tilt, 0.0175,
                             f'Lens_{side}', mats, M_WHITE))
    return out


# ------------------------------------------------------------------- скелет
def _chain(J):
    B = []                       # име, head, tail, parent, connect
    B += [('root', Vector((0, 0, 0)), Vector((0, -0.25, 0)), None, False),
          ('hips', J['pelvis'], J['spine-4'], 'root', False),
          ('spine', J['spine-4'], J['spine-2'], 'hips', True),
          ('chest', J['spine-2'], J['neck'], 'spine', True),
          ('neck', J['neck'], J['head'], 'chest', True),
          ('head', J['head'], J['head-2'], 'neck', True)]
    for tag, s in (('L', 'l'), ('R', 'r')):
        B += [(f'shoulder.{tag}', J[f'{s}-clavicle'], J[f'{s}-shoulder'], 'chest', False),
              (f'upperarm.{tag}', J[f'{s}-shoulder'], J[f'{s}-elbow'], f'shoulder.{tag}', True),
              (f'forearm.{tag}', J[f'{s}-elbow'], J[f'{s}-hand'], f'upperarm.{tag}', True),
              (f'hand.{tag}', J[f'{s}-hand'], J[f'{s}-hand-3'], f'forearm.{tag}', True),
              (f'thigh.{tag}', J[f'{s}-upper-leg'], J[f'{s}-knee'], 'hips', False),
              (f'shin.{tag}', J[f'{s}-knee'], J[f'{s}-ankle'], f'thigh.{tag}', True),
              (f'foot.{tag}', J[f'{s}-ankle'], J[f'{s}-foot-1'], f'shin.{tag}', True),
              (f'toe.{tag}', J[f'{s}-foot-1'], J[f'{s}-foot-2'], f'foot.{tag}', True)]
        for fi in range(1, 6):                      # 5 пръста x 3 фаланги
            par = f'hand.{tag}'
            for seg in range(1, 4):
                h = J[f'{s}-finger-{fi}-{seg}']
                t = J[f'{s}-finger-{fi}-{seg + 1}']
                nm = f'f{fi}_{seg}.{tag}'
                B.append((nm, h, t, par, seg > 1))
                par = nm
    return B


def build_armature(J):
    arm = bpy.data.armatures.new('SpideyRig')
    rig = bpy.data.objects.new('Spidey_Rig', arm)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    made = {}
    for name, h, t, par, conn in _chain(J):
        b = arm.edit_bones.new(name)
        b.head, b.tail = Vector(h), Vector(t)
        if (b.tail - b.head).length < 1e-4:
            b.tail = b.head + Vector((0, 0, 0.01))
        b.use_deform = name != 'root'
        if par:
            b.parent = made[par]
            b.use_connect = conn
        made[name] = b
    bpy.ops.object.mode_set(mode='OBJECT')
    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    return rig


# ---------------------------------------------------------------- сглобяване
def _fill_openings(me):
    """Запълва граничните отвори (уста, очни кухини, ноздри) — под маска
    те се виждат като черни дупки."""
    bm = bmesh.new()
    bm.from_mesh(me)
    border = [e for e in bm.edges if len(e.link_faces) == 1]
    if border:
        bmesh.ops.holes_fill(bm, edges=border, sides=0)
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bm.to_mesh(me)
    bm.free()
    return len(border)


def build(mats=None):
    verts, faces, uvloops, J = load_mh()
    mats = mats or _suit_materials()

    me = bpy.data.meshes.new('Spidey_Body')
    me.from_pydata([tuple(v) for v in verts], [], faces)
    me.update()
    uvl = me.uv_layers.new(name='UVMap')
    n = 0
    for fi, f in enumerate(faces):
        for k in range(len(f)):
            uvl.data[n].uv = uvloops[fi][k]
            n += 1
    nb = _fill_openings(me)
    print('  filled %d border edges (mouth/eye sockets)' % nb)
    # преоформянето става СЛЕД запълването, за да легне и новата геометрия
    verts = heroic_reshape([v.co.copy() for v in me.vertices], J)
    for i, v in enumerate(verts):
        me.vertices[i].co = v

    body = bpy.data.objects.new('Spidey_Body', me)
    bpy.context.scene.collection.objects.link(body)
    for m in mats:
        body.data.materials.append(m)
    for p in body.data.polygons:
        p.use_smooth = True

    # лещите се вземат от главата ПРЕДИ маската да бъде изгладена
    lenses = build_lens_pair(verts, faces, J, mats)

    rig = build_armature(J)

    # маската: изглаждаме носа, устните и ушите, за да е плат, а не лице
    # Маската е плат: силно Laplacian изглаждане с плавно затихване към шията
    # разтапя носа, устните и ушите, без да деформира черепа.
    grp = body.vertex_groups.new(name='mask')
    z0 = J['neck'].z + 0.005          # тегло 0 тук
    z1 = J['neck'].z + 0.085          # тегло 1 нагоре
    for i, v in enumerate(verts):
        if v.z > z0:
            w = min(1.0, (v.z - z0) / (z1 - z0))
            grp.add([i], w, 'REPLACE')
    sm = body.modifiers.new('MaskSmooth', 'SMOOTH')
    sm.vertex_group = 'mask'
    sm.factor = 1.0
    sm.iterations = 48

    # гръдният кош: неутралната фигура има бюст; силното изглаждане на
    # предната зона го стапя в плосък пекторален релеф
    cgrp = body.vertex_groups.new(name='chest_flat')
    c0 = J['l-upper-leg'].z + (J['l-shoulder'].z - J['l-upper-leg'].z) * 0.55
    c1 = J['l-shoulder'].z + 0.02
    for i, v in enumerate(verts):
        if c0 < v.z < c1 and v.y < 0 and abs(v.x) < abs(J['l-shoulder'].x) * 0.95:
            e = min((v.z - c0) / 0.06, (c1 - v.z) / 0.06, 1.0)
            if e > 0:
                cgrp.add([i], e, 'REPLACE')
    cs = body.modifiers.new('ChestSmooth', 'SMOOTH')
    cs.vertex_group = 'chest_flat'
    cs.factor = 1.0
    cs.iterations = 26

    bgrp = body.vertex_groups.new(name='boots')
    boot_z = J['l-ankle'].z + 0.06
    bgrp.add([i for i, v in enumerate(verts) if v.z < boot_z], 1.0, 'REPLACE')
    bs = body.modifiers.new('BootSmooth', 'SMOOTH')
    bs.vertex_group = 'boots'
    bs.factor = 1.0
    bs.iterations = 22

    bpy.ops.object.select_all(action='DESELECT')
    body.select_set(True)
    rig.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    bpy.ops.object.select_all(action='DESELECT')
    n = clean_weights(body, rig, J)
    print('  stripped %d bleeding arm weights from torso' % n)
    paint_suit(body, rig, J)      # изисква вече готовите тегловни групи
    body.modifiers['Armature'].use_deform_preserve_volume = False

    # редът е MaskSmooth -> Armature: маската се изглажда в rest,
    # после скелетът деформира вече изгладената мрежа
    assert [m.type for m in body.modifiers] == ['SMOOTH', 'SMOOTH', 'SMOOTH', 'ARMATURE'], \
        [m.type for m in body.modifiers]

    for lens in lenses:
        lens.parent = rig
        lens.parent_type = 'BONE'
        lens.parent_bone = 'head'
        pb = rig.pose.bones['head']
        lens.matrix_parent_inverse = (rig.matrix_world @ pb.matrix
                                      @ Matrix.Translation((0, pb.length, 0))).inverted()
    return rig, body, lenses, J
