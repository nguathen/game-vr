# Task Management

> Last Updated: 2026-01-30
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 0 |
| Completed | 39 |

> V1 (TASK-010~020), V2 Phase 1-4 (TASK-101~120), Cleanup (TASK-122~129),
> Build/Deploy (TASK-130~132), Power-Ups (TASK-133), Slow-Mo (TASK-134),
> Haptic Feedback (TASK-135), Boss Rush Polish (TASK-136) — all completed.
> **V3 Graphics Upgrade (TASK-200~205)** — in progress.

---

## In Progress

_None_

---

## Pending

### TASK-200: Shadows & Lighting Upgrade ✅
**Priority:** High | **Status:** Completed | **Completed:** 2026-01-30

**Description:**
Nâng cấp hệ thống ánh sáng và bóng đổ cho arena.

**Scope:**
- Thêm `directional-light` với shadow casting (`castShadow: true`)
- Bật `shadow="receive: true"` trên floor, `cast: true` trên targets
- Renderer shadow map: `PCFSoftShadowMap`, shadow map size 1024
- Tăng light quality: softer falloff, better color blending
- Thêm subtle ambient occlusion feel bằng dark gradient ở floor edges
- Đảm bảo mỗi theme cập nhật shadow light direction/color phù hợp

**Acceptance Criteria:**
- [ ] Targets đổ bóng xuống floor
- [ ] Shadow mềm (PCFSoft), không jagged
- [ ] Hoạt động tốt trên Quest 2 (≥60fps)
- [ ] 4 themes đều có shadow phù hợp

---

### TASK-201: Bloom / Glow Post-Processing ✅
**Priority:** High | **Status:** Completed | **Completed:** 2026-01-30
**Depends:** TASK-200

**Description:**
Thêm bloom post-processing cho emissive objects (targets, glow rings, power-ups).

**Scope:**
- Tích hợp Three.js `UnrealBloomPass` qua A-Frame custom component
- Tạo component `bloom-effect` attach vào `<a-scene>`
- Params: `strength: 0.6`, `radius: 0.4`, `threshold: 0.7` (tunable)
- Emissive objects (targets, glow rings, corner pillars) sẽ glow tự nhiên
- Thêm settings toggle "Bloom: On/Off" cho low-end devices
- Fallback: nếu Quest không support, skip gracefully

**Acceptance Criteria:**
- [ ] Emissive targets có real bloom glow
- [ ] Glow rings / corner pillars bloom rõ rệt
- [ ] Settings toggle hoạt động
- [ ] Performance ≥60fps trên Quest 2 (hoặc auto-disable)

---

### TASK-202: Better Target Geometry ✅
**Priority:** Medium | **Status:** Completed | **Completed:** 2026-01-30
**Depends:** TASK-201

**Description:**
Nâng cấp hình dạng target từ sphere/box đơn giản lên geometry phức tạp hơn.

**Scope:**
- Standard: `icosahedron` (thay sphere) — khối đa giác futuristic
- Speed: `octahedron` — diamond shape, nhỏ gọn nhanh
- Heavy: `dodecahedron` (thay box) — khối nặng góc cạnh
- Bonus: `torus` — ring shape nổi bật
- Decoy: giữ `sphere` nhưng thêm wireframe overlay (lưới giả)
- Power-up: `torusKnot` — complex shape dễ nhận biết
- Boss: compound geometry — inner sphere + outer wireframe ring rotating
- Thêm subtle wireframe overlay (opacity 0.15) cho tất cả target types

**Acceptance Criteria:**
- [ ] 6 target types có geometry riêng biệt, dễ phân biệt
- [ ] Boss target có compound geometry ấn tượng
- [ ] Wireframe overlay cho thêm depth
- [ ] Không ảnh hưởng hit detection

---

### TASK-203: Laser Trail Effect ✅
**Priority:** Medium | **Status:** Completed | **Completed:** 2026-01-30
**Depends:** TASK-200

**Description:**
Thêm laser beam trail khi bắn — visible projectile path.

**Scope:**
- Tạo component `laser-trail` hoặc extend `shoot-controls`
- Khi fire: spawn thin cylinder/line từ controller → hit point
- Trail properties: length theo distance, width 0.005-0.01
- Color theo weapon skin (fire=orange, ice=cyan, etc.)
- Fade out: opacity 1→0 over 150ms, then remove
- Emissive material cho glow effect (synergy với bloom TASK-201)
- Muzzle flash: small bright sphere at gun tip, 50ms lifetime
- Haptic pulse on fire (đã có từ TASK-135)

**Acceptance Criteria:**
- [ ] Laser trail visible khi bắn
- [ ] Color match weapon skin
- [ ] Muzzle flash at controller
- [ ] Smooth fade out, không flicker
- [ ] Performance OK (object pooling nếu cần)

---

### TASK-204: Environment Particles Upgrade ✅
**Priority:** Medium | **Status:** Completed | **Completed:** 2026-01-30
**Depends:** TASK-200

**Description:**
Nâng cấp ambient particles — nhiều hơn, đẹp hơn, dynamic hơn.

**Scope:**
- Tăng particle count: 25 → 60-80 (nhưng smaller, cheaper)
- Thêm loại particles:
  - **Dust motes**: tiny (0.01), slow float, warm color, opacity 0.1-0.2
  - **Energy sparks**: tiny (0.008), fast random movement, bright emissive, short lifetime
  - **Floating debris**: small geometric shapes (0.02-0.04), slow rotation
- Theme-specific particles:
  - Cyber: blue/cyan energy sparks
  - Sunset: warm dust motes, ember-like orange sparks
  - Space: twinkling star particles, slow nebula drift
  - Neon: bright neon flashes, color-cycling sparks
- Spawn burst on events: target destroy → 3-5 extra sparks, combo → energy wave
- Particle pooling for performance

**Acceptance Criteria:**
- [ ] 60-80 ambient particles, visually rich
- [ ] 3 particle types (dust, sparks, debris)
- [ ] Theme-specific particle colors/behavior
- [ ] Event-triggered burst particles
- [ ] ≥60fps on Quest 2

---

### TASK-205: Screen Shake & Camera Effects ✅
**Priority:** Low | **Status:** Completed | **Completed:** 2026-01-30
**Depends:** TASK-202, TASK-203

**Description:**
Thêm camera effects cho game feel — screen shake, FOV punch, impact zoom.

**Scope:**
- Tạo component `camera-effects` attach vào `<a-camera>`
- **Screen shake**: on hit → small random position offset (±0.01) for 100ms
- **Combo shake**: intensity scales with combo (x5=mild, x10=medium, x15+=strong)
- **FOV punch**: on fire → brief FOV expand 80→82 over 50ms, return 100ms
- **Boss kill**: big shake (±0.03) for 300ms + white flash
- **Impact zoom**: on slow-mo trigger → subtle zoom in (scale 1→1.02) over 200ms
- Settings: "Screen Shake: Off/Low/Medium/High" toggle
- Easing: use `easeOutQuad` for natural decay

**Acceptance Criteria:**
- [ ] Screen shake on hit, scales with combo
- [ ] FOV punch on fire
- [ ] Boss kill dramatic shake
- [ ] Settings toggle works
- [ ] No motion sickness (keep amplitudes small for VR)

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| TASK-136 | Boss Rush Polish — Health Bar, Phases, Visual Upgrades | 2026-01-30 |
| TASK-135 | Haptic Feedback System | 2026-01-30 |
| TASK-134 | Slow-Motion Hit Effect | 2026-01-30 |
| TASK-133 | Power-Up System | 2026-01-30 |
| TASK-131 | Remove Cloudflare Tunnel — Nginx Proxy | 2026-01-30 |
| TASK-132 | Quest 2 build & run — portable deploy script | 2026-01-30 |
| TASK-130 | Quest build + deploy script | 2026-01-30 |
| TASK-122 | Clean debug/temp and redundant files | 2026-01-30 |
| TASK-123 | Production logging cleanup | 2026-01-30 |
| TASK-124 | In-Game VR Shop UI | 2026-01-30 |
| TASK-125 | VR Menu UI Upgrade | 2026-01-30 |
| TASK-126 | VR HUD Upgrade | 2026-01-30 |
| TASK-127 | Game Over Screen Upgrade | 2026-01-30 |
| TASK-128 | VR Shop UI Upgrade | 2026-01-30 |
| TASK-129 | Game Arena Visual Upgrade | 2026-01-30 |
| TASK-121 | Fix VR Menu Buttons Not Clickable on Quest TWA | 2026-01-30 |
| TASK-120 | UI Polish & Animations | 2026-01-29 |
| TASK-119 | Game Replay Summary & Share | 2026-01-29 |
| TASK-118 | Friend System & Social | 2026-01-29 |
| TASK-117 | Background Music & Sound Polish | 2026-01-29 |
| TASK-116 | Tutorial & Onboarding | 2026-01-29 |

[View all completed tasks ->](./tasks-archive.md)
