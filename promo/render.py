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

# Source clips with their native size. A/B/C are trimmed short of the trailing
# app outro card each carries; D-G run clean to the end. Framing happens in
# native pixels so each frame is resampled to the timeline exactly once.
SRC = {
    "A": (f"{UP}/0e5e49bf-copy_CC8DD977890C41C08CBBE9B65B7EF9F0.mov", 6.0, 1080, 1920),
    "B": (f"{UP}/1d16230a-copy_E86BFBEFCC9F4491B7273090EE42AF2A.mov", 6.6, 1080, 1920),
    "C": (f"{UP}/7748be66-copy_E0792E9D4E6D4775832901CF7195E626.mov", 13.2, 1080, 1920),
    "D": (f"{UP}/95297706-copy_58F8F1F5DCFB48818D866C1F722EF75F.mov", 4.7, 720, 1280),
    "E": (f"{UP}/a5dfdf39-copy_4505F4A3FDDE4CC8835507BAB5216B1D.mov", 11.9, 720, 1280),
    "F": (f"{UP}/f38e8ecc-copy_2DB5F7EF9CE04896A740BA1E239CB937.mov", 21.5, 720, 1280),
    "G": (f"{UP}/18d86975-copy_3A60ACACE1B14B47A64B0F19D5F7883F.mov", 14.7, 1080, 1920),
}

# How far a shot may punch in before the crop starts costing real detail.
# The 720x1280 clips have far less to give away than the 1080x1920 ones.
MAX_ZOOM = {1080: 2.7, 720: 1.85}

LOGO = f"{UP}/dd53e4b7-image.webp"

TRACK = f"{UP}/46ddfcd1-BANDATA_NA_RUBA__TRAPA_MI_INSTRUMENTAL.mp3"

# Measured from the track by beats.py: 132.51 bpm, first beat at 0.3204s.
# The cut grid is this beat, so every shot boundary lands on the music.
SPB = 0.45283                      # seconds per beat
BEAT0 = 0.3204
BAR = SPB * 4
FPB = SPB * FPS                    # 13.585 frames per beat

# Two spans of the track, both cut on a downbeat and butted together: the
# quiet intro and the drop, then the peak. This skips the mid-track
# breakdown, which is far too long a lull to carry a promo.
AUDIO = [
    (BEAT0 + 4 * BAR, BEAT0 + 13 * BAR),      # 9 bars: 2 quiet, then the drop
    (BEAT0 + 27 * BAR, BEAT0 + 38 * BAR),     # 11 bars: peak, then 2 of release
]
TOTAL_BEATS = 80                   # 20 bars

_cache = {}


def decode(key, start, nframes):
    """Pull a span of source frames at their native resolution.

    Nothing is rescaled here: framing and the scale up to the timeline happen
    in one resample later, so the picture is only resized once.
    """
    path, limit, nw, nh = SRC[key]
    start = max(0.0, min(start, limit - nframes / FPS - 0.05))
    ck = (key, round(start, 3), nframes)
    if ck in _cache:
        return _cache[ck]
    cmd = [
        "ffmpeg", "-v", "error", "-ss", f"{start:.3f}", "-i", path,
        "-frames:v", str(nframes),
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8)
    n = a.size // (nh * nw * 3)
    if n == 0:
        raise RuntimeError(f"no frames decoded for {key}@{start}")
    a = a[: n * nh * nw * 3].reshape(n, nh, nw, 3)
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
    nw, nh = SRC[shot["src"]][2], SRC[shot["src"]][3]
    mz = MAX_ZOOM[nw]

    z0 = min(shot.get("z0", 1.2), mz)
    z1 = min(shot.get("z1", 1.3), mz)
    cx, cy = shot.get("cx", 0.5), shot.get("cy", 0.5)
    cx1, cy1 = shot.get("cx1", cx), shot.get("cy1", cy)

    # shake is authored in timeline pixels; convert to this clip's own scale
    px = nw / W
    amp = shot.get("shake", 1.0) * px
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
    mcw, mch = nw / zm, nh / zm
    ml = float(np.clip((cx + cx1) / 2 * nw - mcw / 2, 0, nw - mcw))
    mt = float(np.clip((cy + cy1) / 2 * nh - mch / 2, 0, nh - mch))
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

        cw, ch = nw / z, nh / z
        left = ccx * nw - cw / 2 + sx[i]
        top = ccy * nh - ch / 2 + sy[i]
        left = float(np.clip(left, 0, nw - cw))
        top = float(np.clip(top, 0, nh - ch))
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

        # one resample: frame and scale to the timeline in a single step
        im = Image.fromarray(f).resize((W, H), Image.LANCZOS, box=box)
        a = np.asarray(im, np.uint8)

        # motion blur, but only for genuinely fast movement - anything less
        # just costs sharpness
        if prev_box is not None:
            vel = abs(box[0] - prev_box[0]) + abs(box[1] - prev_box[1])
            vel += abs((box[2] - box[0]) - (prev_box[2] - prev_box[0])) * 0.8
            vel /= px
            if vel > 11.0:
                a = tf.box_blur(a, min(4, int(vel / 9.0)))
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
        # the more the shot was enlarged, the more bite it needs back
        a = tf.sharpen(a, percent=shot.get("sharpen", 78 + 42 * (px < 1) + 26 * z))
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

OUTRO_BEATS = 4

# Every shot's length is given in beats of the track, so each cut lands on
# the music. Bars 1-2 are the quiet intro and carry the venue and its name;
# the drop is on bar 3, where the cutting starts. NAKED BEACH is established
# there and not returned to - the rest is the show.
EDIT = [
    # --- bars 1-2: the venue, and its name (over the quiet intro) ---------
    dict(src="A", t=4.10, beats=4, z0=1.10, z1=1.26, cx=0.50, cy=0.46,
         grade="amber", shake=0.6, out="torn_thin"),
    dict(src="B", t=4.78, beats=4, z0=1.06, z1=1.00, cx=0.50, cy=0.50,
         grade="purple", shake=0.3, bloom=0.55, sharpen=125, ramp="slow",
         out="torn_big"),

    # --- bar 3: the drop -------------------------------------------------
    dict(src="F", t=1.40, beats=2, z0=1.05, z1=1.22, cx=0.50, cy=0.48,
         grade="magenta", shake=1.0, bloom=0.85, ramp="ramp_up", out="cut"),
    dict(src="F", t=2.90, beats=1, z0=1.50, z1=1.70, cx=0.48, cy=0.42,
         grade="red", shake=1.4, out="flash_white"),
    dict(src="G", t=0.80, beats=1, z0=1.80, z1=2.10, cx=0.46, cy=0.44,
         grade="blue", shake=1.4, out="torn_strips"),

    # --- bars 4-9 --------------------------------------------------------
    dict(src="C", t=4.00, beats=2, z0=2.00, z1=2.30, **CROWD,
         grade="red", shake=1.4, out="cut"),
    dict(src="E", t=2.30, beats=2, z0=1.60, z1=1.78, cx=0.44, cy=0.46,
         grade="magenta", shake=1.4, out="torn_strips"),
    dict(src="F", t=4.30, beats=1, z0=1.45, z1=1.65, cx=0.36, cy=0.60,
         grade="purple", shake=1.2, bloom=0.9, out="cut"),
    dict(src="D", t=0.30, beats=2, z0=1.25, z1=1.45, cx=0.46, cy=0.50,
         grade="blue", shake=1.2, bloom=0.85, out="torn_thin"),
    dict(src="C", t=0.40, beats=1, z0=2.40, z1=2.65, **ECU,
         grade="magenta", shake=1.6, out="double"),
    dict(src="F", t=5.80, beats=2, z0=1.40, z1=1.60, cx=0.50, cy=0.44,
         grade="red", shake=1.3, out="cut"),
    dict(src="G", t=2.40, beats=1, z0=1.90, z1=2.20, cx=0.48, cy=0.46,
         grade="magenta", shake=1.5, ramp="fast", out="torn_strips"),
    dict(src="E", t=4.20, beats=2, z0=1.50, z1=1.72, cx=0.60, cy=0.54,
         grade="red", shake=1.4, out="flash_camera"),
    dict(src="F", t=7.20, beats=2, z0=1.35, z1=1.55, cx=0.62, cy=0.38,
         grade="magenta", shake=1.2, bloom=1.0, out="torn_linger"),
    dict(src="C", t=5.50, beats=2, z0=1.30, z1=1.52, **LIGHTS,
         grade="blue", shake=1.1, bloom=1.05, flare=(0.45, 0.15), out="cut"),
    dict(src="G", t=4.20, beats=4, z0=1.32, z1=1.14, cx=0.52, cy=0.52,
         grade="magenta", shake=1.2, bloom=0.95, out="torn_big"),
    dict(src="E", t=6.00, beats=1, z0=1.62, z1=1.80, cx=0.38, cy=0.62,
         grade="red", shake=1.5, out="cut"),
    dict(src="F", t=8.70, beats=1, z0=1.48, z1=1.68, cx=0.50, cy=0.66,
         grade="purple", shake=1.6, ramp="fast", out="flash_hot"),
    dict(src="C", t=7.00, beats=2, z0=2.10, z1=2.40, **CROWD,
         grade="red", shake=1.6, out="torn_strips"),
    dict(src="G", t=6.20, beats=2, z0=1.70, z1=1.48, cx=0.36, cy=0.44,
         grade="magenta", shake=1.4, out="cut"),

    # --- the splice: into the peak ---------------------------------------
    dict(src="F", t=18.00, beats=4, z0=1.46, z1=1.24, cx=0.48, cy=0.28,
         grade="blue", shake=0.8, ramp="slow", bloom=0.7,
         flare=(0.47, 0.22), out="torn_thin"),
    dict(src="E", t=7.60, beats=1, z0=1.55, z1=1.75, cx=0.52, cy=0.36,
         grade="red", shake=1.6, out="cut"),
    dict(src="C", t=8.60, beats=2, z0=1.20, z1=1.42, cx=0.50, cy=0.48,
         grade="magenta", shake=1.2, bloom=1.0, out="flash_white"),
    dict(src="F", t=9.90, beats=1, z0=1.50, z1=1.72, cx=0.50, cy=0.70,
         grade="purple", shake=1.7, ramp="fast", out="torn_strips"),
    dict(src="G", t=8.00, beats=1, z0=1.75, z1=2.00, cx=0.50, cy=0.46,
         grade="blue", shake=1.5, out="cut"),
    dict(src="E", t=0.50, beats=2, z0=1.30, z1=1.50, cx=0.50, cy=0.58,
         grade="red", shake=1.3, out="double"),
    dict(src="F", t=13.20, beats=2, z0=1.68, z1=1.85, cx=0.34, cy=0.52,
         grade="magenta", shake=1.3, out="torn_big"),
    dict(src="C", t=2.20, beats=1, z0=1.40, z1=1.62, cx=0.50, cy=0.50,
         grade="purple", shake=1.2, bloom=0.9, out="cut"),
    dict(src="D", t=2.40, beats=2, z0=1.40, z1=1.60, cx=0.46, cy=0.46,
         grade="blue", shake=1.4, ramp="fast_slow_fast", out="torn_linger"),
    dict(src="G", t=9.80, beats=2, z0=1.62, z1=1.42, cx=0.62, cy=0.56,
         grade="red", shake=1.4, out="cut"),
    dict(src="F", t=14.70, beats=2, z0=1.50, z1=1.72, cx=0.52, cy=0.74,
         grade="magenta", shake=1.3, bloom=0.95, out="torn_thin"),
    dict(src="C", t=10.20, beats=1, z0=1.90, z1=2.20, **CROWD2,
         grade="red", shake=1.6, out="flash_camera"),
    dict(src="E", t=9.60, beats=2, z0=1.50, z1=1.72, cx=0.46, cy=0.55,
         grade="magenta", shake=1.5, ramp="ramp_down", out="cut"),
    dict(src="G", t=11.60, beats=2, z0=1.80, z1=1.58, cx=0.42, cy=0.60,
         grade="blue", shake=1.4, out="torn_strips"),
    dict(src="C", t=11.80, beats=2, z0=1.50, z1=1.25, cx=0.50, cy=0.62,
         grade="red", shake=1.3, ramp="ramp_down", out="cut"),
    dict(src="F", t=16.30, beats=2, z0=1.62, z1=1.40, cx=0.64, cy=0.44,
         grade="purple", shake=1.0, bloom=1.0, flare=(0.50, 0.24),
         out="torn_big"),
    dict(src="G", t=13.40, beats=2, z0=1.38, z1=1.16, cx=0.54, cy=0.40,
         grade="magenta", shake=1.2, ramp="ramp_up", out="cut"),
    dict(src="C", t=0.90, beats=1, z0=2.20, z1=2.50, cx=0.60, cy=0.56,
         grade="magenta", shake=1.7, out="flash_white"),
    dict(src="E", t=10.90, beats=1, z0=1.45, z1=1.65, cx=0.50, cy=0.48,
         grade="red", shake=1.5, out="torn_strips"),

    # --- release: the last shot slows into the logo ----------------------
    dict(src="F", t=19.20, beats=4, z0=1.24, z1=1.06, cx=0.50, cy=0.50,
         grade="magenta", shake=0.85, ramp="slow", bloom=0.85,
         out="logo"),
]

assert sum(s["beats"] for s in EDIT) + OUTRO_BEATS == TOTAL_BEATS, (
    sum(s["beats"] for s in EDIT) + OUTRO_BEATS)


def beat_boundaries(shots, outro_beats):
    """Frame index of every cut, snapped to the music's beat grid."""
    acc, bounds = 0.0, [0]
    for sh in shots:
        acc += sh["beats"]
        bounds.append(int(round(acc * FPB)))
    acc += outro_beats
    bounds.append(int(round(acc * FPB)))
    return bounds, acc


def build_audio(path, nframes):
    """Butt the chosen spans of the track together on their downbeats."""
    parts = []
    for i, (a, b) in enumerate(AUDIO):
        parts.append(
            f"[0:a]atrim=start={a:.5f}:end={b:.5f},asetpts=N/SR/TB,"
            f"afade=t=in:st=0:d=0.008,"
            f"afade=t=out:st={b - a - 0.008:.5f}:d=0.008[a{i}]")
    joins = "".join(f"[a{i}]" for i in range(len(AUDIO)))
    dur = nframes / FPS
    chain = (";".join(parts) + ";" + joins +
             f"concat=n={len(AUDIO)}:v=0:a=1[c];"
             f"[c]atrim=0:{dur:.5f},afade=t=out:st={dur - 0.55:.5f}:d=0.55[out]")
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", TRACK,
         "-filter_complex", chain, "-map", "[out]",
         "-c:a", "aac", "-b:a", "192k", path], check=True)


def build(outfile, preview=None):
    rng = np.random.default_rng(20240904)
    shots = EDIT if preview is None else EDIT[:preview]
    outro_beats = 0 if preview else OUTRO_BEATS
    bounds, total_beats = beat_boundaries(shots, outro_beats)
    nframes = bounds[-1]

    tmp = outfile + ".video.mp4"
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-v", "error",
         "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-",
         "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
         "-x264-params", "aq-mode=3:aq-strength=0.9",
         "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-color_primaries", "bt709", "-color_trc", "bt709",
         "-colorspace", "bt709", tmp],
        stdin=subprocess.PIPE,
    )

    idx = [0]
    leak_at = set(int(x) for x in
                  rng.choice(np.arange(60, max(120, nframes - 120)), 5,
                             replace=False))

    def emit(frame):
        i = idx[0]
        f = tf.vignette(frame, 0.34)
        if any(abs(i - L) < 12 for L in leak_at):
            near = min(leak_at, key=lambda L: abs(i - L))
            fade = 1.0 - abs(i - near) / 12.0
            f = tf.light_leak(f, i, seed=near, strength=0.42 * fade)
        f = tf.texture(f, i, grain=5.0, scanline=0.010)
        if i % 97 == 0:
            # very occasional frame displacement, as if the gate slipped
            f = np.roll(f, int(rng.integers(-3, 4)), axis=1)
        proc.stdin.write(f.tobytes())
        idx[0] += 1

    def open_with(kind, frames, prev_last, prev_tail):
        """Play the incoming shot, with its transition landing on the beat.

        The rip, flash or overlap occupies the first frames of the new shot,
        so the hit is on the downbeat rather than just before it.
        """
        if prev_last is None or kind == "cut" or kind == "logo":
            return frames
        n = len(frames)
        if kind.startswith("torn_"):
            mode = {"torn_thin": "thin", "torn_strips": "strips",
                    "torn_big": "big", "torn_linger": "linger"}[kind]
            tr = tf.torn_transition(prev_last, frames[:max(1, min(8, n))],
                                    rng, mode)
            return tr + frames[len(tr):]
        if kind.startswith("flash_"):
            k = {"flash_white": "white", "flash_camera": "camera",
                 "flash_hot": "hot"}[kind]
            fl = tf.flash_frames(prev_last, frames, rng, k)
            fl = fl[:max(1, min(len(fl), n))]
            return fl + frames[len(fl):]
        if kind == "double":
            m = min(6, n, len(prev_tail))
            de = tf.double_exposure(prev_tail[-m:], frames, n=m)
            return de + frames[m:]
        return frames

    prev_last, prev_tail, prev_out = None, [], None
    for si, shot in enumerate(shots):
        d = bounds[si + 1] - bounds[si]
        sh = dict(shot, dur=d)
        frames = render_shot(sh, 1000 + si * 17)
        frames = open_with(prev_out, frames, prev_last, prev_tail)
        for f in frames[:d]:
            emit(f)
        prev_last, prev_tail = frames[d - 1], frames[max(0, d - 6):d]
        prev_out = shot.get("out", "cut")
        print(f"  shot {si + 1}/{len(shots)} {shot['src']} "
              f"{shot['beats']}b {d}f -> {prev_out}", flush=True)

    if outro_beats:
        d = bounds[-1] - bounds[-2]
        # the crowd keeps moving behind the mark, in slow motion
        bg = render_shot(dict(src="F", t=20.40, dur=d, z0=1.12, z1=1.02,
                              cx=0.50, cy=0.50, grade="magenta", shake=0.5,
                              ramp="slow", bloom=0.7), 4242)
        outro = make_outro(bg, rng, hold=d - 22, fade=22)
        outro = open_with("torn_strips", outro, prev_last, prev_tail)
        for f in outro[:d]:
            emit(f)

    proc.stdin.close()
    proc.wait()

    audio = outfile + ".audio.m4a"
    build_audio(audio, idx[0])
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", tmp, "-i", audio,
         "-c:v", "copy", "-c:a", "copy", "-shortest",
         "-movflags", "+faststart", outfile], check=True)
    os.remove(tmp)
    os.remove(audio)
    print(f"wrote {outfile}: {idx[0]} frames, {idx[0] / FPS:.2f}s, "
          f"{total_beats:.0f} beats")


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "promo.mp4"
    pv = int(sys.argv[2]) if len(sys.argv) > 2 else None
    build(out, pv)
