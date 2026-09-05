# Timing Recipes

Frame numbers are relative; `f` is the frame the action lands on.

## Head snap (look-at)

```python
a.pose(IDLE,        f-5, interp="ease_out")
a.key("head", f-3, rot=(0, 0, -12), interp="hold")     # tiny counter-turn
a.key("head", f-1, rot=(0, 0, -12), interp="ease_in")  # hitch
a.key("head", f,   rot=(0, 0,  46), interp="brake")    # arrive
a.key("head", f+3, rot=(0, 0,  38), interp="pop")      # settle back
```

## Punch

```python
a.anticipate(IDLE, COCKED, f-8, frames=6, hitch=2)
a.pose(EXTENDED, f, interp="ease_out")       # 2 frames of travel
a.impact(f, amount=0.30, frames=2)
a.pose(RECOVER, f+6, interp="pop", back=2.0)
a.settle(GUARD, f+6, cycles=2, amplitude=0.15)
```

## Double take

```python
a.pose(IDLE,      f-6, interp="smooth")
a.pose(GLANCE,    f-4, interp="hold")        # first look, small
a.pose(GLANCE,    f-1, interp="ease_in")     # hold it — the beat before the joke
a.pose(SHOCK,     f,   interp="brake")       # second look, huge
a.key("ROOT", f, scale=squash(-0.35), interp="ease_out")
a.settle(SHOCK,   f+2, cycles=3, amplitude=0.2, spacing=3)
```

## Landing from a jump

```python
a.pose(AIRBORNE,  f-2, interp="ease_out")
a.key("ROOT", f,   scale=squash(0.42), loc=(x, y, -0.18), interp="brake")
a.key("ROOT", f+2, scale=squash(-0.15), loc=(x, y, 0.05), interp="pop", back=2.4)
a.key("ROOT", f+6, scale=(1, 1, 1), loc=(x, y, 0), interp="ease_out")
```

## Loopable idle

Key frame 1 and the last frame identically, put the breath extreme in the
middle, and use `smooth` throughout. Add a `blink` off-centre (never on the
midpoint) so the loop point is harder to spot.

## What kills the snap

| Mistake | Result |
|---------|--------|
| Breakdown key inside the fast part | mush; the eye tracks a slow move |
| `smooth`/BEZIER into a stop | a soft landing, not an impact |
| Anticipation without a hold | the action reads as one continuous swing |
| Squash on the same frame as the arrival key | the squash is never seen |
| Overshoot on the body but not the head | the character feels bolted together |
