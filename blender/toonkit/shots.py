"""Ready-made cartoon-timed shots.

`snap_demo` is the reference beat sheet: idle -> anticipation -> extremely fast
move -> abrupt stop -> overshoot/recoil -> return to idle, at 24 fps, with the
camera cut to the same frames.
"""

from .anim import Animator, merge, squash

# ---------------------------------------------------------------------------
# Pose library. Rotations are degrees on XYZ euler in bone-local space.
# ---------------------------------------------------------------------------

IDLE = {
    "ROOT": {"loc": (0, 0, 0), "rot": (0, 0, 0), "scale": (1, 1, 1)},
    "hips": {"rot": (0, 0, 0), "loc": (0, 0, 0)},
    "spine": {"rot": (2, 0, 0)},
    "chest": {"rot": (-2, 0, 0)},
    "neck": {"rot": (2, 0, 0)},
    "head": {"rot": (0, 0, 0), "scale": (1, 1, 1)},
    "upperarm.L": {"rot": (0, 0, -14)},
    "forearm.L": {"rot": (10, 0, 0)},
    "upperarm.R": {"rot": (0, 0, 14)},
    "forearm.R": {"rot": (10, 0, 0)},
    "thigh.L": {"rot": (0, 0, 0)},
    "shin.L": {"rot": (2, 0, 0)},
    "thigh.R": {"rot": (0, 0, 0)},
    "shin.R": {"rot": (2, 0, 0)},
}

BREATHE = merge(IDLE, {
    "chest": {"rot": (-5, 0, 0)},
    "head": {"rot": (-3, 0, 0)},
    "upperarm.L": {"rot": (0, 0, -18)},
    "upperarm.R": {"rot": (0, 0, 18)},
})

#: Wind-up: crouch, lean back, arms cocked behind — the mirror of the action.
ANTICIPATION = {
    "ROOT": {"loc": (0, 0.20, -0.06), "rot": (-14, 0, -18), "scale": squash(0.20)},
    "hips": {"rot": (14, 0, 0)},
    "spine": {"rot": (16, 0, 0)},
    "chest": {"rot": (10, 0, 0)},
    "neck": {"rot": (-14, 0, 0)},
    "head": {"rot": (-24, 0, 0), "scale": (1, 1, 1)},
    "upperarm.L": {"rot": (52, 0, -26)},
    "forearm.L": {"rot": (62, 0, 0)},
    "upperarm.R": {"rot": (52, 0, 26)},
    "forearm.R": {"rot": (62, 0, 0)},
    "thigh.L": {"rot": (-28, 0, 0)},
    "shin.L": {"rot": (46, 0, 0)},
    "foot.L": {"rot": (-20, 0, 0)},
    "thigh.R": {"rot": (-28, 0, 0)},
    "shin.R": {"rot": (46, 0, 0)},
    "foot.R": {"rot": (-20, 0, 0)},
}

#: The fast frames: body stretched along travel, limbs trailing behind.
LAUNCH = {
    "ROOT": {"loc": (1.45, 0.18, 0.12), "rot": (22, 0, 62), "scale": squash(-0.42)},
    "hips": {"rot": (-10, 0, 0)},
    "spine": {"rot": (-14, 0, 6)},
    "chest": {"rot": (-12, 0, 0)},
    "neck": {"rot": (16, 0, 0)},
    "head": {"rot": (22, 0, -8), "scale": (0.94, 0.94, 1.14)},
    "upperarm.L": {"rot": (-74, 0, -34)},
    "forearm.L": {"rot": (18, 0, 0)},
    "upperarm.R": {"rot": (-74, 0, 34)},
    "forearm.R": {"rot": (18, 0, 0)},
    "thigh.L": {"rot": (46, 0, 0)},
    "shin.L": {"rot": (-30, 0, 0)},
    "thigh.R": {"rot": (-52, 0, 0)},
    "shin.R": {"rot": (44, 0, 0)},
}

#: Abrupt stop: everything piles up against the brakes, wide squash.
IMPACT = {
    "ROOT": {"loc": (2.55, 0.10, -0.04), "rot": (-10, 0, 96), "scale": squash(0.34)},
    "hips": {"rot": (10, 0, 0)},
    "spine": {"rot": (-6, 0, -4)},
    "chest": {"rot": (14, 0, 0)},
    "neck": {"rot": (-20, 0, 0)},
    "head": {"rot": (-30, 0, 6), "scale": (1.12, 1.12, 0.88)},
    "upperarm.L": {"rot": (30, 0, -58)},
    "forearm.L": {"rot": (74, 0, 0)},
    "upperarm.R": {"rot": (30, 0, 58)},
    "forearm.R": {"rot": (74, 0, 0)},
    "thigh.L": {"rot": (-32, 0, 0)},
    "shin.L": {"rot": (48, 0, 0)},
    "foot.L": {"rot": (-18, 0, 0)},
    "thigh.R": {"rot": (22, 0, 0)},
    "shin.R": {"rot": (16, 0, 0)},
    "foot.R": {"rot": (-8, 0, 0)},
}

#: Recoil: the mass keeps going, then rebounds past the landing pose.
RECOIL = {
    "ROOT": {"loc": (2.42, 0.10, 0.05), "rot": (12, 0, 86), "scale": squash(-0.18)},
    "hips": {"rot": (-8, 0, 0)},
    "spine": {"rot": (10, 0, 4)},
    "chest": {"rot": (-12, 0, 0)},
    "neck": {"rot": (14, 0, 0)},
    "head": {"rot": (20, 0, -6), "scale": (0.96, 0.96, 1.06)},
    "upperarm.L": {"rot": (-30, 0, -20)},
    "forearm.L": {"rot": (26, 0, 0)},
    "upperarm.R": {"rot": (-30, 0, 20)},
    "forearm.R": {"rot": (26, 0, 0)},
    "thigh.L": {"rot": (14, 0, 0)},
    "shin.L": {"rot": (10, 0, 0)},
    "thigh.R": {"rot": (-10, 0, 0)},
    "shin.R": {"rot": (14, 0, 0)},
}

#: Where the character actually comes to rest, at the end of the dash.
LANDED = {
    "ROOT": {"loc": (2.45, 0.10, 0), "rot": (0, 0, 90), "scale": (1, 1, 1)},
    "hips": {"rot": (0, 0, 0)},
    "spine": {"rot": (3, 0, 0)},
    "chest": {"rot": (-2, 0, 0)},
    "neck": {"rot": (2, 0, 0)},
    "head": {"rot": (0, 0, 0), "scale": (1, 1, 1)},
    "upperarm.L": {"rot": (0, 0, -16)},
    "forearm.L": {"rot": (12, 0, 0)},
    "upperarm.R": {"rot": (0, 0, 16)},
    "forearm.R": {"rot": (12, 0, 0)},
    "thigh.L": {"rot": (0, 0, 0)},
    "shin.L": {"rot": (3, 0, 0)},
    "thigh.R": {"rot": (0, 0, 0)},
    "shin.R": {"rot": (3, 0, 0)},
}


#: Same rest pose, turned back to face camera to close the loop.
LANDED_FRONT = merge(LANDED, {"ROOT": {"loc": (2.45, 0.10, 0), "rot": (0, 0, 0),
                                       "scale": (1, 1, 1)}})


def snap_demo(ctx, fps=24):
    """Author the six-beat demo. Returns the beat -> frame map."""
    rig, cam = ctx["rig"], ctx["cam"]
    a = Animator(rig, fps=fps)

    beats = {
        "idle_in": 1,
        "idle_out": 10,
        "wind_up": 16,       # anticipation reached
        "hitch": 18,         # dead hold — the eye locks on
        "launch": 21,        # 3 frames of travel: as fast as the format allows
        "impact": 23,        # abrupt stop, 2 frames later
        "recoil": 27,
        "settle_start": 31,
        "idle_return": 56,
        "end": 72,
    }

    # 1. idle — a slow breath so the wind-up has something to break
    a.pose(IDLE, beats["idle_in"], interp="smooth")
    a.pose(BREATHE, 6, interp="smooth")
    a.pose(IDLE, beats["idle_out"], interp="ease_out")

    # 2. anticipation — ease into the opposite of the action, then hold still
    a.anticipate(IDLE, ANTICIPATION, beats["idle_out"],
                 frames=beats["wind_up"] - beats["idle_out"],
                 hitch=beats["hitch"] - beats["wind_up"])

    # 3. extremely fast move — 3 frames, stretched, nothing eased on the way out
    a.pose(LAUNCH, beats["launch"], interp="ease_out")

    # 4. abrupt stop — arrive hard and squash on contact
    a.strike(IMPACT, beats["impact"], interp="brake")

    # 5. overshoot / recoil, then a decaying wobble
    a.pose(RECOIL, beats["recoil"], interp="pop", back=2.4)
    a.pose(LANDED, beats["settle_start"], interp="smooth")
    a.settle(LANDED, beats["settle_start"], cycles=2, amplitude=0.12,
             spacing=4, decay=0.45)

    # 6. return to idle: a quick snap turn back to camera, then breathe and blink
    a.pose(LANDED, beats["idle_return"] - 6, interp="ease_in")
    a.pose(LANDED_FRONT, beats["idle_return"], interp="pop", back=1.6)
    a.impact(beats["idle_return"], amount=0.10, frames=3)
    a.pose(merge(LANDED_FRONT, {"chest": {"rot": (-5, 0, 0)},
                                "head": {"rot": (-3, 0, 0)}}),
           beats["idle_return"] + 10, interp="smooth")
    a.blink(beats["idle_return"] + 8)
    a.pose(LANDED_FRONT, beats["end"], interp="smooth")

    _camera_track(cam, beats)
    a.set_range(1, beats["end"])
    return beats


def _camera_track(cam, beats):
    """Camera cut to the character's beats: creep, whip, shake, ease out.

    Every move lands on the same frame as a character beat, and the aim target
    is explicitly held between moves so the framing never drifts mid-shot.
    """
    wide = (0.0, -6.6, 1.85)
    pressed = (0.15, -5.9, 1.95)
    mid_whip = (1.15, -6.6, 1.95)
    whipped = (2.30, -6.5, 1.85)
    rest = (2.15, -7.0, 1.80)

    home = (0.0, 0.0, 1.10)
    lead = (1.30, 0.15, 1.25)
    landed_aim = (2.45, 0.10, 1.10)

    # 1-10 idle: locked off, wide, nothing moving
    cam.key(beats["idle_in"], location=wide, lens=50, interp="smooth")
    cam.aim(beats["idle_in"], home, interp="hold")

    # 10-18 anticipation: slow creep in that arrives exactly on the hitch
    cam.push_in(beats["idle_out"], beats["hitch"], wide, pressed)
    cam.aim(beats["hitch"], home, interp="ease_out")
    cam.zoom(beats["hitch"], 55)

    # 21 the fast frames: the camera whips with him and goes wider for speed
    cam.key(beats["launch"], location=mid_whip, lens=40, interp="ease_out")
    cam.aim(beats["launch"], lead, interp="ease_out")

    # 23 impact: camera overshoots past the stop, then shakes
    cam.whip(beats["impact"], whipped, frames=2,
             aim_at=landed_aim, overshoot=0.04)
    cam.shake(beats["impact"] + 2, frames=6, amplitude=0.10, base=whipped)

    # settle: ease back out and re-widen for the return to idle
    cam.key(beats["settle_start"] + 8, location=rest, lens=50, interp="ease_out")
    cam.aim(beats["settle_start"] + 8, landed_aim, interp="ease_out")
    cam.key(beats["end"], location=rest, interp="smooth")
    cam.aim(beats["end"], landed_aim, interp="smooth")
