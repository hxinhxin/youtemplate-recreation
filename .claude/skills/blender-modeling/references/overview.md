# Modeling reference

## Topology

Quads subdivide predictably; triangles and n-gons pinch. This matters only where the surface will
be subdivided or deformed — a flat static panel with an n-gon renders fine.

Edge flow should follow the form's curvature. Support loops near a hard edge hold that edge under
subdivision; the distance from the edge sets the apparent bevel width.

## Bevel widths at real scale

| Object | Bevel |
|---|---|
| Machined metal edge | 0.2–0.5 mm |
| Injection-moulded plastic | 0.5–1.5 mm |
| Furniture edge | 2–5 mm |
| Architectural trim | 5–20 mm |

Two segments is enough for a bevel that only needs to catch a highlight. Three or more only when
the bevel is large enough to read as a surface of its own.

## Polygon budgets

| Use | Triangles |
|---|---|
| Mobile / web | 5k–50k |
| Real-time hero asset | 50k–150k |
| Film / offline render | unbounded (subdivide at render time) |

## bpy.ops versus bmesh

`bpy.ops.mesh.*` operates on the current selection in the current mode in the current context. In a
script, any of those three can be wrong, and the operator then returns `{'CANCELLED'}` without
raising. `bmesh` takes the mesh datablock directly and is deterministic. Prefer it.

When `bpy.ops` is unavoidable, set context explicitly:

```python
bpy.context.view_layer.objects.active = ob
bpy.ops.object.mode_set(mode='EDIT')
```
