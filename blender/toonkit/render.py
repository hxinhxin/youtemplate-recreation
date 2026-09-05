"""Render configuration and output.

Cycles CPU is the default because it is the only engine that renders reliably
headless (EEVEE Next needs a GPU context). Freestyle supplies the ink outline
that makes the flat materials read as a cartoon.
"""

import os

import bpy

PRESETS = {
    # name:        (resolution, samples, %)
    "thumb":  ((320, 180), 12, 100),
    "draft":  ((640, 360), 24, 100),
    "preview": ((960, 540), 48, 100),
    "final":  ((1920, 1080), 160, 100),
}


def configure(preset="draft", engine="CYCLES", outline=True,
              line_thickness=2.2, transparent=False, threads=0):
    scene = bpy.context.scene
    (width, height), samples, pct = PRESETS[preset]
    scene.render.engine = engine
    scene.render.resolution_x = width
    scene.render.resolution_y = height
    scene.render.resolution_percentage = pct
    scene.render.film_transparent = transparent
    if threads:
        scene.render.threads_mode = 'FIXED'
        scene.render.threads = threads

    if engine == "CYCLES":
        scene.cycles.device = 'CPU'
        scene.cycles.samples = samples
        scene.cycles.use_denoising = True
        scene.cycles.max_bounces = 4
        scene.cycles.caustics_reflective = False
        scene.cycles.caustics_refractive = False

    # AgX (Blender's default view transform) desaturates flat cartoon colour into
    # mush. Standard keeps the palette exactly as authored.
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = 0.0

    scene.render.use_freestyle = outline
    if outline:
        view_layer = bpy.context.view_layer
        view_layer.use_freestyle = True
        settings = view_layer.freestyle_settings
        if not settings.linesets:
            settings.linesets.new("ToonInk")
        lineset = settings.linesets[0]
        lineset.select_silhouette = True
        lineset.select_border = True
        lineset.select_crease = True
        style = lineset.linestyle
        if style is None:
            style = bpy.data.linestyles.new("ToonInk")
            lineset.linestyle = style
        style.color = (0.03, 0.03, 0.05)
        style.thickness = line_thickness
    return scene


def output_video(path, container="MPEG4", codec="H264", quality="MEDIUM"):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'FFMPEG'
    scene.render.ffmpeg.format = container
    scene.render.ffmpeg.codec = codec
    scene.render.ffmpeg.constant_rate_factor = quality
    scene.render.ffmpeg.ffmpeg_preset = 'GOOD'
    scene.render.filepath = path
    return path


def output_frames(directory, prefix="frame_"):
    scene = bpy.context.scene
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    os.makedirs(directory, exist_ok=True)
    scene.render.filepath = os.path.join(directory, prefix)
    return scene.render.filepath


def render_animation():
    bpy.ops.render.render(animation=True)


def render_still(path, frame=None):
    scene = bpy.context.scene
    if frame is not None:
        scene.frame_set(frame)
    scene.render.image_settings.file_format = 'PNG'
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def save_blend(path):
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(path))
    return path


def export_glb(path, selected_only=False):
    """FBX/GLB handoff for engines — bakes the action into the exported clip."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=os.path.abspath(path), export_format='GLB',
        use_selection=selected_only, export_animations=True,
        export_frame_range=True, export_apply=False)
    return path
