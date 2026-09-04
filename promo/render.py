"""Build the vertical concert promo from the seven source clips.

Only the supplied footage is used. Shots are re-framed, re-timed, graded and
cut together; the transitions rip the frame apart physically. Nothing is
generated: the only added element is the band's own logo, which closes the
edit.
"""

import os
import subprocess
import sys

import numpy as np
from PIL import Image

import tornfilm as tf
from tornfilm import H, W

FPS = 30
UP = os.environ.get(
    "PROMO_SRC",
    "/root/.claude/uploads/38da5e2f-8246-5655-880d-8e28fbbc2dbf",
)

# Source clips. A/B/C are trimmed short of the trailing app outro card each
# of them carries; D-G run clean to the end. D, E and F are 720x1280 and are
# scaled up to the 1080x1920 timeline on decode.
SRC = {
    "A": (f"{UP}/0e5e49bf-copy_CC8DD977890C41C08CBBE9B65B7EF9F0.mov", 6.0),
    "B": (f"{UP}/1d16230a-copy_E86BFBEFCC9F4491B7273090EE42AF2A.mov", 6.6),
    "C": (f"{UP}/7748be66-copy_E0792E9D4E6D4775832901CF7195E626.mov", 13.2),
    "D": (f"{UP}/95297706-copy_58F8F1F5DCFB48818D866C1F722EF75F.mov", 4.7),
    "E": (f"{UP}/a5dfdf39-copy_4505F4A3FDDE4CC8835507BAB5216B1D.mov", 11.9),
    "F": (f"{UP}/f38e8ecc-copy_2DB5F7EF9CE04896A740BA1E239CB937.mov", 21.5),
    "G": (f"{UP}/18d86975-copy_3A60ACACE1B14B47A64B0F19D5F7883F.mov", 14.7),
}

LOGO = f"{UP}/dd53e4b7-image.webp"

_cache = {}


def decode(key, start, nframes):
    """Pull a span of source frames as uint8 RGB."""
    path, limit = SRC[key]
    start = max(0.0, min(start, limit - nframes / FPS - 0.05))
    ck = (key, round(start, 3), nframes)
    if ck in _cache:
        return _cache[ck]
    cmd = [
        "ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path,
        "-frames:v", str(nframes),
        "-vf", f"scale={W}:{H}:flags=lanczos",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8)
    n = a.size // (H * W * 3)
    if n == 0:
        raise RuntimeError(f"no frames decoded for {key}@{start}")
    a = a[: n * H * W * 3].reshape(n, H, W, 3)
    if len(_cache) > 6:
        _cache.clear()
    _cache[ck] = a
    return a


def smooth_noise(n, rng, scale=0.25, octaves=3):
    """Slow wandering signal for handheld drift."""
    out = np.zeros(n, np.float32)
    for o in range(octaves):
        k = 2 ** o
        pts = rng.normal(size=n // max(1, 12 // k) + 3).astype(np.float32)
        x = np.linspace(0, len(pts) - 2, n)
        i = x.astype(int)
        f = tf.smoothstep(x - i)
        out += (pts[i] * (1 - f) + pts[i + 1] * f) * scale / k
    return out


def time_curve(n, ramp):
    """Source-frame advance per output frame (speed ramping)."""
    t = np.linspace(0, 1, n, dtype=np.float32)
    if ramp == "none":
        return np.ones(n, np.float32)
    if ramp == "slow":
        return np.full(n, 0.38, np.float32)
    if ramp == "fast":
        return np.full(n, 1.9, np.float32)
    if ramp == "ramp_down":            # fast -> slow
        return 2.1 - 1.75 * tf.smoothstep(t)
    if ramp == "ramp_up":              # slow -> fast
        return 0.35 + 1.9 * tf.smoothstep(t)
    if ramp == "fast_slow_fast":
        d = np.exp(-((t - 0.5) ** 2) / (2 * 0.16 ** 2))
        return 2.2 - 1.85 * d
    return np.ones(n, np.float32)


def render_shot(shot, seed):
    """Re-frame, re-time, shake and grade one shot."""
    rng = np.random.default_rng(seed)
    n = shot["dur"]
    speeds = time_curve(n, shot.get("ramp", "none"))
    pos = np.concatenate([[0.0], np.cumsum(speeds)[:-1]])
    span = int(np.ceil(pos[-1])) + 3

    src = decode(shot["src"], shot["t"], span)
    ns = len(src)

    z0, z1 = shot.get("z0", 1.2), shot.get("z1", 1.3)
    cx, cy = shot.get("cx", 0.5), shot.get("cy", 0.5)
    cx1, cy1 = shot.get("cx1", cx), shot.get("cy1", cy)

    amp = shot.get("shake", 1.0)
    sx = smooth_noise(n, rng, 13.0 * amp)
    sy = smooth_noise(n, rng, 11.0 * amp)
    # a small jolt as the camera is thrown onto the new subject
    jolt = np.exp(-np.arange(n) / 3.0) * rng.normal(0, 16, 1)[0] * amp
    sx = sx + jolt

    # Auto-iris. The venue lighting swings from blown-out spotlights to black
    # within a single shot, so a fixed gain leaves some frames dead. Meter
    # every frame and follow it, smoothed over about a third of a second so
    # the strobing still reads as flicker rather than being levelled flat.
    zm = (z0 + z1) / 2
    mcw, mch = W / zm, H / zm
    ml = float(np.clip((cx + cx1) / 2 * W - mcw / 2, 0, W - mcw))
    mt = float(np.clip((cy + cy1) / 2 * H - mch / 2, 0, H - mch))
    keep = int(96 * 170 * 0.35)
    lvls = np.empty(n, np.float32)
    for i in range(n):
        k = min(ns - 1, int(pos[i]))
        probe = np.asarray(
            Image.fromarray(src[k]).resize((96, 170), Image.BILINEAR,
                                           box=(ml, mt, ml + mcw, mt + mch)),
            np.float32) / 255.0
        lvls[i] = np.mean(np.sort(probe.mean(2), axis=None)[-keep:])

    gain = np.clip(0.30 / np.maximum(lvls, 0.02), 0.85, 3.2)
    if n > 2:                       # smooth so the iris glides, never pumps
        k = np.hanning(min(11, n if n % 2 else n - 1) + 2)[1:-1]
        k /= k.sum()
        gain = np.convolve(np.pad(gain, len(k) // 2, mode="edge"), k, "valid")
    exposures = gain[:n] * shot.get("exposure", 1.0)

    frames = []
    prev_box = None
    for i in range(n):
        u = tf.smoothstep(i / max(1, n - 1))
        z = z0 + (z1 - z0) * u
        ccx = cx + (cx1 - cx) * u
        ccy = cy + (cy1 - cy) * u

        cw, ch = W / z, H / z
        left = ccx * W - cw / 2 + sx[i]
        top = ccy * H - ch / 2 + sy[i]
        left = float(np.clip(left, 0, W - cw))
        top = float(np.clip(top, 0, H - ch))
        box = (left, top, left + cw, top + ch)

        p = pos[i]
        i0 = int(np.floor(p))
        i0 = min(i0, ns - 1)
        i1 = min(i0 + 1, ns - 1)
        fr = p - i0
        if fr > 0.02 and speeds[i] < 0.85:
            # blend neighbours so slow motion glides instead of stuttering
            f = (src[i0].astype(np.float32) * (1 - fr)
                 + src[i1].astype(np.float32) * fr).astype(np.uint8)
        else:
            f = src[i0]

        im = Image.fromarray(f).resize((W, H), Image.BICUBIC, box=box)
        a = np.asarray(im, np.uint8)

        # motion blur when the frame is moving fast (whip / hard punch-in)
        if prev_box is not None:
            vel = abs(box[0] - prev_box[0]) + abs(box[1] - prev_box[1])
            vel += abs((box[2] - box[0]) - (prev_box[2] - prev_box[0])) * 0.8
            if vel > 4.0:
                a = tf.box_blur(a, min(7, int(vel / 3.0)))
        prev_box = box

        a = tf.grade(
            a,
            preset=shot.get("grade", "magenta"),
            contrast=shot.get("contrast", 1.22),
            sat=shot.get("sat", 1.34),
            black=shot.get("black", 0.055),
            bloom=shot.get("bloom", 0.55),
            exposure=float(exposures[i]),
        )
        if shot.get("flare"):
            fx, fy = shot["flare"]
            a = tf.lens_flare(a, fx * W, fy * H,
                              strength=shot.get("flare_str", 0.5))
        if shot.get("leak"):
            a = tf.light_leak(a, i, seed=seed, strength=shot["leak"])
        frames.append(a)

    return frames


def logo_card(bg, logo_rgba, scale=1.0, opacity=1.0, dim=1.0):
    """The band mark held over the footage, which keeps moving behind it.

    The supplied artwork is a solid silhouette; it is carried through at full
    shape and rendered as light so it reads against the dark stage footage.
    """
    out = bg.astype(np.float32) * dim

    lw = int(W * 0.60 * scale)
    lh = int(lw * logo_rgba.height / logo_rgba.width)
    lg = np.asarray(logo_rgba.resize((lw, lh), Image.LANCZOS), np.float32) / 255.0
    alpha = lg[:, :, 3] * opacity

    x0 = (W - lw) // 2
    y0 = int(H * 0.50) - lh // 2

    a = np.zeros((H, W), np.float32)
    a[y0:y0 + lh, x0:x0 + lw] = alpha

    # a soft halo so the mark sits in the light of the stage, not on top of it
    halo = tf.blur((a * 255).astype(np.uint8), 34).astype(np.float32) / 255.0
    out += (halo * 46.0)[:, :, None]
    out = out * (1 - a[:, :, None]) + 246.0 * a[:, :, None]
    return np.clip(out, 0, 255).astype(np.uint8)


def make_outro(tail, rng, hold=54, fade=20):
    """Rip from the last shot to the logo, hold, then settle out to black."""
    logo_rgba = Image.open(LOGO).convert("RGBA")
    frames = []

    # the footage carries on behind the mark, slowed and pushed down in
    # brightness so the logo is what the eye lands on
    n_bg = len(tail)
    for i in range(hold + fade):
        bg = tail[min(i, n_bg - 1)]
        bg = tf.box_blur(bg, 2)
        ease = tf.smoothstep(min(1.0, i / 14.0))
        scale = 1.045 - 0.045 * ease          # settles in, then rests
        dim = 0.62 - 0.20 * ease
        f = logo_card(bg, logo_rgba, scale=scale, opacity=1.0, dim=dim)
        if i >= hold:                          # fade out, unhurried
            k = 1.0 - tf.smoothstep((i - hold) / max(1, fade - 1))
            f = np.clip(f.astype(np.float32) * k, 0, 255).astype(np.uint8)
        frames.append(f)
    return frames


# --------------------------------------------------------------- the edit
#
# Rhythm: hard cut -> punch-in -> crowd -> torn film -> close-up -> flash ->
# low angle -> speed ramp -> torn strips -> double exposure -> hard cut ->
# blown light -> crowd -> torn -> slow motion -> hard cut, building throughout.

CU = dict(cx=0.60, cy=0.56)
ECU = dict(cx=0.63, cy=0.52)
CROWD = dict(cx=0.30, cy=0.66)
CROWD2 = dict(cx=0.62, cy=0.70)
HANDS = dict(cx=0.46, cy=0.70)
LIGHTS = dict(cx=0.42, cy=0.13)
LOW = dict(cx=0.52, cy=0.76)

EDIT = [
    # --- opening: the room fills, before the noise -----------------------
    dict(src="A", t=3.6, dur=26, z0=1.30, z1=1.55, cx=0.50, cy=0.50,
         grade="amber", ramp="ramp_up", shake=0.9, out="torn_thin"),
    dict(src="B", t=1.6, dur=18, z0=1.9, z1=1.6, cx=0.45, cy=0.45,
         grade="purple", shake=0.8, bloom=0.75, out="cut"),
    dict(src="F", t=4.6, dur=22, z0=1.20, z1=1.42, cx=0.5, cy=0.62,
         grade="blue", shake=1.0, bloom=0.8, out="torn_strips"),

    # --- the room is full: first look at the stage -----------------------
    dict(src="F", t=1.6, dur=26, z0=1.10, z1=1.30, cx=0.50, cy=0.45,
         grade="magenta", shake=1.0, bloom=1.0, ramp="ramp_up",
         out="cut"),
    dict(src="F", t=2.4, dur=15, z0=2.3, z1=2.7, cx=0.48, cy=0.40,
         grade="red", shake=1.5, out="flash_white"),
    dict(src="F", t=3.2, dur=20, z0=1.5, z1=1.8, cx=0.50, cy=0.78,
         grade="purple", shake=1.3, out="torn_big"),
    dict(src="E", t=2.6, dur=17, z0=2.0, z1=2.4, cx=0.42, cy=0.44,
         grade="red", shake=1.5, out="cut"),
    dict(src="G", t=4.3, dur=22, z0=1.35, z1=1.15, cx=0.52, cy=0.52,
         grade="blue", shake=1.2, bloom=1.05, flare=(0.46, 0.30),
         out="torn_strips"),

    # --- into the crowd ---------------------------------------------------
    dict(src="C", t=4.05, dur=15, z0=2.1, z1=2.45, **CROWD,
         grade="red", shake=1.4, out="cut"),
    dict(src="F", t=9.6, dur=18, z0=1.7, z1=2.0, cx=0.50, cy=0.72,
         grade="magenta", shake=1.5, ramp="fast", out="flash_camera"),
    dict(src="D", t=0.4, dur=20, z0=1.30, z1=1.55, cx=0.45, cy=0.50,
         grade="blue", shake=1.2, bloom=0.9, out="torn_thin"),
    dict(src="E", t=6.2, dur=16, z0=1.8, z1=2.1, cx=0.52, cy=0.52,
         grade="red", shake=1.5, out="cut"),
    dict(src="C", t=0.5, dur=13, z0=2.9, z1=3.2, **ECU,
         grade="magenta", shake=1.6, out="double"),
    dict(src="F", t=14.6, dur=24, z0=1.15, z1=1.35, cx=0.50, cy=0.50,
         grade="purple", shake=1.1, bloom=0.9, out="torn_strips"),

    # --- first drop: shorter, harder -------------------------------------
    dict(src="G", t=1.2, dur=15, z0=2.2, z1=2.6, cx=0.46, cy=0.44,
         grade="red", shake=1.6, ramp="fast", out="cut"),
    dict(src="A", t=0.5, dur=13, z0=1.6, z1=2.1, cx=0.42, cy=0.62,
         grade="amber", shake=1.2, out="torn_linger"),
    dict(src="F", t=5.0, dur=19, z0=1.45, z1=1.25, cx=0.50, cy=0.42,
         grade="magenta", shake=1.3, bloom=1.0, out="cut"),
    dict(src="C", t=7.05, dur=14, z0=2.2, z1=2.6, **CROWD,
         grade="red", shake=1.6, out="flash_hot"),
    dict(src="E", t=9.4, dur=18, z0=1.9, z1=1.65, cx=0.50, cy=0.50,
         grade="blue", shake=1.4, ramp="ramp_down", out="torn_big"),
    dict(src="B", t=4.7, dur=13, z0=1.7, z1=2.2, cx=0.55, cy=0.5,
         grade="purple", shake=1.1, out="cut"),
    dict(src="F", t=6.4, dur=20, z0=1.6, z1=1.9, cx=0.52, cy=0.46,
         grade="red", shake=1.4, out="torn_strips"),
    dict(src="G", t=12.2, dur=17, z0=1.5, z1=1.8, cx=0.50, cy=0.46,
         grade="magenta", shake=1.5, out="cut"),

    # --- breath: one longer held shot ------------------------------------
    dict(src="F", t=17.2, dur=42, z0=1.35, z1=1.10, cx=0.50, cy=0.52,
         grade="blue", shake=0.8, ramp="slow", bloom=0.75,
         flare=(0.47, 0.22), out="torn_thin"),

    # --- second drop: fastest section ------------------------------------
    dict(src="C", t=3.4, dur=12, z0=2.5, z1=2.9, **ECU,
         grade="magenta", shake=1.7, out="cut"),
    dict(src="F", t=19.4, dur=16, z0=1.8, z1=2.1, cx=0.48, cy=0.74,
         grade="purple", shake=1.7, ramp="fast", out="torn_strips"),
    dict(src="E", t=4.6, dur=15, z0=2.1, z1=2.4, cx=0.46, cy=0.48,
         grade="red", shake=1.6, out="flash_white"),
    dict(src="D", t=2.5, dur=17, z0=1.7, z1=2.0, cx=0.45, cy=0.46,
         grade="blue", shake=1.4, out="cut"),
    dict(src="F", t=7.6, dur=19, z0=1.25, z1=1.5, cx=0.50, cy=0.40,
         grade="magenta", shake=1.2, bloom=1.1, out="torn_big"),
    dict(src="A", t=2.2, dur=14, z0=1.8, z1=2.3, cx=0.38, cy=0.58,
         grade="amber", shake=1.3, leak=0.45, out="cut"),
    dict(src="G", t=6.4, dur=20, z0=1.55, z1=1.30, cx=0.50, cy=0.50,
         grade="red", shake=1.4, ramp="fast_slow_fast", out="torn_linger"),
    dict(src="C", t=8.7, dur=16, z0=2.2, z1=2.6, cx=0.30, cy=0.62,
         grade="magenta", shake=1.6, out="cut"),
    dict(src="F", t=4.2, dur=18, z0=2.0, z1=1.7, cx=0.52, cy=0.44,
         grade="blue", shake=1.5, out="double"),
    dict(src="E", t=0.6, dur=17, z0=1.5, z1=1.8, cx=0.50, cy=0.60,
         grade="red", shake=1.3, out="torn_strips"),
    dict(src="C", t=5.6, dur=17, z0=1.35, z1=1.6, **LIGHTS,
         grade="blue", shake=1.0, bloom=1.15, flare=(0.44, 0.15),
         out="flash_camera"),
    dict(src="G", t=9.6, dur=19, z0=1.6, z1=1.35, cx=0.50, cy=0.48,
         grade="magenta", shake=1.4, out="cut"),
    dict(src="B", t=0.6, dur=13, z0=2.0, z1=2.5, cx=0.48, cy=0.38,
         grade="purple", shake=1.3, bloom=0.95, out="torn_thin"),

    # --- final build ------------------------------------------------------
    dict(src="C", t=4.5, dur=16, z0=2.4, z1=2.1, **CROWD,
         grade="magenta", shake=1.6, out="cut"),
    dict(src="F", t=13.0, dur=18, z0=1.9, z1=1.6, cx=0.50, cy=0.70,
         grade="red", shake=1.6, ramp="fast", out="torn_strips"),
    dict(src="E", t=7.4, dur=15, z0=2.2, z1=2.5, cx=0.50, cy=0.50,
         grade="magenta", shake=1.7, out="flash_white"),
    dict(src="G", t=13.4, dur=17, z0=1.7, z1=1.45, cx=0.50, cy=0.44,
         grade="blue", shake=1.4, out="cut"),
    dict(src="C", t=4.2, dur=26, z0=2.4, z1=1.15, cx=0.36, cy=0.66,
         cx1=0.5, cy1=0.52, grade="magenta", shake=1.2, bloom=1.0,
         ramp="ramp_down", out="torn_big"),
    dict(src="F", t=2.0, dur=34, z0=1.45, z1=1.15, cx=0.50, cy=0.46,
         grade="purple", shake=1.0, bloom=1.0, ramp="ramp_up",
         flare=(0.50, 0.24), out="torn_thin"),

    # --- last shot, slowing into the logo --------------------------------
    dict(src="F", t=15.6, dur=52, z0=1.30, z1=1.06, cx=0.50, cy=0.50,
         grade="magenta", shake=0.85, ramp="ramp_down", bloom=0.85,
         flare=(0.48, 0.20), out="logo"),
]


def build(outfile, preview=None):
    rng = np.random.default_rng(20240904)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-",
         "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "21",
         "-x264-params", "aq-mode=3:aq-strength=0.9",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-color_primaries", "bt709", "-color_trc", "bt709",
         "-colorspace", "bt709", outfile],
        stdin=subprocess.PIPE,
    )

    idx = [0]
    leak_at = set(int(x) for x in rng.choice(np.arange(60, 900), 5, replace=False))

    def emit(frame):
        i = idx[0]
        f = tf.vignette(frame, 0.34)
        if any(abs(i - L) < 12 for L in leak_at):
            near = min(leak_at, key=lambda L: abs(i - L))
            fade = 1.0 - abs(i - near) / 12.0
            f = tf.light_leak(f, i, seed=near, strength=0.42 * fade)
        f = tf.texture(f, i, grain=6.0, scanline=0.013)
        if i % 97 == 0:
            # very occasional frame displacement, as if the gate slipped
            f = np.roll(f, int(rng.integers(-3, 4)), axis=1)
        proc.stdin.write(f.tobytes())
        idx[0] += 1

    shots = EDIT if preview is None else EDIT[:preview]

    pending = None      # frames of the current shot not yet emitted
    pending_out = None
    for si, shot in enumerate(shots):
        frames = render_shot(shot, 1000 + si * 17)

        if pending is not None:
            kind = pending_out
            if kind == "cut":
                for f in pending:
                    emit(f)
            elif kind.startswith("torn_"):
                mode = {"torn_thin": "thin", "torn_strips": "strips",
                        "torn_big": "big", "torn_linger": "linger"}[kind]
                for f in pending[:-1]:
                    emit(f)
                trans = tf.torn_transition(pending[-1], frames, rng, mode)
                for f in trans:
                    emit(f)
                frames = frames[len(trans):]
            elif kind.startswith("flash_"):
                for f in pending:
                    emit(f)
                k = {"flash_white": "white", "flash_camera": "camera",
                     "flash_hot": "hot"}[kind]
                fl = tf.flash_frames(pending[-1], frames, rng, k)
                for f in fl:
                    emit(f)
                frames = frames[len(fl):]
            elif kind == "double":
                keep = max(0, len(pending) - 6)
                for f in pending[:keep]:
                    emit(f)
                de = tf.double_exposure(pending[keep:], frames, n=6)
                for f in de:
                    emit(f)
                frames = frames[3:]
            elif kind == "logo":
                for f in pending:
                    emit(f)
            else:
                for f in pending:
                    emit(f)

        pending = frames
        pending_out = shot.get("out", "cut")
        print(f"  shot {si + 1}/{len(shots)} {shot['src']} "
              f"{len(frames)}f -> {pending_out}", flush=True)

    if pending_out == "logo":
        # rip one last time, from the closing shot into the band mark
        for f in pending:
            emit(f)
        # the crowd keeps moving behind the mark, in slow motion
        bg = render_shot(dict(src="F", t=17.8, dur=74, z0=1.12, z1=1.02,
                              cx=0.50, cy=0.50, grade="magenta", shake=0.5,
                              ramp="slow", bloom=0.7), 4242)
        outro = make_outro(bg, rng)
        for f in tf.torn_transition(pending[-1], outro, rng, "strips"):
            emit(f)
        for f in outro[6:]:
            emit(f)
    else:
        for f in pending:
            emit(f)

    proc.stdin.close()
    proc.wait()
    print(f"wrote {outfile}: {idx[0]} frames, {idx[0] / FPS:.2f}s")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "promo.mp4"
    pv = int(sys.argv[2]) if len(sys.argv) > 2 else None
    build(out, pv)
