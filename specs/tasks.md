# Task Management

> Last Updated: 2026-01-30
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 5 |
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

### TASK-211: Menu UI Redesign — Theme Selector & Layout Polish
**Priority:** High | **Status:** Pending
**Assigned:** /dev

**Description:**
Redesign menu UI. Click logic đã hoạt động (menuclick event). Vấn đề UI:
1. Theme row 5 buttons tràn panel (2.8 units > panel width)
2. Locked items chỉ hiện "Lv.X" — không biết theme gì
3. Emoji icons không render trong A-Frame a-text
4. Button sizes không consistent giữa các section

**Files:**
- `client/src/js/main.js` — Sửa `createButton()`, `buildThemeButtons()`, `buildModeButtons()`, `buildWeaponButtons()`
- `client/src/index.html` — Điều chỉnh Y positions nếu cần

**Design:**

**A. Replace emoji with text symbols** (A-Frame không render emoji):
- Modes: Time Attack→"TA", Survival→"SV", Zen→"ZN", Boss Rush→"BR"
- Weapons: Pistol→"P", Shotgun→"SG", Sniper→"SN"
- Themes: Cyber→"CY", Sunset→"SS", Space→"SP", Neon→"NE", Open Sky→"OS"
- Hoặc: bỏ icon hoàn toàn, chỉ hiện name

**B. Locked items hiện tên + lock indicator:**
- Format: `name (Lv.X)` thay vì chỉ `Lv.X`
- Color dimmed (#555566) giữ nguyên
- Ví dụ: `Shotgun (Lv.3)` thay vì `Lv.3`

**C. Theme buttons layout — 2 rows thay vì 1 row:**
- Row 1 (Y=0.1): 3 buttons (Cyber, Sunset, Space) — spacing 0.85
- Row 2 (Y=-0.2): 2 buttons (Neon, Open Sky) — spacing 0.85, centered
- Button size: 0.75 x 0.3 (same as mode/weapon)
- Hoặc: giữ 1 row nhưng thu nhỏ spacing 0.55, button width 0.5

**D. Consistent button sizing:**
- All sections: width 0.75, height 0.3, spacing 0.85
- createButton text width: `width * 2.5` (đủ đọc, không tràn)

**Acceptance Criteria:**
- [ ] Tất cả buttons nằm trong panel 4 units width
- [ ] Locked items hiện tên theme/mode/weapon (dimmed) + "(Lv.X)"
- [ ] Không dùng emoji — text-only labels
- [ ] Button sizes consistent across all sections
- [ ] Selected highlight rõ ràng
- [ ] Click vẫn hoạt động đúng (menuclick event)
- [ ] VR + Desktop đều hiện đúng

---

### TASK-209: Daytime Theme — Bright Open Sky Environment
**Priority:** Medium | **Status:** Pending
**Assigned:** /dev

**Description:**
Thêm theme ban ngày — bầu trời xanh sáng, ánh nắng tự nhiên, cảnh xa xanh lá. Theme sáng đầu tiên, tạo contrast với 4 theme tối hiện tại. Unlock level 1.

**Files:**
- `client/src/js/game/environment-themes.js` — Thêm theme `day` vào THEMES object

**Theme Properties:**
- `sky: '#87CEEB'` (light blue)
- `floor: '#aaaaaa'` (light concrete)
- `grid: '#999999'`, gridOpacity: 0.15
- Lights: bright ambient (#888888, 0.8), warm sun point (#ffffcc, 1.5), soft fill lights
- `shadowLight`: warm white, high intensity
- `skyGradient`: `{ bottom: '#b8d4e8', mid: '#87CEEB', top: '#4a90d9' }`
- `barrierColor: '#44aaff'` (soft blue shimmer)
- `platformSlabColor: '#888888'` (concrete)
- `edgeGlowColor: '#44cc88'` (natural green-blue)
- `underGlowColor: '#44aaff'`
- `distantEnv[]`: Green rolling hills (scaled spheres), fluffy clouds (white spheres), tree silhouettes (cones+cylinders), distant lake (blue plane)
- `belowEnv[]`: Ground plane far below (#558844 green), scattered cloud wisps

**Acceptance Criteria:**
- [ ] Theme `day` xuất hiện trong THEMES object
- [ ] Sky sáng, bầu trời xanh — cảm giác ban ngày rõ ràng
- [ ] Distant env: hills, clouds, trees — outdoor feeling
- [ ] Below void: ground + clouds bên dưới
- [ ] applyTheme() render đúng tất cả elements
- [ ] Performance ≥60fps Quest 2
- [ ] Không cần sửa HTML (dùng cùng structure)

---

### TASK-208: Floating Platform — Elevated Arena with Void Below
**Priority:** High | **Status:** Pending
**Assigned:** /dev

**Description:**
Biến arena từ flat floor thành floating platform nổi giữa không gian. Player cảm giác đứng trên đấu trường lơ lửng, nhìn xuống thấy vực sâu/mây bên dưới. Tăng immersion VR đáng kể.

**Files:**
- `client/src/index.html` — Floor structure
- `client/src/js/game/environment-themes.js` — Theme data + applyTheme()

**Scope A — Nâng platform lên:**
- Nâng toàn bộ `#game-content` hoặc chỉ floor lên Y=0 (giữ nguyên) nhưng thêm **platform thickness**
- Thêm `<a-box>` mỏng bên dưới floor (Y=-0.15, height=0.3) làm "slab" — dark metallic material
- Thu nhỏ main floor plane từ 100×100 → 32×32 (vừa đủ bao grid 30×30)
- Floor plane vẫn nhận shadow

**Scope B — Platform edge glow (viền sáng):**
- 4 thin planes hoặc boxes ở rìa platform (mỗi bên), emissive, theme-colored
- Width: 0.05, full length 32 units
- Animated pulse opacity 0.3→0.6
- Thay thế hoặc bổ sung cho wall-base-glow hiện tại

**Scope C — Under-glow (ánh sáng phía dưới):**
- 1 point light phía dưới platform (Y=-2), theme-colored, intensity thấp (0.3-0.5)
- Tạo rim light cho cạnh platform
- 1-2 glow rings ở dưới (torus, Y=-0.5) — giống reactor/engine glow

**Scope D — Void below (vực sâu):**
- Bỏ flat floor vô tận → player thấy sky bên dưới (void)
- Thêm per-theme "below" content vào `distantEnv`:
  - **Cyber:** Grid lines mờ chạy xuống dưới (data stream effect), distant floor rất xa (Y=-50)
  - **Sunset:** Cloud layer bên dưới (2-3 large flat planes, Y=-5 to -10, white/orange, opacity 0.1-0.2)
  - **Space:** Empty void + distant star clusters bên dưới
  - **Neon:** City lights bên dưới (small emissive dots scattered, Y=-10 to -30)
- Mỗi theme thêm property `belowEnv[]` giống `distantEnv[]`

**Scope E — Floor fade cleanup:**
- Cập nhật floor-fade từ TASK-207 cho phù hợp — fade ra rìa platform thay vì fade vô tận
- Floor fade planes giờ ở rìa 32×32 platform, nhỏ hơn (width 2-3 thay vì 14)

**Acceptance Criteria:**
- [ ] Floor có thickness (slab visible từ bên cạnh)
- [ ] Platform edge glow visible, theme-colored
- [ ] Under-glow tạo rim light effect
- [ ] Nhìn xuống/ngang thấy void (không còn flat floor vô tận)
- [ ] Mỗi theme có below content riêng
- [ ] applyTheme() cập nhật đúng tất cả elements mới
- [ ] Performance ≥60fps Quest 2
- [ ] VR comfortable — platform đủ lớn, không gây vertigo (32×32 rộng)

---

### TASK-207: Open Arena — Remove Walls, Expand Visual Space
**Priority:** High | **Status:** Pending
**Assigned:** /dev

**Description:**
Bỏ 4 bức tường kín, mở rộng không gian thị giác để player cảm thấy thoải mái, không bị giam. Giữ nguyên art direction sci-fi, chỉ thay đổi cấu trúc arena.

**Files:**
- `client/src/index.html` — Arena HTML structure
- `client/src/js/game/environment-themes.js` — Theme definitions & applyTheme()

**Scope A — Bỏ tường kín, thay ranh giới mềm:**
- Xoá 4 `<a-box>` tường (front/left/right/back walls, lines ~280-287 trong index.html)
- Giữ lại floor glow lines ở biên (đã có) làm ranh giới thị giác
- Thay tường bằng **energy barrier mềm**: thin plane, animated opacity 0.03→0.06 pulse, fade theo chiều cao (trong suốt ở trên, hơi thấy ở dưới). Chỉ gợi ý ranh giới, không chắn tầm nhìn
- Cập nhật wall references trong `applyTheme()` → apply style cho barrier mới

**Scope B — Distant environment cho mỗi theme:**
- Thêm cảnh xa (Z=-30 ~ -60, low-poly geometry + emissive) vào mỗi theme trong `environment-themes.js`:
  - **Cyber:** 5-8 tòa nhà hình hộp phát sáng (box, height vary 8-20), grid horizon line
  - **Sunset:** Silhouette dãy núi (cones/pyramids dark), mặt trời lớn (sphere emissive, r=5) gần horizon
  - **Space:** Hành tinh lớn (sphere r=8 + ring), trạm vũ trụ xa (torus + box)
  - **Neon:** Neon city skyline (boxes + emissive strips magenta/cyan), flying vehicles (small animated boxes)
- Đặt decorations ở 3 hướng (front, left, right) — back để trống cho player không bị overwhelm

**Scope C — Sky gradient có chiều sâu:**
- Thay `<a-sky color="solid">` bằng **sky dome với gradient**:
  - Dùng large inverted sphere (r=100) với custom shader hoặc canvas-generated gradient texture
  - Fallback đơn giản: 2-3 nested `<a-sphere>` ở scale lớn với opacity khác nhau tạo hiệu ứng gradient
  - Mỗi theme có gradient riêng:
    - Cyber: dark purple bottom → deep blue top
    - Sunset: warm orange bottom → dark red top
    - Space: pure black + scattered star dots
    - Neon: dark magenta bottom → dark purple top

**Scope D — Floor fading edges:**
- Floor chính giữ 30×30 grid
- Thêm 4 planes ở rìa floor (mỗi bên 10×30), material gradient opacity 0.3→0 hướng ra ngoài
- Tạo hiệu ứng floor mờ dần thay vì cắt đứt

**Acceptance Criteria:**
- [ ] Không còn 4 bức tường box cũ
- [ ] Ranh giới mềm (energy barrier) visible nhưng không chắn tầm nhìn
- [ ] Mỗi theme có distant environment riêng (ít nhất 5 objects xa)
- [ ] Sky có gradient (không đơn sắc)
- [ ] Floor fade ở rìa, không cắt đứt
- [ ] applyTheme() cập nhật đúng tất cả elements mới
- [ ] Performance ≥60fps trên Quest 2 (dùng low-poly, emissive, không texture nặng)
- [ ] Target spawn area & hit detection không bị ảnh hưởng

---

### TASK-206: Remove Stripe Payment Code — Use Meta IAP Only
**Priority:** Medium | **Status:** Pending
**Assigned:** /dev

**Description:**
Xoá toàn bộ Stripe integration. Game dùng Meta Digital Goods API cho IAP, Stripe không cần thiết. Giữ lại dev-mode instant grant cho testing.

**Scope — Server:**
- `server/routes/iap.js` — Xoá Stripe import, checkout session creation, webhook handler. Giữ `/api/products` và dev-mode purchase
- `server/db/database.js` — Xoá `updatePurchaseByStripeSession()`
- `server/index.js` — Xoá `express.raw()` webhook middleware
- `server/.env.example` — Xoá `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `purchases.json` — Reset data

**Scope — Client:**
- `client/src/js/iap/iap-manager.js` — Xoá `_devPurchase()` server checkout call. Giữ dev-mode instant grant

**Scope — Docs:**
- `specs/architecture.md` — Cập nhật bỏ Stripe references

**Acceptance Criteria:**
- [ ] Không còn Stripe code trong codebase
- [ ] Dev-mode instant grant vẫn hoạt động (khi không có Meta DG API)
- [ ] `/api/products` vẫn trả về danh sách sản phẩm
- [ ] Meta IAP flow không bị ảnh hưởng
- [ ] Server start OK, không lỗi missing Stripe

---

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
