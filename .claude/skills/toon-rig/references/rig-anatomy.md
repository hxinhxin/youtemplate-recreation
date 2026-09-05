# Rig Anatomy

## Bones

| Bone | Head → Tail | Parent | Connected | Deform |
|------|-------------|--------|-----------|--------|
| root | (0,0,0) → (0,−0.45,0) | — | — | no |
| hips | hips → spine | root | no | yes |
| spine | spine → chest | hips | yes | yes |
| chest | chest → neck | spine | yes | yes |
| neck | neck → head base | chest | yes | yes |
| head | head base → head top | neck | yes | yes |
| upperarm.L/R | shoulder → elbow | chest | no | yes |
| forearm.L/R | elbow → wrist | upperarm | yes | yes |
| hand.L/R | wrist → wrist+(±0.14,0,−0.14) | forearm | yes | yes |
| thigh.L/R | hip → knee | hips | no | yes |
| shin.L/R | knee → ankle | thigh | yes | yes |
| foot.L/R | ankle → toe | shin | yes | yes |
| ik_foot.L/R | ankle → ankle+(0,−0.3,0) | root | no | no |

Arms hang off `chest` rather than a clavicle: one less bone to counter-animate
and the shoulder still reads because the upper arm starts inboard at x ±0.08.

## IK

Each `shin.L/R` carries an IK constraint targeting `ik_foot.L/R` on the same
armature, `chain_count=2` (shin + thigh), influence 0.

```python
set_ik(rig, "L", 1.0)
anim.Animator(rig).key("ik_foot.L", frame, loc=(0, -0.2, 0), interp="brake")
```

Blend the influence over 2–3 frames when switching mid-shot, or the leg pops.

## Leg geometry cheat sheet

Foot height under an FK crouch, thigh pitched θ° and shin returned φ°:

```
ankle_z ≈ hip_z + root_z − 0.44·cos(θ) − 0.43·cos(θ − φ)
```

Thigh length 0.44, shin 0.43. Solve for `root_z` to keep the ankle at 0.13 and
the crouch stays planted. Remember a `squash()` on `ROOT` also lowers the hips
for free, because the object origin sits on the floor.
