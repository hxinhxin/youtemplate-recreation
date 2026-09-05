"""Рендира цялата анимация в кадри и ги събира в MP4."""
import bpy, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.chdir(os.path.dirname(os.path.abspath(__file__)))
import main as M

M.main()
sc = bpy.context.scene
sc.cycles.samples = 48
sc.render.resolution_x, sc.render.resolution_y = 720, 1280
sc.render.image_settings.file_format = 'PNG'
out = '/tmp/render/'
os.makedirs(out, exist_ok=True)
t0 = time.time()
for f in range(1, M.F_END + 1):
    sc.frame_set(f)
    sc.render.filepath = f'{out}f{f:04d}.png'
    bpy.ops.render.render(write_still=True)
    if f % 10 == 0:
        el = time.time() - t0
        print(f'  {f}/{M.F_END}  {el:.0f}s elapsed, ~{el/f*(M.F_END-f):.0f}s left', flush=True)
print('DONE %.0fs' % (time.time() - t0))
