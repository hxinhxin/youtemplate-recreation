"""Beat analysis for the soundtrack.

No audio libraries are available here, so this does the job directly: a
spectral-flux onset envelope, tempo by autocorrelation, and a beat grid
phase-locked to where the onsets actually land.
"""

import subprocess
import sys

import numpy as np

SR = 22050
HOP = 256
NFFT = 1024


def load(path, sr=SR):
    """Decode to mono float32 at `sr`."""
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(sr),
         "-f", "f32le", "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def onset_envelope(x, sr=SR, hop=HOP, nfft=NFFT):
    """Spectral flux: how much energy is newly appearing, frame to frame."""
    win = np.hanning(nfft).astype(np.float32)
    n = 1 + (len(x) - nfft) // hop
    frames = np.lib.stride_tricks.as_strided(
        x, shape=(n, nfft), strides=(x.strides[0] * hop, x.strides[0]))
    spec = np.abs(np.fft.rfft(frames * win, axis=1))
    # log scale: perceptually closer to how a hit reads
    spec = np.log1p(spec * 8.0)
    flux = np.diff(spec, axis=0, prepend=spec[:1])
    env = np.maximum(flux, 0).sum(1)
    # subtract a local median so a loud section does not swamp a quiet one
    k = 41
    pad = np.pad(env, k // 2, mode="edge")
    base = np.array([np.median(pad[i:i + k]) for i in range(len(env))])
    env = np.maximum(env - base, 0)
    return env / (env.max() + 1e-9)


def tempo(env, sr=SR, hop=HOP, lo=60, hi=200):
    """Dominant tempo, by autocorrelating the onset envelope."""
    e = env - env.mean()
    ac = np.correlate(e, e, "full")[len(e) - 1:]
    fps = sr / hop
    lags = np.arange(len(ac))
    bpm = np.zeros_like(ac)
    nz = lags > 0
    bpm[nz] = 60.0 * fps / lags[nz]
    ok = (bpm >= lo) & (bpm <= hi)
    if not ok.any():
        return 120.0
    cand = ac.copy()
    cand[~ok] = -np.inf
    return float(bpm[int(np.argmax(cand))])


def beat_grid(env, bpm, sr=SR, hop=HOP):
    """A steady grid at `bpm`, shifted to the phase that best fits the onsets."""
    fps = sr / hop
    period = 60.0 / bpm * fps
    best, best_score = 0.0, -1.0
    for off in np.arange(0, period, 0.25):
        idx = np.round(np.arange(off, len(env), period)).astype(int)
        idx = idx[idx < len(env)]
        score = env[idx].sum() / max(1, len(idx))
        if score > best_score:
            best, best_score = off, score
    idx = np.arange(best, len(env), period)
    return idx / fps, period / fps


def energy(x, times, sr=SR, win=0.5):
    """RMS around each time - used to find where the track opens up."""
    out = []
    for t in times:
        a = int(max(0, (t - win / 2) * sr))
        b = int(min(len(x), (t + win / 2) * sr))
        out.append(float(np.sqrt(np.mean(x[a:b] ** 2))) if b > a else 0.0)
    return np.array(out)


def analyse(path):
    x = load(path)
    env = onset_envelope(x)
    bpm = tempo(env)
    beats, spb = beat_grid(env, bpm)
    return dict(x=x, env=env, bpm=bpm, beats=beats, spb=spb,
                dur=len(x) / SR)


if __name__ == "__main__":
    a = analyse(sys.argv[1])
    print(f"duration {a['dur']:.2f}s  tempo {a['bpm']:.2f} bpm  "
          f"beat {a['spb']:.4f}s  {len(a['beats'])} beats")
    b = a["beats"]
    e = energy(a["x"], b)
    # report energy per 8-beat bar so the sections are visible
    for i in range(0, min(len(b), 200), 8):
        print(f"  bar @{b[i]:7.2f}s  rms {e[i:i + 8].mean():.4f}")
