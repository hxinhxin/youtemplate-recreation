"""2D cartoon анимация 9:16 — Спайдърмен изскача от океана.

Рисува се изцяло процедурно с PIL върху 2x supersample и се смалява,
за да са ръбовете гладки. Героят е изрезката от референцията, с добавен
дебел черен контур за комикс усещане.
"""
import math, os
from PIL import Image, ImageDraw, ImageFilter, ImageChops

W, H = 1080, 1920          # 9:16
FPS = 30
SS = 2                     # supersample
SW, SH = W * SS, H * SS
OUT = '/tmp/cart'

# ---- палитра (плоски комикс цветове) --------------------------------
SKY_TOP   = (24, 22, 68)
SKY_MID   = (116, 58, 122)
SKY_LOW   = (243, 142, 82)
SKY_GLOW  = (255, 214, 138)
SUN       = (255, 228, 146)
CLOUD     = (255, 190, 160)
CLOUD_D   = (214, 132, 128)
SEA_DEEP  = (13, 38, 84)
SEA_MID   = (24, 70, 138)
SEA_LIGHT = (46, 110, 186)
SEA_TOP   = (86, 158, 224)
FOAM      = (240, 249, 255)
INK       = (12, 14, 28)

# ---- тайминг (кадри) -------------------------------------------------
F_CALM_END = 44      # празен океан
F_ANTIC    = 45      # водата се издува
F_BURST    = 51      # изскачането
F_APEX     = 72
F_WEB_A    = 78
F_WEB_B    = 84
F_SNAP     = 88
F_OVER     = 94      # overshoot
F_RECOIL   = 99
F_SETTLE   = 104     # позата е заключена
F_FADE     = 170
F_END      = 186


# ---- помощни ---------------------------------------------------------
def clamp(v, a=0.0, b=1.0):
    return a if v < a else b if v > b else v


def inv(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else 0.0


def ease_out(t):  return 1 - (1 - t) ** 3
def ease_in(t):   return t * t * t
def ease_io(t):   return 4 * t ** 3 if t < .5 else 1 - (-2 * t + 2) ** 3 / 2
def ease_back(t): return 1 + 2.4 * (t - 1) ** 3 + 1.6 * (t - 1) ** 2


def lerp(a, b, t):
    return a + (b - a) * t


def mixc(c1, c2, t):
    return tuple(int(round(lerp(c1[i], c2[i], t))) for i in range(3))


# ---- статични слоеве -------------------------------------------------
def make_sky():
    """Небето е по-високо от кадъра, за да може камерата да върви нагоре."""
    hh = SH * 2
    img = Image.new('RGB', (SW, hh))
    d = ImageDraw.Draw(img)
    for y in range(hh):
        u = y / hh
        if u < 0.42:
            c = mixc(SKY_TOP, SKY_MID, ease_io(u / 0.42))
        elif u < 0.76:
            c = mixc(SKY_MID, SKY_LOW, ease_io((u - 0.42) / 0.34))
        else:
            c = mixc(SKY_LOW, SKY_GLOW, ease_io((u - 0.76) / 0.24))
        d.line([(0, y), (SW, y)], fill=c)

    # слънце ниско долу, точно над бъдещия хоризонт
    r = int(0.20 * SW)
    cx, cy = int(0.70 * SW), int(hh * 0.885)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=SUN)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=INK, width=6 * SS)

    # плоски комикс облаци
    for cx0, cy0, sc in ((0.18, 0.60, 1.15), (0.72, 0.52, 0.85),
                         (0.42, 0.71, 0.70), (0.86, 0.68, 0.60)):
        x0, y0 = cx0 * SW, cy0 * hh
        lobes = [(-1.35, 0.10, 0.52), (-0.55, -0.30, 0.72), (0.30, -0.22, 0.66),
                 (1.10, 0.12, 0.48), (0.0, 0.22, 0.60)]
        s = 150 * SS * sc
        for dx, dy, rr in lobes:
            d.ellipse([x0 + dx * s - rr * s, y0 + dy * s - rr * s,
                       x0 + dx * s + rr * s, y0 + dy * s + rr * s], fill=CLOUD)
        for dx, dy, rr in lobes[:3]:
            d.ellipse([x0 + dx * s - rr * s, y0 + dy * s + rr * s * 0.25,
                       x0 + dx * s + rr * s, y0 + dy * s + rr * s * 0.85],
                      fill=CLOUD_D)
    return img


def make_halftone():
    """Полутонова растерна маска за комикс акценти."""
    img = Image.new('L', (SW, SH), 0)
    d = ImageDraw.Draw(img)
    step = 26 * SS
    for y in range(0, SH, step):
        for x in range(0, SW, step):
            r = step * 0.22
            d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return img


def outlined_hero(path, thickness=13):
    """Добавя дебел черен контур около изрезката."""
    sp = Image.open(path).convert('RGBA')
    a = sp.split()[3]
    grow = a
    for _ in range(thickness):
        grow = grow.filter(ImageFilter.MaxFilter(3))
    grow = grow.point(lambda v: 255 if v > 40 else 0)
    pad = thickness + 6
    big = Image.new('RGBA', (sp.width + pad * 2, sp.height + pad * 2), (0, 0, 0, 0))
    ink = Image.new('RGBA', grow.size, INK + (255,))
    ink.putalpha(grow)
    big.paste(ink, (pad, pad), ink)
    big.paste(sp, (pad, pad), sp)
    return big


def silhouette(sprite, color):
    s = Image.new('RGBA', sprite.size, color + (255,))
    s.putalpha(sprite.split()[3])
    return s


# ---- анимационни криви ----------------------------------------------
def horizon(f):
    """Височина на хоризонта: камерата се вдига след изскачането."""
    if f < F_BURST:
        return 0.605 * SH
    return lerp(0.605, 0.905, ease_out(inv(f, F_BURST, F_SETTLE))) * SH


def hero_scale(f):
    if f < F_BURST:      return 0.42
    if f < F_APEX:       return lerp(0.42, 0.74, ease_out(inv(f, F_BURST, F_APEX)))
    if f < F_SETTLE:     return lerp(0.74, 0.94, ease_back(inv(f, F_APEX, F_SETTLE)))
    return lerp(0.94, 0.99, ease_io(inv(f, F_SETTLE, F_FADE)))     # бавен push-in


def hero_y(f):
    """Център на героя по вертикала (в supersample пиксели)."""
    hz = 0.605 * SH
    if f < F_BURST:                 return hz + 0.30 * SH
    # взривно: най-бързо в самото начало, после рязко забавяне
    if f < F_BURST + 6:             return lerp(hz + 0.04 * SH, 0.36 * SH,
                                                ease_out(inv(f, F_BURST, F_BURST + 6)))
    if f < F_APEX:                  return lerp(0.36 * SH, 0.285 * SH,
                                                ease_out(inv(f, F_BURST + 6, F_APEX)))
    if f < F_SETTLE:                return lerp(0.285 * SH, 0.475 * SH,
                                                ease_back(inv(f, F_APEX, F_SETTLE)))
    return 0.475 * SH + math.sin((f - F_SETTLE) * 0.09) * 0.006 * SH


def hero_stretch(f):
    """Squash & stretch — сърцето на анимационния „punch"."""
    if f < F_BURST:                 return (1.0, 1.0)
    if f < F_BURST + 5:
        k = inv(f, F_BURST, F_BURST + 5)
        return (lerp(0.62, 0.86, k), lerp(1.72, 1.24, k))
    if f < F_APEX:
        k = inv(f, F_BURST + 5, F_APEX)
        return (lerp(0.86, 1.04, k), lerp(1.24, 0.97, k))
    if f < F_OVER:
        k = inv(f, F_APEX, F_OVER)
        return (lerp(1.04, 0.95, k), lerp(0.97, 1.06, k))
    if f < F_RECOIL:
        k = inv(f, F_OVER, F_RECOIL)
        return (lerp(0.95, 1.06, k), lerp(1.06, 0.95, k))
    k = inv(f, F_RECOIL, F_SETTLE)
    return (lerp(1.06, 1.0, k), lerp(0.95, 1.0, k))


def hero_rot(f):
    if f < F_BURST:                 return 0.0
    if f < F_APEX:                  return lerp(-16, -6, ease_out(inv(f, F_BURST, F_APEX)))
    if f < F_OVER:                  return lerp(-6, 7, ease_io(inv(f, F_APEX, F_OVER)))
    if f < F_SETTLE:                return lerp(7, 0, ease_back(inv(f, F_OVER, F_SETTLE)))
    return math.sin((f - F_SETTLE) * 0.07) * 1.2


def shake(f):
    """Удар на камерата при пробива и при щракването в позата."""
    amp = 0.0
    if F_BURST <= f < F_BURST + 12:
        amp = (1 - inv(f, F_BURST, F_BURST + 12)) * 34 * SS
    if F_OVER <= f < F_OVER + 8:
        amp = max(amp, (1 - inv(f, F_OVER, F_OVER + 8)) * 26 * SS)
    if amp == 0:
        return 0, 0
    return (math.sin(f * 5.7) * amp, math.cos(f * 7.3) * amp * 0.8)


# ---- рисуване --------------------------------------------------------
def _wave_edge(y0, amp, period, ph):
    """Плавен ръб от повтарящи се гърбици — класическа cartoon вълна."""
    pts = []
    x = 0
    step = 5 * SS
    while x <= SW + step:
        y = (y0
             - amp * abs(math.sin(x / period * math.pi + ph))
             + math.sin(x / (period * 3.3) + ph * 0.7) * amp * 0.30)
        pts.append((x, y))
        x += step
    return pts


def draw_sea(d, f, hz):
    """Слоести вълнови ленти с бял кант — плоски цветове, без градиенти."""
    t = f / FPS
    depth = SH - hz
    d.rectangle([0, hz - 2 * SS, SW, SH], fill=SEA_TOP)
    d.line([(0, hz), (SW, hz)], fill=(18, 40, 78), width=max(2, int(3 * SS)))

    layers = [
        (0.035, SEA_LIGHT, 10, 0.085, 0.9),
        (0.115, SEA_MID,   18, 0.130, 1.25),
        (0.250, SEA_DEEP,  28, 0.185, 1.6),
        (0.430, (10, 30, 68), 40, 0.250, 2.0),
        (0.660, (7, 22, 52), 54, 0.330, 2.4),
    ]
    for off, col, amp, wl, sp in layers:
        y0 = hz + off * depth
        pts = _wave_edge(y0, amp * SS, wl * SW, t * sp)
        d.polygon(pts + [(SW, SH), (0, SH)], fill=col)
        d.line(pts, fill=FOAM, width=max(2, int(4 * SS)), joint='curve')

    # ситни бели чертички за блясък по водата
    import random
    random.seed(11)
    for k in range(26):
        yy = hz + random.uniform(0.05, 0.95) * depth
        xx = (random.uniform(0, 1) + math.sin(t * 0.9 + k) * 0.02) % 1.0 * SW
        ln = random.uniform(18, 60) * SS
        d.line([xx, yy, xx + ln, yy], fill=FOAM, width=max(2, int(3 * SS)))


def draw_bulge(d, f, hz):
    """Издуване и кръгове по водата точно преди изскачането."""
    k = inv(f, F_ANTIC, F_BURST)
    if k <= 0:
        return
    cx = SW * 0.5
    w = (120 + 190 * k) * SS
    h = (16 + 70 * k) * SS
    d.ellipse([cx - w, hz - h, cx + w, hz + h * 0.9], fill=SEA_TOP)
    d.arc([cx - w, hz - h, cx + w, hz + h * 0.9], 180, 360, fill=FOAM, width=6 * SS)
    for i in range(3):
        rr = (60 + i * 90) * (0.4 + k) * SS
        d.ellipse([cx - rr, hz - rr * 0.22, cx + rr, hz + rr * 0.22],
                  outline=FOAM, width=int(4 * SS))


class Splash:
    """Cartoon пръски: малки капки с черен контур, не топки."""

    def __init__(self):
        self.drops = []

    def spawn(self, cx, cy):
        import random
        random.seed(7)
        for _ in range(95):
            a = random.uniform(-math.pi * 0.93, -math.pi * 0.07)
            sp = random.uniform(11, 40) * SS
            self.drops.append([cx + random.uniform(-90, 90) * SS, cy,
                               math.cos(a) * sp * random.uniform(0.7, 1.6),
                               math.sin(a) * sp,
                               random.uniform(3.5, 11) * SS])

    def step(self):
        for p in self.drops:
            p[3] += 1.6 * SS
            p[0] += p[2]
            p[1] += p[3]

    def draw(self, d, hz):
        for x, y, vx, vy, r in self.drops:
            if y > hz + 20 * SS:
                continue
            st = min(2.0, 1.0 + math.hypot(vx, vy) / (34 * SS))   # издължени в полет
            d.ellipse([x - r, y - r * st, x + r, y + r * st], fill=FOAM,
                      outline=INK, width=max(2, int(2 * SS)))


def draw_crown(frame, f, hz):
    """Водният взрив е облак от слети мехури с ЕДИН общ контур.

    Шипове с топки отгоре четяха като кралска корона; обединената
    силуетна маска дава мекия „foam cloud", типичен за рисуваната анимация.
    """
    k = inv(f, F_BURST, F_BURST + 18)
    if k <= 0 or k >= 1:
        return
    cx = SW * 0.5
    grow = ease_out(min(k * 2.3, 1.0))
    fade = 1 - ease_in(k)
    if fade <= 0.02:
        return
    rise = 560 * SS * grow * fade
    spread = (230 + 260 * grow) * SS

    # (относително x, относителна височина, радиус)
    blobs = [(-1.00, 0.02, 0.30), (-0.62, 0.10, 0.36), (-0.22, 0.06, 0.40),
             (0.22, 0.07, 0.39), (0.62, 0.11, 0.35), (1.00, 0.02, 0.29),
             (-0.70, 0.42, 0.25), (-0.30, 0.58, 0.27), (0.10, 0.66, 0.26),
             (0.48, 0.50, 0.25), (0.80, 0.34, 0.21),
             (-0.34, 0.92, 0.18), (0.06, 1.04, 0.19), (0.40, 0.86, 0.16),
             (-0.06, 1.34, 0.12), (0.30, 1.22, 0.10), (-0.42, 1.16, 0.11)]

    pad = int(90 * SS)
    x0 = int(cx - spread * 1.25) - pad
    x1 = int(cx + spread * 1.25) + pad
    y0 = int(hz - rise * 1.5) - pad
    y1 = int(hz + 130 * SS) + pad
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(SW, x1), min(SH, y1)
    if x1 <= x0 or y1 <= y0:
        return

    mask = Image.new('L', (x1 - x0, y1 - y0), 0)
    md = ImageDraw.Draw(mask)
    wob = math.sin(f * 0.7) * 10 * SS
    for u, hgt, rr in blobs:
        bx = cx + u * spread + u * wob - x0
        by = hz - rise * hgt - y0
        r = rr * spread * (0.75 + 0.25 * fade)
        md.ellipse([bx - r, by - r, bx + r, by + r], fill=255)
    # основата се слива с водолинията
    md.rectangle([0, hz - y0, x1 - x0, y1 - y0], fill=0)

    ink_w = max(3, int(5 * SS))
    grown = mask.filter(ImageFilter.MaxFilter(ink_w * 2 + 1))
    outline = ImageChops.subtract(grown, mask)

    white = Image.new('RGBA', mask.size, FOAM + (255,))
    white.putalpha(mask)
    inner = Image.new('RGBA', mask.size, (203, 231, 250, 255))
    inner.putalpha(mask.filter(ImageFilter.MinFilter(ink_w * 6 + 1)))
    black = Image.new('RGBA', mask.size, INK + (255,))
    black.putalpha(outline)

    frame.alpha_composite(white, (x0, y0))
    frame.alpha_composite(inner, (x0, y0))
    frame.alpha_composite(black, (x0, y0))


def draw_rings(d, f, hz):
    k = inv(f, F_BURST, F_BURST + 46)
    if k <= 0 or k >= 1:
        return
    cx = SW * 0.5
    for i in range(3):
        kk = clamp(k - i * 0.13)
        if kk <= 0:
            continue
        rr = (150 + 900 * ease_out(kk)) * SS
        d.arc([cx - rr, hz - rr * 0.17, cx + rr, hz + rr * 0.17], 180, 360,
              fill=FOAM, width=max(2, int((7 - i * 2) * SS * (1 - kk))))


def draw_speedlines(d, f, cx, cy, hz=None):
    """Радиални комикс скоростни линии около изстрелването."""
    k = inv(f, F_BURST, F_BURST + 16)
    if k <= 0 or k >= 1:
        return
    a = (1 - k)
    import random
    random.seed(3)
    for i in range(30):
        ang = random.uniform(0, 6.283)
        r0 = (300 + random.uniform(0, 260)) * SS * (0.5 + k)
        r1 = r0 + (170 + random.uniform(0, 260)) * SS * a
        w = max(2, int(random.uniform(3, 9) * SS * a))
        y0 = cy + math.sin(ang) * r0
        y1 = cy + math.sin(ang) * r1
        if hz is not None and max(y0, y1) > hz - 10 * SS:
            continue                       # не чертаем върху водата
        d.line([cx + math.cos(ang) * r0, y0,
                cx + math.cos(ang) * r1, y1], fill=FOAM, width=w)


def draw_starburst(d, f, cx, cy):
    """Комикс звезда-удар при щракването в позата."""
    k = inv(f, F_OVER - 2, F_OVER + 9)
    if k <= 0 or k >= 1:
        return
    a = 1 - k
    R = (260 + 520 * ease_out(k)) * SS
    pts = []
    spikes = 14
    for i in range(spikes * 2):
        ang = i * math.pi / spikes - 1.2
        r = R if i % 2 == 0 else R * 0.52
        pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r * 0.92))
    d.polygon(pts, outline=(255, 236, 150), width=max(3, int(14 * SS * a)))


WEBS = [  # (кадър, нормализирана котва в спрайта, посока, дължина)
    (F_WEB_A, (0.135, 0.045), (-0.62, -0.78), 1.55),
    (F_WEB_B, (0.100, 0.470), (-0.52, -0.855), 1.45),
]


def draw_webs(d, f, hx, hy, hw, hh):
    for start, anchor, dirn, ln in WEBS:
        k = inv(f, start, start + 5)
        if k <= 0:
            return_after = False
        if k <= 0:
            continue
        # прибиране към края
        k *= 1 - inv(f, F_FADE - 26, F_FADE - 6)
        if k <= 0.02:
            continue
        ox = hx + (anchor[0] - 0.5) * hw
        oy = hy + (anchor[1] - 0.5) * hh
        L = ln * SH * ease_out(k)
        ex, ey = ox + dirn[0] * L, oy + dirn[1] * L
        seg = 16
        pts = []
        nx, ny = -(ey - oy), (ex - ox)
        nl = math.hypot(nx, ny) or 1
        age = max(0, f - start)
        vib = math.exp(-age * 0.22) * 26 * SS
        for i in range(seg + 1):
            u = i / seg
            off = math.sin(u * math.pi) * math.sin(age * 1.6 + u * 7) * vib
            pts.append((lerp(ox, ex, u) + nx / nl * off,
                        lerp(oy, ey, u) + ny / nl * off))
        d.line(pts, fill=INK, width=max(3, int(15 * SS)), joint='curve')
        d.line(pts, fill=FOAM, width=max(2, int(8 * SS)), joint='curve')
        # напречни нишки на паяжината
        for i in range(2, seg - 1, 3):
            px, py = pts[i]
            d.ellipse([px - 7 * SS, py - 7 * SS, px + 7 * SS, py + 7 * SS],
                      fill=FOAM, outline=INK, width=max(2, int(2 * SS)))


def paste_hero(canvas, sprite, f, cx, cy):
    sx, sy = hero_stretch(f)
    sc = hero_scale(f)
    w = max(2, int(sprite.width * sc * sx))
    h = max(2, int(sprite.height * sc * sy))
    im = sprite.resize((w, h), Image.LANCZOS).rotate(hero_rot(f), Image.BICUBIC,
                                                     expand=True)
    # smear: няколко полупрозрачни копия под него по време на изстрелването
    smear = inv(f, F_BURST, F_BURST + 9)
    if 0 < smear < 1:
        sil = silhouette(im, (196, 42, 48))
        for i in range(4, 0, -1):
            a = int(150 * (1 - smear) * (i / 5))
            g = sil.copy()
            g.putalpha(g.split()[3].point(lambda v, a=a: v * a // 255))
            canvas.alpha_composite(g, (int(cx - g.width / 2),
                                       int(cy - g.height / 2 + i * 90 * SS)))
    canvas.alpha_composite(im, (int(cx - im.width / 2), int(cy - im.height / 2)))
    return im.width, im.height


def render():
    os.makedirs(OUT, exist_ok=True)
    sky = make_sky()
    half = make_halftone()
    hero = outlined_hero('/home/user/youtemplate-recreation/spiderman.png')
    splash = Splash()
    fired = False

    for f in range(F_END):
        hz = horizon(f)
        # небето се пълзи надолу заедно с хоризонта
        sky_off = int(hz - 0.605 * SH)
        frame = Image.new('RGBA', (SW, SH), (0, 0, 0, 255))
        frame.paste(sky.crop((0, sky.height - SH - sky_off,
                              SW, sky.height - sky_off)), (0, 0))
        d = ImageDraw.Draw(frame)

        cx, cy = SW * 0.5, hero_y(f)
        hw = hh = 0
        # Героят се рисува ПРЕДИ морето: така водата го скрива, докато е под
        # повърхността, и той наистина изплува през нея.
        if f >= F_BURST:
            hw, hh = paste_hero(frame, hero, f, cx, cy)
            d = ImageDraw.Draw(frame)

        draw_bulge(d, f, hz)
        draw_sea(d, f, hz)

        if f >= F_BURST:
            if not fired:
                splash.spawn(SW * 0.5, hz)
                fired = True
            draw_crown(frame, f, hz)
            d = ImageDraw.Draw(frame)
            draw_rings(d, f, hz)
            draw_speedlines(d, f, cx, cy, hz)

        if fired:
            splash.step()
            splash.draw(d, hz)

        if f >= F_BURST:
            draw_webs(d, f, cx, cy, hw, hh)
            draw_starburst(d, f, cx, cy)

        # полутон върху небето за комикс текстура
        if f >= F_BURST:
            k = inv(f, F_BURST, F_BURST + 20)
            if 0 < k < 1:
                tone = Image.new('RGBA', (SW, SH), (255, 255, 255, 0))
                tone.putalpha(half.point(lambda v, k=k: int(v * 0.16 * (1 - k))))
                frame.alpha_composite(tone)

        # тресене на камерата
        dx, dy = shake(f)
        if dx or dy:
            frame = ImageChops.offset(frame, int(dx), int(dy))

        out = frame.convert('RGB').resize((W, H), Image.LANCZOS)

        # затъмняване към края
        fade = inv(f, F_FADE, F_END - 4)
        if fade > 0:
            out = Image.blend(out, Image.new('RGB', (W, H), (0, 0, 0)), ease_io(fade))

        out.save(f'{OUT}/f{f + 1:04d}.png')
        if (f + 1) % 20 == 0:
            print('  %d/%d' % (f + 1, F_END), flush=True)
    print('DONE')


if __name__ == '__main__':
    render()
