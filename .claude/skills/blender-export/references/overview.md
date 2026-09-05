# Export reference

## Coordinate systems

| Application | Up | Forward | Unit |
|---|---|---|---|
| Blender | +Z | -Y | metre |
| Unity | +Y | +Z | metre |
| Unreal | +Z | +X | centimetre |
| Maya | +Y | -Z | centimetre |
| glTF | +Y | +Z | metre |

The Blender exporters convert axes when told to; they cannot guess. A model that arrives lying on
its side almost always means the `axis_up`/`axis_forward` pair was left at defaults for a target
that does not use them.

## What survives each format

| | glTF/GLB | FBX | OBJ | USD | STL |
|---|---|---|---|---|---|
| PBR materials | yes | partial | weak | yes | no |
| Skeletal animation | yes | yes | no | yes | no |
| Shape keys | yes | yes | no | yes | no |
| Cameras/lights | optional | yes | no | yes | no |
| Node-tree shaders | no | no | no | no | no |

No format carries a procedural node tree. Bake first, always.

## Web budgets

Under 5 MB total and under 100k triangles keeps a page interactive on mid-range mobile. Draco
compresses geometry roughly 5–10×; textures usually dominate what remains, so resize them to the
smallest size that survives the intended zoom level and prefer KTX2/WebP where the viewer supports
it.

## Verify, then report

An exporter call that returns `{'FINISHED'}` is not proof of a usable file. Check that the path
exists and its size is plausible before telling the user the export succeeded.
