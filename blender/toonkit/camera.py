"""Camera rig whose moves are cut to the same frames as the character's action.

The rig is a camera constrained to look at an empty. Animate the empty to
re-aim (whip pans, snap-to-face), animate the camera to travel (push-in,
lateral dolly), and both stay locked on the character for free.
"""

import bpy

from .anim import key_object
from .core import link


class CameraRig:
    def __init__(self, name="CAM_Toon", lens=50.0, location=(0.0, -6.6, 1.70),
                 target=(0.0, 0.0, 1.15)):
        cam_data = bpy.data.cameras.new(name + "_data")
        cam_data.lens = lens
        self.camera = bpy.data.objects.new(name, cam_data)
        self.camera.location = location
        link(self.camera, "COL_Cameras")

        self.target = bpy.data.objects.new("EMPTY_CamTarget", None)
        self.target.empty_display_type = 'PLAIN_AXES'
        self.target.location = target
        link(self.target, "COL_Cameras")

        track = self.camera.constraints.new('TRACK_TO')
        track.target = self.target
        track.track_axis = 'TRACK_NEGATIVE_Z'
        track.up_axis = 'UP_Y'
        bpy.context.scene.camera = self.camera

    # -- primitives -------------------------------------------------------
    def key(self, frame, location=None, lens=None, interp="smooth", back=None):
        extra = {"data.lens": lens} if lens is not None else None
        return key_object(self.camera, frame, loc=location, interp=interp,
                          back=back, extra=extra)

    def aim(self, frame, location, interp="smooth", back=None):
        return key_object(self.target, frame, loc=location, interp=interp, back=back)

    # -- moves ------------------------------------------------------------
    def push_in(self, start, end, from_loc, to_loc, interp="ease_in"):
        """Creep toward the character during anticipation — builds pressure."""
        self.key(start, location=from_loc, interp=interp)
        return self.key(end, location=to_loc, interp="brake")

    def whip(self, frame, to_loc, frames=3, aim_at=None, overshoot=0.12):
        """A 3-frame camera snap that overshoots and settles, matching a fast action."""
        beyond = tuple(v * (1.0 + overshoot) for v in to_loc)
        self.key(frame, location=beyond, interp="recoil", back=2.0)
        landed = self.key(frame + frames, location=to_loc, interp="pop", back=2.0)
        if aim_at is not None:
            self.aim(frame + frames, aim_at, interp="pop", back=2.0)
        return landed

    def shake(self, frame, frames=6, amplitude=0.09, base=None):
        """Impact shake: alternating offsets on consecutive frames, decaying out."""
        base = base or tuple(self.camera.location)
        amp = amplitude
        for i in range(frames):
            sign = -1.0 if i % 2 else 1.0
            offset = (base[0] + sign * amp, base[1], base[2] - sign * amp * 0.6)
            self.key(frame + i, location=offset, interp="linear")
            amp *= 0.62
        return self.key(frame + frames, location=base, interp="ease_out")

    def zoom(self, frame, lens, interp="snap"):
        return self.key(frame, lens=lens, interp=interp)
