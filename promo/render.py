"""Build the vertical concert promo from the three source clips.

Only the supplied footage is used. Shots are re-framed, re-timed, graded and
cut together; the transitions rip the frame apart physically. No text, logos
or generated imagery are added anywhere.
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

# Source clips, trimmed short of the trailing app outro on each.
SRC = {
    "A": (f"{UP}/0e5e49bf-copy_CC8DD977890C41C08CBBE9B65B7EF9F0.mov", 6.0),
    "B": (f"{UP}/1d16230a-copy_E86BFBEFCC9F4491B7273090EE42AF2A.mov", 6.6),
    "C": (f"{UP}/7748be66-copy_E0792E9D4E6D4775832901CF7195E626.mov", 13.2),
}

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
        "-frames:v", str(nframes), "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
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

    # Auto-exposure: the source swings from blown-out spotlights to near-black
    # crowd. Meter the middle of the shot so every framing lands somewhere
    # readable, then let the grade crush the blacks back down.
    mid = min(len(src) - 1, int(pos[len(pos) // 2]))
    zm = (z0 + z1) / 2
    mcw, mch = W / zm, H / zm
    ml = float(np.clip((cx + cx1) / 2 * W - mcw / 2, 0, W - mcw))
    mt = float(np.clip((cy + cy1) / 2 * H - mch / 2, 0, H - mch))
    probe = np.asarray(
        Image.fromarray(src[mid]).resize((96, 170), Image.BILINEAR,
                                         box=(ml, mt, ml + mcw, mt + mch)),
        np.float32) / 255.0
    lvl = float(np.mean(np.sort(probe.mean(2), axis=None)[-int(96 * 170 * 0.35):]))
    auto = float(np.clip(0.30 / max(lvl, 0.02), 0.85, 2.6))
    exposure = shot.get("exposure", 1.0) * auto

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
            exposure=exposure,
        )
        if shot.get("flare"):
            fx, fy = shot["flare"]
            a = tf.lens_flare(a, fx * W, fy * H,
                              strength=shot.get("flare_str", 0.5))
        if shot.get("leak"):
            a = tf.light_leak(a, i, seed=seed, strength=shot["leak"])
        frames.append(a)

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
    # --- opening: the room, before the noise -----------------------------
    dict(src="A", t=3.6, dur=26, z0=1.30, z1=1.55, cx=0.50, cy=0.50,
         grade="amber", ramp="ramp_up", shake=0.9, out="torn_thin"),
    dict(src="B", t=1.6, dur=20, z0=1.9, z1=1.6, cx=0.45, cy=0.45,
         grade="purple", shake=0.8, bloom=0.75, out="cut"),
    dict(src="C", t=0.25, dur=24, z0=1.05, z1=1.18, cx=0.5, cy=0.5,
         grade="magenta", shake=1.1, out="torn_strips"),

    # --- into the crowd ---------------------------------------------------
    dict(src="C", t=4.05, dur=16, z0=2.1, z1=2.45, **CROWD,
         grade="red", shake=1.3, out="cut"),
    dict(src="C", t=0.5, dur=14, z0=2.9, z1=3.2, **ECU,
         grade="magenta", shake=1.5, out="flash_white"),
    dict(src="C", t=2.05, dur=22, z0=1.15, z1=1.35, cx=0.5, cy=0.5,
         grade="purple", shake=1.0, bloom=0.8, out="torn_big"),
    dict(src="A", t=0.5, dur=15, z0=1.6, z1=2.1, cx=0.42, cy=0.62,
         grade="amber", shake=1.2, out="cut"),
    dict(src="C", t=5.45, dur=20, z0=1.5, z1=1.25, **LOW,
         grade="blue", shake=1.2, bloom=0.9, flare=(0.47, 0.16),
         out="torn_strips"),

    # --- first drop: shorter, harder -------------------------------------
    dict(src="C", t=7.05, dur=15, z0=2.2, z1=2.6, **CROWD,
         grade="red", shake=1.5, ramp="fast", out="cut"),
    dict(src="C", t=7.6, dur=13, z0=2.6, z1=2.9, **CU,
         grade="magenta", shake=1.6, out="flash_camera"),
    dict(src="B", t=4.7, dur=14, z0=1.7, z1=2.2, cx=0.55, cy=0.5,
         grade="purple", shake=1.1, out="torn_linger"),
    dict(src="C", t=9.0, dur=18, z0=1.9, z1=1.6, **HANDS,
         grade="blue", shake=1.4, ramp="ramp_down", exposure=1.0, out="cut"),
    dict(src="C", t=8.6, dur=16, z0=1.1, z1=1.3, cx=0.5, cy=0.48,
         grade="magenta", shake=1.2, bloom=1.0, flare=(0.50, 0.12),
         out="double"),
    dict(src="C", t=2.6, dur=20, z0=2.0, z1=2.3, **CROWD2,
         grade="red", shake=1.3, out="torn_strips"),

    # --- breath: one longer held shot ------------------------------------
    dict(src="C", t=11.4, dur=44, z0=1.35, z1=1.10, cx=0.5, cy=0.62,
         grade="red", shake=0.8, ramp="slow", bloom=0.5, exposure=1.02, out="torn_thin"),

    # --- second drop: fastest section ------------------------------------
    dict(src="C", t=3.4, dur=13, z0=2.5, z1=2.9, **ECU,
         grade="magenta", shake=1.7, out="cut"),
    dict(src="A", t=1.4, dur=12, z0=2.0, z1=2.6, cx=0.55, cy=0.55,
         grade="amber", shake=1.4, out="torn_strips"),
    dict(src="C", t=6.0, dur=15, z0=1.8, z1=2.2, **HANDS,
         grade="green", shake=1.5, out="flash_hot"),
    dict(src="C", t=4.6, dur=16, z0=2.3, z1=2.0, **CROWD,
         grade="red", shake=1.6, ramp="fast", out="cut"),
    dict(src="B", t=2.4, dur=14, z0=2.4, z1=1.9, cx=0.40, cy=0.42,
         grade="purple", shake=1.2, bloom=0.9, leak=0.45, out="torn_big"),
    dict(src="C", t=0.9, dur=17, z0=1.9, z1=2.3, **CU,
         grade="magenta", shake=1.6, out="cut"),
    dict(src="C", t=5.5, dur=18, z0=1.25, z1=1.45, **LIGHTS,
         grade="blue", shake=1.1, bloom=1.1, exposure=1.0,
         flare=(0.45, 0.14), out="torn_linger"),
    dict(src="C", t=9.6, dur=20, z0=1.6, z1=1.35, **LOW,
         grade="red", shake=1.3, ramp="fast_slow_fast", exposure=1.0, out="cut"),
    dict(src="C", t=7.0, dur=14, z0=2.7, z1=3.1, cx=0.34, cy=0.64,
         grade="magenta", shake=1.7, out="double"),
    dict(src="A", t=4.6, dur=16, z0=1.4, z1=1.8, cx=0.5, cy=0.44,
         grade="amber", shake=1.2, leak=0.5, out="torn_strips"),

    # --- third pass: deepest into the crowd ------------------------------
    dict(src="C", t=8.7, dur=17, z0=2.2, z1=2.6, cx=0.30, cy=0.62,
         grade="magenta", shake=1.6, exposure=1.0, out="cut"),
    dict(src="C", t=1.5, dur=14, z0=2.6, z1=3.0, **CU,
         grade="red", shake=1.7, ramp="fast", out="torn_thin"),
    dict(src="C", t=5.6, dur=19, z0=1.35, z1=1.6, **LIGHTS,
         grade="blue", shake=1.0, bloom=1.15, exposure=1.0,
         flare=(0.44, 0.15), out="flash_hot"),
    dict(src="C", t=11.0, dur=24, z0=1.7, z1=1.4, **LOW,
         grade="red", shake=1.2, exposure=1.02, ramp="ramp_down",
         out="torn_strips"),
    dict(src="B", t=0.6, dur=15, z0=2.0, z1=2.5, cx=0.48, cy=0.38,
         grade="purple", shake=1.3, bloom=0.95, out="cut"),
    dict(src="C", t=4.5, dur=18, z0=2.4, z1=2.1, **CROWD,
         grade="magenta", shake=1.6, out="double"),
    dict(src="C", t=2.3, dur=21, z0=1.2, z1=1.45, cx=0.5, cy=0.5,
         grade="purple", shake=1.1, bloom=0.85, out="torn_linger"),
    dict(src="A", t=2.2, dur=16, z0=1.8, z1=2.3, cx=0.38, cy=0.58,
         grade="amber", shake=1.3, out="cut"),
    dict(src="C", t=6.4, dur=20, z0=2.0, z1=1.7, **HANDS,
         grade="green", shake=1.5, ramp="fast_slow_fast", out="torn_big"),
    dict(src="C", t=9.3, dur=15, z0=2.7, z1=3.0, **ECU,
         grade="magenta", shake=1.8, exposure=1.0, out="flash_camera"),

    # --- final build ------------------------------------------------------
    dict(src="C", t=10.4, dur=15, z0=2.1, z1=2.5, **CROWD2,
         grade="red", shake=1.6, exposure=1.02, out="flash_white"),
    dict(src="C", t=8.8, dur=13, z0=2.8, z1=3.1, **ECU,
         grade="magenta", shake=1.8, out="cut"),
    dict(src="B", t=5.4, dur=12, z0=2.2, z1=2.8, cx=0.5, cy=0.55,
         grade="purple", shake=1.4, out="torn_strips"),
    dict(src="C", t=12.0, dur=16, z0=1.5, z1=1.2, cx=0.5, cy=0.7,
         grade="blue", shake=1.3, exposure=1.0, out="cut"),
    dict(src="C", t=4.2, dur=30, z0=2.4, z1=1.15, cx=0.36, cy=0.66,
         cx1=0.5, cy1=0.52, grade="magenta", shake=1.2, bloom=1.0,
         ramp="ramp_down", flare=(0.52, 0.15), out="torn_big"),
    dict(src="C", t=0.2, dur=38, z0=1.15, z1=1.45, cx=0.5, cy=0.5,
         grade="purple", shake=1.0, bloom=0.9, ramp="ramp_up",
         out="torn_thin"),
    dict(src="C", t=8.5, dur=52, z0=1.30, z1=1.05, cx=0.5, cy=0.52,
         grade="magenta", shake=0.9, ramp="ramp_down", bloom=0.8,
         flare=(0.50, 0.13), out="end"),
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
            else:
                for f in pending:
                    emit(f)

        pending = frames
        pending_out = shot.get("out", "cut")
        print(f"  shot {si + 1}/{len(shots)} {shot['src']} "
              f"{len(frames)}f -> {pending_out}", flush=True)

    for f in pending:
        emit(f)

    proc.stdin.close()
    proc.wait()
    print(f"wrote {outfile}: {idx[0]} frames, {idx[0] / FPS:.2f}s")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "promo.mp4"
    pv = int(sys.argv[2]) if len(sys.argv) > 2 else None
    build(out, pv)
