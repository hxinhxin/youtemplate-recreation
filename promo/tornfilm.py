"""Physical torn-film transitions, analog texture and concert grading.

Everything here is image-processing only: it re-frames, re-times, grades and
rips apart the source frames. Nothing is synthesised, no elements are drawn on
top of the footage except light (flashes, leaks, bloom) and film texture.
"""

import numpy as np
from PIL import Image, ImageFilter

H, W = 1920, 1080


# ---------------------------------------------------------------- utilities

def to_pil(a):
    return Image.fromarray(a)


def to_np(im):
    return np.asarray(im, dtype=np.uint8)


def blur(a, radius):
    if radius <= 0:
        return a
    return to_np(to_pil(a).filter(ImageFilter.GaussianBlur(radius)))


def box_blur(a, radius):
    if radius <= 0:
        return a
    return to_np(to_pil(a).filter(ImageFilter.BoxBlur(radius)))


def hblur(a, radius):
    """Directional (horizontal) blur - used for strips sliding sideways."""
    r = int(round(radius))
    if r <= 0:
        return a
    f = a.astype(np.float32)
    acc = np.zeros_like(f)
    n = 0
    for dx in range(-r, r + 1, max(1, r // 4)):
        acc += np.roll(f, dx, axis=1)
        n += 1
    return np.clip(acc / n, 0, 255).astype(np.uint8)


def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3 - 2 * t)


# ------------------------------------------------------------ torn geometry

def tear_line(y0, rng, roughness=1.0, scale=1.0):
    """An irregular, hand-ripped horizontal edge: y as a function of x.

    Built from a few octaves of smoothly interpolated noise (the broad sweep of
    a rip) plus high-frequency jitter (paper fibre). Deliberately not a clean
    curve - real tears wander and catch.
    """
    x = np.linspace(0.0, 1.0, W)
    y = np.zeros(W, dtype=np.float32)
    for octave, amp in ((3, 46.0), (7, 22.0), (17, 11.0), (41, 5.0)):
        pts = rng.normal(size=octave + 2).astype(np.float32)
        pos = x * octave
        i = pos.astype(np.int32)
        f = smoothstep(pos - i)
        y += (pts[i] * (1 - f) + pts[i + 1] * f) * amp * roughness * scale
    # fibrous micro-jitter along the rip
    y += rng.normal(size=W).astype(np.float32) * 2.2 * roughness
    # occasional deep catches where the paper gave way unevenly
    for _ in range(rng.integers(1, 4)):
        c = rng.integers(0, W)
        wdt = int(rng.integers(30, 160))
        depth = rng.normal() * 26 * roughness
        lo, hi = max(0, c - wdt), min(W, c + wdt)
        ramp = np.hanning(max(2, hi - lo)).astype(np.float32)
        y[lo:hi] += ramp * depth
    return y0 + y


YY = np.arange(H, dtype=np.float32)[:, None]
XX = np.arange(W, dtype=np.float32)[None, :]


def band_mask(top, bottom):
    """Boolean mask of the region between two torn edges."""
    return (YY >= top[None, :]) & (YY < bottom[None, :])


def shift(a, dx, dy):
    """Translate without wrapping - a torn piece that slides off the frame is
    gone, it does not reappear on the other side."""
    dx, dy = int(dx), int(dy)
    if dx == 0 and dy == 0:
        return a
    out = np.zeros_like(a)
    ys0, ys1 = max(0, dy), min(H, H + dy)
    xs0, xs1 = max(0, dx), min(W, W + dx)
    if ys0 >= ys1 or xs0 >= xs1:
        return out
    out[ys0:ys1, xs0:xs1] = a[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx]
    return out


def paste(base, piece, mask, dx, dy, edge=0.0, shadow=0.30, dirblur=0.0):
    """Drop a torn piece of the previous shot onto the incoming frame.

    `edge` lights the raw fibres along the rip, `shadow` casts the piece onto
    what shows through underneath - the two cues that make it read as a
    physical fragment rather than a digital wipe.
    """
    m = shift(mask, dx, dy)
    p = shift(piece, dx, dy)
    if dirblur > 0:
        p = hblur(p, dirblur)
        # the moving fragment smears its own silhouette a little
        mf = box_blur((m * 255).astype(np.uint8), max(1, int(dirblur * 0.5)))
        m_soft = mf.astype(np.float32) / 255.0
    else:
        m_soft = m.astype(np.float32)

    out = base.astype(np.float32)

    if shadow > 0:
        sh = box_blur((m * 255).astype(np.uint8), 9).astype(np.float32) / 255.0
        sh = shift(sh, 9, 14)
        sh = np.clip(sh - m_soft, 0, 1)
        out *= (1.0 - shadow * sh)[:, :, None]

    a = m_soft[:, :, None]
    out = out * (1 - a) + p.astype(np.float32) * a

    if edge > 0:
        # raw fibre highlight: the sliver between the piece and its interior
        inner = m.copy()
        for dyy, dxx in ((1, 0), (-1, 0), (0, 1), (0, -1), (2, 0), (-2, 0)):
            inner &= shift(m, dxx, dyy)
        fibre = (m & ~inner).astype(np.float32)
        fibre = box_blur((fibre * 255).astype(np.uint8), 1).astype(np.float32) / 255.0
        out += (fibre * 255.0 * edge)[:, :, None]

    return np.clip(out, 0, 255).astype(np.uint8)


# ------------------------------------------------------------- transitions

def torn_transition(prev, nxt_frames, rng, mode="strips"):
    """Yield the frames of one physical rip.

    prev        : the last frame of the outgoing shot (held, as a photograph)
    nxt_frames  : the incoming shot's frames, live underneath the tear
    """
    out = []

    if mode == "thin":
        n = min(5, len(nxt_frames))
        y0 = float(rng.integers(int(H * 0.28), int(H * 0.72)))
        a = tear_line(y0, rng, roughness=1.0)
        b = tear_line(y0 + 4, rng, roughness=1.0)
        upper = band_mask(np.full(W, -H, np.float32), a)
        lower = band_mask(b, np.full(W, 2.0 * H, np.float32))
        for i in range(n):
            t = (i + 1) / n
            base = nxt_frames[i]
            gap = t * H * 0.75
            f = paste(base, prev, upper, int(-8 * t), int(-gap * 0.55),
                      edge=0.55 * (1 - t), shadow=0.34, dirblur=10 * t)
            f = paste(f, prev, lower, int(10 * t), int(gap * 0.62),
                      edge=0.55 * (1 - t), shadow=0.34, dirblur=12 * t)
            out.append(f)

    elif mode == "strips":
        n = min(int(rng.integers(5, 8)), len(nxt_frames))
        k = int(rng.integers(4, 7))
        edges = np.sort(rng.uniform(0.05, 0.95, k - 1)) * H
        ys = [-40.0] + list(edges) + [H + 40.0]
        lines = [tear_line(y, rng, roughness=1.0) for y in ys]
        masks = [band_mask(lines[j], lines[j + 1]) for j in range(len(ys) - 1)]
        # the rip travels down the frame: each strip is torn free a beat after
        # the one before it, then slides its own way and clears the frame
        nm = len(masks)
        dirs = [1 if rng.random() < 0.5 else -1 for _ in masks]
        speed = [rng.uniform(520, 1150) for _ in masks]
        # strips above the middle lift away, strips below fall away
        drop = [(-1 if j < nm / 2 else 1) * rng.uniform(160, 420)
                for j in range(nm)]
        order = rng.permutation(nm)
        birth = [0.0] * nm
        for rank, j in enumerate(order):
            birth[j] = 0.30 * rank / max(1, nm - 1)
        for i in range(n):
            t = (i + 1) / n
            f = nxt_frames[i]
            for j, m in enumerate(masks):
                if t < birth[j]:
                    # still attached - the old frame is intact here
                    f = paste(f, prev, m, 0, 0, edge=0.0, shadow=0.0)
                    continue
                u = (t - birth[j]) / max(1e-3, 1 - birth[j])
                if u >= 1.0:
                    continue
                e = u * u                       # tears slowly, then gives way
                dx = int(dirs[j] * speed[j] * e)
                dy = int(drop[j] * e)
                f = paste(f, prev, m, dx, dy,
                          edge=0.6 * (1 - u), shadow=0.32,
                          dirblur=speed[j] * u * 0.035)
            out.append(f)

    elif mode == "big":
        n = min(6, len(nxt_frames))
        y0 = float(rng.integers(int(H * 0.20), int(H * 0.45)))
        y1 = y0 + float(rng.integers(int(H * 0.22), int(H * 0.40)))
        a = tear_line(y0, rng, roughness=1.2)
        b = tear_line(y1, rng, roughness=1.2)
        upper = band_mask(np.full(W, -H, np.float32), a)
        lower = band_mask(b, np.full(W, 2.0 * H, np.float32))
        for i in range(n):
            t = (i + 1) / n
            f = nxt_frames[i]
            # the torn-out middle section is gone from frame one: the new shot
            # is visible through the hole, then the remains peel away
            f = paste(f, prev, upper, int(-30 * t * t), int(-H * 0.55 * t * t),
                      edge=0.6 * (1 - t), shadow=0.36, dirblur=26 * t)
            f = paste(f, prev, lower, int(36 * t * t), int(H * 0.6 * t * t),
                      edge=0.6 * (1 - t), shadow=0.36, dirblur=30 * t)
            out.append(f)

    elif mode == "linger":
        n = min(8, len(nxt_frames))
        k = 4
        edges = np.sort(rng.uniform(0.10, 0.90, k - 1)) * H
        ys = [-40.0] + list(edges) + [H + 40.0]
        lines = [tear_line(y, rng, roughness=1.0) for y in ys]
        masks = [band_mask(lines[j], lines[j + 1]) for j in range(len(ys) - 1)]
        keep = int(rng.integers(0, len(masks)))  # one shred hangs on
        for i in range(n):
            t = (i + 1) / n
            f = nxt_frames[i]
            for j, m in enumerate(masks):
                if j == keep:
                    # rides over the new shot for the whole transition
                    u = t * 0.55
                    f = paste(f, prev, m, int(26 * u), int(-14 * u),
                              edge=0.45, shadow=0.34, dirblur=6 * u)
                    continue
                u = min(1.0, t * 1.5)
                if u >= 1.0:
                    continue
                f = paste(f, prev, m,
                          int(700 * u * u * (1 if j % 2 else -1)),
                          int((-320 if j < keep else 320) * u * u),
                          edge=0.55 * (1 - u), shadow=0.3, dirblur=22 * u)
            out.append(f)

    return out


def flash_frames(prev, nxt_frames, rng, kind="white"):
    """Very short overexposure between shots."""
    out = []
    if kind == "white":
        seq = [0.95, 0.55]
    elif kind == "camera":
        seq = [1.0, 0.75, 0.30]
    else:  # blown highlight roll-off
        seq = [0.65, 0.30, 0.12]
    for i, amt in enumerate(seq):
        base = nxt_frames[min(i, len(nxt_frames) - 1)].astype(np.float32)
        f = base + (255.0 - base) * amt
        if kind == "camera" and i == 0:
            f = np.full_like(f, 255.0)
        out.append(np.clip(f, 0, 255).astype(np.uint8))
    return out


def double_exposure(prev_frames, nxt_frames, n=6):
    """Two shots living in the same frame for a moment, screen-blended."""
    out = []
    for i in range(n):
        t = (i + 1) / (n + 1)
        a = prev_frames[min(i, len(prev_frames) - 1)].astype(np.float32) / 255.0
        b = nxt_frames[min(i, len(nxt_frames) - 1)].astype(np.float32) / 255.0
        screen = 1.0 - (1.0 - a) * (1.0 - b * t * 1.25).clip(0, 1)
        mix = a * (1 - t) + screen * t
        out.append(np.clip(mix * 255.0, 0, 255).astype(np.uint8))
    return out


# ------------------------------------------------------------------- grade

GRADES = {
    "magenta": dict(gain=(1.10, 0.90, 1.12), lift=(0.010, -0.004, 0.016)),
    "red":     dict(gain=(1.18, 0.86, 0.94), lift=(0.014, -0.006, 0.004)),
    "blue":    dict(gain=(0.90, 0.98, 1.22), lift=(-0.004, 0.002, 0.020)),
    "green":   dict(gain=(0.92, 1.14, 0.96), lift=(-0.004, 0.010, 0.000)),
    "amber":   dict(gain=(1.16, 1.02, 0.82), lift=(0.014, 0.004, -0.006)),
    "purple":  dict(gain=(1.06, 0.86, 1.20), lift=(0.010, -0.006, 0.018)),
}


def grade(a, preset="magenta", contrast=1.22, sat=1.34, black=0.030,
          bloom=0.55, exposure=1.0, gamma=0.80):
    f = a.astype(np.float32) / 255.0
    g = GRADES[preset]
    f = f * np.float32(g["gain"]) + np.float32(g["lift"])
    f *= exposure

    # deep blacks, but open the mids back up so the stage stays readable
    f = (f - black) / (1.0 - black)
    f = np.clip(f, 0.0, None) ** gamma
    f = np.clip((f - 0.5) * contrast + 0.5, 0.0, 1.0)
    # filmic shoulder so stage lights roll off instead of clipping flat
    f = f * (1.0 + 0.28 * f) / (1.0 + 0.28)

    lum = f[:, :, 0] * 0.30 + f[:, :, 1] * 0.59 + f[:, :, 2] * 0.11
    f = np.clip(lum[:, :, None] + (f - lum[:, :, None]) * sat, 0.0, 1.0)

    out = (f * 255.0).astype(np.uint8)

    if bloom > 0:
        hi = np.clip((f - 0.74) / 0.26, 0, 1)
        hi = (hi * 255.0).astype(np.uint8)
        glow = blur(hi, 26).astype(np.float32) / 255.0
        glow += blur(hi, 9).astype(np.float32) / 255.0 * 0.7
        out = np.clip(out.astype(np.float32) + glow * 255.0 * bloom * 0.55,
                      0, 255).astype(np.uint8)
    return out


VIGNETTE = None


def vignette(a, amount=0.34):
    global VIGNETTE
    if VIGNETTE is None:
        y = (np.arange(H, dtype=np.float32) - H / 2) / (H / 2)
        x = (np.arange(W, dtype=np.float32) - W / 2) / (W / 2)
        r = np.sqrt(y[:, None] ** 2 * 0.62 + x[None, :] ** 2)
        VIGNETTE = np.clip(1.0 - 0.55 * np.clip(r - 0.42, 0, None) ** 1.6, 0, 1)
    v = 1.0 - (1.0 - VIGNETTE) * (amount / 0.34)
    return np.clip(a.astype(np.float32) * v[:, :, None], 0, 255).astype(np.uint8)


_NOISE = None


def texture(a, idx, grain=7.0, scanline=0.016, aberration=True):
    """Fine grain, faint scanlines and a touch of chromatic aberration."""
    global _NOISE
    if _NOISE is None:
        rng = np.random.default_rng(7)
        _NOISE = rng.normal(0, 1, size=(8, H, W)).astype(np.float32)

    f = a.astype(np.float32)

    if aberration:
        # lateral fringing, strongest at the edges of the frame
        w = np.clip((np.abs(XX - W / 2) / (W / 2) - 0.35) / 0.65, 0, 1)
        r = np.roll(f[:, :, 0], 1, axis=1)
        b = np.roll(f[:, :, 2], -1, axis=1)
        f[:, :, 0] = f[:, :, 0] * (1 - w) + r * w
        f[:, :, 2] = f[:, :, 2] * (1 - w) + b * w

    n = _NOISE[idx % 8]
    # grain sits mostly in the mids and shadows, as on real stock
    lum = f.mean(2) / 255.0
    weight = (1.0 - np.abs(lum - 0.42) * 1.4).clip(0.25, 1.0)
    f += (n * grain * weight)[:, :, None]

    if scanline > 0:
        rows = np.ones(H, np.float32)
        rows[(idx % 2)::2] -= scanline
        f *= rows[:, None, None]

    return np.clip(f, 0, 255).astype(np.uint8)


def light_leak(a, idx, seed=0, strength=0.5):
    """A warm bleed in from one edge, as if the gate weren't quite sealed."""
    rng = np.random.default_rng(seed)
    side = rng.integers(0, 4)
    phase = (idx % 30) / 30.0
    if side < 2:
        g = np.clip(1.0 - XX / (W * rng.uniform(0.35, 0.7)), 0, 1)
        if side == 1:
            g = g[:, ::-1]
    else:
        g = np.clip(1.0 - YY / (H * rng.uniform(0.3, 0.6)), 0, 1)
        if side == 3:
            g = g[::-1, :]
    g = g ** 2.0 * (0.7 + 0.3 * np.sin(phase * 6.28)) * strength
    tint = np.float32([255, 150, 90]) if side % 2 == 0 else np.float32([255, 110, 170])
    out = a.astype(np.float32) + g[:, :, None] * tint * 0.55
    return np.clip(out, 0, 255).astype(np.uint8)


def lens_flare(a, cx, cy, strength=0.6):
    """Anamorphic-ish streak off a stage light."""
    f = a.astype(np.float32)
    x = XX - cx
    y = YY - cy
    streak = np.exp(-(y ** 2) / (2 * 9.0 ** 2)) * np.exp(-(x ** 2) / (2 * 300.0 ** 2))
    glow = np.exp(-(x ** 2 + y ** 2) / (2 * 90.0 ** 2))
    add = (streak * 1.0 + glow * 0.6) * strength
    tint = np.float32([160, 190, 255])
    return np.clip(f + add[:, :, None] * tint, 0, 255).astype(np.uint8)
