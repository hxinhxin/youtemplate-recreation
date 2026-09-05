"""Cartoon timing toolkit: frame-exact keys, snap curves, squash and stretch.

Everything here is built around *pose-to-pose* animation. A pose is a plain
dict::

    {"head": {"rot": (0, 0, 25)},              # degrees, XYZ euler
     "hips": {"loc": (0, 0, -0.12)},           # bone-local metres
     "ROOT": {"loc": (0, -1.4, 0), "scale": (0.8, 0.8, 1.3)}}

`"ROOT"` addresses the armature *object* (world-space travel and global
squash/stretch); every other key is a pose bone.

Interpolation presets (`INTERP`) are the cartoon vocabulary — the segment that
*leaves* a keyframe carries the curve, so `key(..., interp="ease_in")` means
"crawl out of this pose then blast into the next one".
"""

import math

import bpy

#: name -> (blender interpolation, easing)
INTERP = {
    "hold":     ("CONSTANT", "AUTO"),    # stepped — nothing moves until the next key
    "linear":   ("LINEAR", "AUTO"),
    "smooth":   ("BEZIER", "AUTO"),
    "ease_in":  ("EXPO", "EASE_IN"),     # slow out of pose, violent arrival
    "ease_out": ("EXPO", "EASE_OUT"),    # instant departure, hard deceleration
    "snap":     ("QUART", "EASE_IN"),    # the workhorse accelerate-into-action
    "brake":    ("QUINT", "EASE_OUT"),   # the workhorse abrupt-stop
    "pop":      ("BACK", "EASE_OUT"),    # built-in overshoot on arrival
    "recoil":   ("BACK", "EASE_IN"),
    "bounce":   ("BOUNCE", "EASE_OUT"),
    "elastic":  ("ELASTIC", "EASE_OUT"),
}

CHANNELS = {"loc": "location", "rot": "rotation_euler", "scale": "scale"}


def volume_preserving(stretch):
    """Scale triple for a Z stretch of `stretch` that keeps volume constant."""
    lateral = 1.0 / math.sqrt(stretch)
    return (lateral, lateral, stretch)


def squash(amount):
    """`amount` > 0 squashes (wide & short), < 0 stretches (tall & thin)."""
    return volume_preserving(1.0 - amount)


class Animator:
    """Frame-level keying against one armature."""

    def __init__(self, rig, fps=24):
        self.rig = rig
        self.fps = fps
        rig.rotation_mode = 'XYZ'

    # -- frame maths ------------------------------------------------------
    def at(self, seconds):
        return int(round(seconds * self.fps)) + 1

    # -- raw keying -------------------------------------------------------
    def _target(self, bone):
        return self.rig if bone == "ROOT" else self.rig.pose.bones[bone]

    def key(self, bone, frame, loc=None, rot=None, scale=None,
            interp="smooth", back=None):
        """Set and key any subset of channels on one bone (or `"ROOT"`)."""
        target = self._target(bone)
        touched = []
        if loc is not None:
            target.location = loc
            touched.append("loc")
        if rot is not None:
            target.rotation_euler = [math.radians(a) for a in rot]
            touched.append("rot")
        if scale is not None:
            target.scale = scale
            touched.append("scale")
        for channel in touched:
            target.keyframe_insert(data_path=CHANNELS[channel], frame=frame)
        self._style(target, frame, touched, interp, back)
        return frame

    def _style(self, target, frame, channels, interp, back):
        mode, easing = INTERP[interp]
        action = self.rig.animation_data.action
        prefix = "" if target is self.rig else 'pose.bones["%s"].' % target.name
        wanted = {prefix + CHANNELS[c] for c in channels}
        for fcurve in action.fcurves:
            if fcurve.data_path not in wanted:
                continue
            for kp in fcurve.keyframe_points:
                if abs(kp.co.x - frame) < 1e-4:
                    kp.interpolation = mode
                    kp.easing = easing
                    if back is not None:
                        kp.back = back
        return self

    # -- pose level -------------------------------------------------------
    def pose(self, pose, frame, interp="smooth", back=None):
        """Key an entire pose dict on one frame."""
        for bone, channels in pose.items():
            self.key(bone, frame,
                     loc=channels.get("loc"), rot=channels.get("rot"),
                     scale=channels.get("scale"), interp=interp, back=back)
        return frame

    def hold(self, pose, start, end, interp="smooth"):
        """Plant a pose and keep it dead still until `end` — the calm before a snap."""
        self.pose(pose, start, interp="hold")
        return self.pose(pose, end, interp=interp)

    # -- cartoon idioms ---------------------------------------------------
    def anticipate(self, base, wind_up, frame_start, frames=6, hitch=2):
        """Ease into the opposite of the action, then hitch (hold) before firing.

        The hitch is what sells the snap: the eye locks onto a still pose right
        before the fastest part of the shot.
        """
        self.pose(base, frame_start, interp="ease_out")
        wind_frame = frame_start + frames
        self.pose(wind_up, wind_frame, interp="hold")
        return self.pose(wind_up, wind_frame + hitch, interp="ease_in")

    def strike(self, action, frame, interp="brake"):
        """The action pose itself — arrive on an exact frame, decelerate hard."""
        return self.pose(action, frame, interp=interp)

    def overshoot(self, target, frame, over=0.35, frames=4, back=2.2):
        """Blow past `target` by `over`, then snap back onto it.

        Returns the frame the character actually lands on.
        """
        beyond = _scale_pose(target, 1.0 + over)
        self.pose(beyond, frame, interp="recoil", back=back)
        return self.pose(target, frame + frames, interp="pop", back=back)

    def settle(self, target, frame, cycles=2, amplitude=0.18, spacing=5, decay=0.45):
        """Decaying wobble onto `target` — the follow-through after a hard stop."""
        current = frame
        amp = amplitude
        for i in range(cycles):
            sign = -1.0 if i % 2 else 1.0
            current += spacing
            self.pose(_scale_pose(target, 1.0 + sign * amp), current, interp="smooth")
            amp *= decay
        current += spacing
        return self.pose(target, current, interp="ease_out")

    def impact(self, frame, amount=0.34, frames=3, bone="ROOT"):
        """A one-frame squash on contact that pops back out. Pure cartoon."""
        target = self._target(bone)
        neutral = tuple(target.scale)
        self.key(bone, frame, scale=squash(amount), interp="ease_out")
        return self.key(bone, frame + frames, scale=neutral, interp="pop", back=1.8)

    def stretch_through(self, frame, amount=0.45, bone="ROOT"):
        """Stretch along the direction of travel during the fast frames."""
        return self.key(bone, frame, scale=squash(-amount), interp="ease_out")

    # -- utilities --------------------------------------------------------
    def blink(self, frame, closed=0.12, frames=2):
        """Cheap eye blink by squashing the head on Z for a couple of frames."""
        self.key("head", frame - 1, scale=(1, 1, 1), interp="ease_out")
        self.key("head", frame, scale=(1.04, 1.04, 1.0 - closed), interp="ease_out")
        return self.key("head", frame + frames, scale=(1, 1, 1), interp="pop")

    def set_range(self, start, end):
        scene = bpy.context.scene
        scene.frame_start, scene.frame_end = start, end
        scene.render.fps = self.fps
        return scene


def _scale_pose(pose, factor):
    """Exaggerate (or soften) every channel of a pose by `factor`."""
    out = {}
    for bone, channels in pose.items():
        entry = {}
        for name, value in channels.items():
            if name == "scale":
                entry[name] = tuple(1.0 + (v - 1.0) * factor for v in value)
            else:
                entry[name] = tuple(v * factor for v in value)
        out[bone] = entry
    return out


def merge(*poses):
    """Shallow-merge pose dicts left to right (later wins per bone-channel)."""
    out = {}
    for pose in poses:
        for bone, channels in pose.items():
            out.setdefault(bone, {}).update(channels)
    return out


def key_object(obj, frame, loc=None, rot=None, scale=None,
               interp="smooth", back=None, extra=None):
    """Keyframe a plain object (camera, empty, light) with the same curve presets.

    `extra` keys arbitrary data paths, e.g. ``{"data.lens": 35.0}``.
    """
    paths = []
    if loc is not None:
        obj.location = loc
        paths.append("location")
    if rot is not None:
        obj.rotation_mode = 'XYZ'
        obj.rotation_euler = [math.radians(a) for a in rot]
        paths.append("rotation_euler")
    if scale is not None:
        obj.scale = scale
        paths.append("scale")
    for path in paths:
        obj.keyframe_insert(data_path=path, frame=frame)
    paths = set(paths)

    for path, value in (extra or {}).items():
        owner, _, attr = path.rpartition(".")
        holder = obj
        for step in owner.split(".") if owner else []:
            holder = getattr(holder, step)
        setattr(holder, attr, value)
        holder.keyframe_insert(data_path=attr, frame=frame)

    mode, easing = INTERP[interp]
    for holder in (obj, getattr(obj, "data", None)):
        anim = getattr(holder, "animation_data", None)
        if not anim or not anim.action:
            continue
        for fcurve in anim.action.fcurves:
            if holder is obj and paths and fcurve.data_path not in paths:
                continue
            for kp in fcurve.keyframe_points:
                if abs(kp.co.x - frame) < 1e-4:
                    kp.interpolation = mode
                    kp.easing = easing
                    if back is not None:
                        kp.back = back
    return frame
