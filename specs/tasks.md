# Task Management

> Last Updated: 2026-01-31
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 1 |
| Completed | 58 |

> V1 (TASK-010~020), V2 Phase 1-4 (TASK-101~120), Cleanup (TASK-122~129),
> Build/Deploy (TASK-130~132), Power-Ups (TASK-133), Slow-Mo (TASK-134),
> Haptic Feedback (TASK-135), Boss Rush Polish (TASK-136) — all completed.
> **V3 Graphics Upgrade (TASK-200~205)** — completed.
> **Menu UI Redesign (TASK-211)** — completed.
> **V4 Arena Upgrade (TASK-220)** — completed.
> **Haptic Patterns Upgrade (TASK-221)** — completed.
> **V9 Effects & Interaction Polish (TASK-234~236)** — completed.
> **V10 Immersion Upgrade (TASK-240~244)** — completed.
> **V11 Physical Movement Upgrade (TASK-250~254)** — 4/5 completed (TASK-252 pending).
> **V12 Full-Body Engagement (TASK-256~258)** — completed.

---

## In Progress

_None_

---

## Pending

### TASK-252: Height-Zone Targets — Crouch & Reach
**Priority:** Medium | **Assigned:** /dev

Targets now spawn in extreme vertical positions that force physical movement: **floor-level** (must crouch/bend down to aim) and **overhead** (must look/reach up). Add visual indicators for height zones.

**Implementation:**
- Modify `_pick360Position()` in target-system.js:
  - 20% chance: floor spawn (Y: 0.3-0.6) — must physically crouch to aim downward
  - 15% chance: overhead spawn (Y: 3.5-5.0) — must look/reach up
  - 65% chance: normal range (Y: 1.0-2.5) — current behavior
- Floor targets get ground-glow ring (a-ring at Y=0.05, pulsing)
- Overhead targets get downward spotlight beam (a-cylinder, thin, from target to floor)
- Bonus: "Floor Sweep" and "Sky Shot" combo milestones at 3 consecutive floor/overhead hits (+bonus points)
- Audio cue variation: low rumble for floor, high chime for overhead

**Acceptance Criteria:**
- [ ] Targets spawn at floor level requiring physical crouch
- [ ] Targets spawn overhead requiring physical reach-up
- [ ] Visual indicators (ground ring, spotlight beam) for extreme positions
- [ ] Audio cues differ by height zone

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| TASK-256 | Punch Targets — Melee Strike | 2026-01-31 |
| TASK-257 | Rhythm Targets — Beat-Sync Shooting | 2026-01-31 |
| TASK-258 | Wall Lean — Dodge Laser Sweeps | 2026-01-31 |
| TASK-255 | Scare Balls — Dodge Reflex | 2026-01-31 |
| TASK-250 | Incoming Projectiles — Dodge or Die | 2026-01-31 |
| TASK-251 | Charging Targets — Turn & Track 360° | 2026-01-31 |
| TASK-253 | Danger Zones — Arena Repositioning | 2026-01-31 |
| TASK-254 | Shield Block — Hand Defense Mechanic | 2026-01-31 |
| TASK-240 | Target Spawn Telegraphing | 2026-01-31 |
| TASK-241 | Miss Impact Effects (Ricochet) | 2026-01-31 |
| TASK-242 | Dynamic Music Intensity | 2026-01-31 |
| TASK-243 | Ambient Environment Motion | 2026-01-31 |
| TASK-244 | Spatial Target Audio Cues | 2026-01-31 |
| TASK-234 | Weapon Model on Hand — Simple Geometric Gun | 2026-01-31 |
| TASK-235 | Environmental Light Pulse on Kill | 2026-01-31 |
| TASK-236 | Combo Milestone 3D Popup | 2026-01-31 |
| TASK-221 | Haptic Patterns — Weapon-specific fire & target-type hit confirmation | 2026-01-31 |
| TASK-220 | V4 Arena Upgrade — Floating platform, energy barriers, sky/void/env | 2026-01-31 |
| TASK-211 | Menu UI Redesign — Theme Selector & Layout Polish | 2026-01-31 |
| TASK-200~205 | V3 Graphics Upgrade (Shadows, Bloom, Geometry, Lasers, Particles, Camera) | 2026-01-30 |
| TASK-136 | Boss Rush Polish — Health Bar, Phases, Visual Upgrades | 2026-01-30 |
| TASK-135 | Haptic Feedback System | 2026-01-30 |
| TASK-134 | Slow-Motion Hit Effect | 2026-01-30 |
| TASK-133 | Power-Up System | 2026-01-30 |
| TASK-131 | Remove Cloudflare Tunnel — Nginx Proxy | 2026-01-30 |
| TASK-132 | Quest 2 build & run — portable deploy script | 2026-01-30 |
| TASK-130 | Quest build + deploy script | 2026-01-30 |
| TASK-122~129 | Cleanup, Shop UI, Menu UI, HUD, Game Over, Arena Visual | 2026-01-30 |
| TASK-121 | Fix VR Menu Buttons Not Clickable on Quest TWA | 2026-01-30 |
| TASK-101~120 | V2 Phase 1-4 (All features) | 2026-01-29 |

[View all completed tasks ->](./tasks-archive.md)
