# Task Management

> Last Updated: 2026-01-31
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 0 |
| Completed | 98 |

> V1–V13 — all completed (68 tasks).
> **V14 Content & QoL Upgrade (TASK-270~277)** — completed.
> **V15 Production Hardening & UX Polish (TASK-280~286)** — completed.
> **V16 Gameplay Engagement (TASK-287~291)** — completed.
> **V17 Player Retention & Social (TASK-292~296)** — completed.
> **V18 Reflex Mastery (TASK-300~304)** — completed.

---

## V18 — Reflex Mastery

> **Goal:** Tăng độ phản xạ người chơi thông qua cognitive challenges, reaction-time feedback, và game mode mới tập trung vào tốc độ.

## TASK-300: Reaction Time Tracker + HUD Display
**Priority:** High
**Status:** Pending
**Assigned:** /dev

### Description
Đo và hiển thị thời gian phản xạ (ms) cho mỗi lần bắn trúng target. Tính từ lúc target spawn xong (sau telegraph 500ms) đến lúc bị hit. Hiển thị trên HUD dạng "⚡ 320ms" và lưu average/best reaction time vào profile stats.

### Acceptance Criteria
- [ ] Mỗi target tracking `spawnReadyTime` (sau telegraph)
- [ ] Khi hit, tính `reactionTime = hitTime - spawnReadyTime`
- [ ] Floating damage number hiện thêm reaction time (ms) với color code: <200ms xanh lá, <400ms vàng, >400ms đỏ
- [ ] HUD element `hud-reaction` hiển thị average reaction time trong game hiện tại
- [ ] Lưu `bestReactionTime`, `avgReactionTime` vào profile qua `saveProfile()`
- [ ] Stats dashboard hiện reaction time stats

---

## TASK-301: Color-Match Targets (Cognitive Reflex)
**Priority:** High
**Status:** Pending
**Assigned:** /dev

### Description
Target mới spawn với 1 trong 3 màu (Red/Blue/Green). HUD hiện màu yêu cầu ("Shoot: 🔴"). Chỉ bắn đúng màu mới được điểm, bắn sai bị trừ điểm và reset combo. Màu yêu cầu thay đổi mỗi 5-8s. Buộc người chơi phải nhận diện nhanh trước khi bắn.

### Acceptance Criteria
- [ ] Thêm target type `colorMatch` (weight 25, spawn từ wave 3+)
- [ ] 3 màu rõ rệt: Red (#ff4444), Blue (#4488ff), Green (#44ff44)
- [ ] HUD indicator "SHOOT: 🔴/🔵/🟢" đổi mỗi 5-8s ngẫu nhiên
- [ ] Bắn đúng màu: 30 points + combo tiếp tục
- [ ] Bắn sai màu: -15 points + combo reset + haptic warning
- [ ] Color-match targets có ring glow pulsing theo màu của chúng
- [ ] Tương thích colorblind mode (dùng shape thay vì chỉ color)

---

## TASK-302: Reflex Rush Game Mode
**Priority:** High
**Status:** Pending
**Assigned:** /dev

### Description
Game mode mới tập trung 100% vào tốc độ phản xạ. Target xuất hiện 1 lần 1, lifetime bắt đầu 2s rồi giảm dần đến 500ms. Miss = game over. Leaderboard riêng cho mode này. Mỗi hit thành công hiện reaction time.

### Acceptance Criteria
- [ ] Thêm `reflexRush` vào GAME_MODES: 1 target/lần, lifetime giảm dần, miss = lose life (3 lives)
- [ ] Initial lifetime 2000ms, giảm 50ms mỗi lần hit thành công, minimum 500ms
- [ ] Chỉ spawn 1 target tại 1 thời điểm, vị trí random 360°
- [ ] Mỗi hit hiện reaction time lớn ở giữa màn hình (fade out 500ms)
- [ ] Speed bonus: <200ms = 3x points, <400ms = 2x, <600ms = 1.5x
- [ ] Leaderboard submit cho mode `reflexRush`
- [ ] Unlock level 3

---

## TASK-303: Fake-Out Targets (Blink Targets)
**Priority:** Medium
**Status:** Pending
**Assigned:** /dev

### Description
Target mới nhấp nháy giữa hittable (sáng) và invulnerable (tối/ghost) trạng thái. Chu kỳ 400-600ms. Phải bắn đúng lúc sáng. Bắn lúc tối = miss + combo reset. Train timing precision.

### Acceptance Criteria
- [ ] Thêm target type `blink` (weight 10, spawn từ wave 5+)
- [ ] Toggle visible/ghost mỗi 400-600ms (random per target)
- [ ] Visible state: bright glow, material opacity 1.0, hittable
- [ ] Ghost state: dim, material opacity 0.2, invulnerable (shots pass through)
- [ ] Hit khi visible: 35 points
- [ ] Hit khi ghost: -10 points + combo reset + red flash feedback
- [ ] Clear visual distinction (ghost có wireframe overlay)

---

## TASK-304: Peripheral Vision Trainer
**Priority:** Medium
**Status:** Pending
**Assigned:** /dev

### Description
Spawn target ở rìa tầm nhìn (90-150° từ hướng nhìn) với audio spatial cue mạnh. Target lifetime ngắn (2.5s). Buộc người chơi phải quay đầu nhanh để bắn. Bonus points cho peripheral hits.

### Acceptance Criteria
- [ ] Thêm target type `peripheral` (weight 8, spawn từ wave 4+)
- [ ] Spawn ở góc 90-150° so với camera forward vector (trái hoặc phải)
- [ ] Spatial audio cue rõ ràng (directional whoosh từ hướng target)
- [ ] Lifetime 2500ms (ngắn, buộc phải quay nhanh)
- [ ] 40 points per hit (cao hơn standard vì khó hơn)
- [ ] Visual: bright flashing border ở edge of FOV khi peripheral target active
- [ ] Tracking stat: `peripheralHits` lưu vào profile

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| TASK-300 | Reaction Time Tracker + HUD | 2026-01-31 |
| TASK-301 | Color-Match Targets | 2026-01-31 |
| TASK-302 | Reflex Rush Game Mode | 2026-01-31 |
| TASK-303 | Fake-Out Blink Targets | 2026-01-31 |
| TASK-304 | Peripheral Vision Trainer | 2026-01-31 |
| TASK-292 | Leaderboard UI + Friend Ranking | 2026-01-31 |
| TASK-293 | Daily Challenge Banner on Menu | 2026-01-31 |
| TASK-294 | Rank/Tier System (Bronze → Diamond) | 2026-01-31 |
| TASK-295 | Post-Game Summary Screen | 2026-01-31 |
| TASK-296 | Achievement Toast Notifications | 2026-01-31 |
| TASK-287 | Dynamic Target Movement Patterns | 2026-01-31 |
| TASK-288 | Wave Events / Mini-Objectives | 2026-01-31 |
| TASK-289 | Danger Projectiles — Dodge or Die | 2026-01-31 |
| TASK-290 | Score Multiplier Zones | 2026-01-31 |
| TASK-291 | End-of-Round Frenzy | 2026-01-31 |
| TASK-280 | Service Worker + Offline Cache | 2026-01-31 |
| TASK-281 | Global Error Handling + Recovery | 2026-01-31 |
| TASK-282 | Loading Screen Tips + Progress | 2026-01-31 |
| TASK-283 | Weapon Tutorial Expansion | 2026-01-31 |
| TASK-284 | First-Unlock Tooltips | 2026-01-31 |
| TASK-285 | Per-Weapon Detailed Stats | 2026-01-31 |
| TASK-286 | Declutter Game HUD | 2026-01-31 |
| TASK-270 | New Weapons — SMG + Railgun | 2026-01-31 |
| TASK-271 | New Power-ups — Shield, Magnet, Slow Field | 2026-01-31 |
| TASK-272 | Expanded Achievements — 10 New Milestones | 2026-01-31 |
| TASK-273 | Progressive Difficulty — Survival Scaling | 2026-01-31 |
| TASK-274 | Colorblind Mode — Accessibility Presets | 2026-01-31 |
| TASK-275 | Detailed Stats Dashboard | 2026-01-31 |
| TASK-276 | Difficulty Presets — Easy/Normal/Hard | 2026-01-31 |
| TASK-277 | Seasonal Events — Weekly Rotating Challenge | 2026-01-31 |
| TASK-252 | Height-Zone Targets — Crouch & Reach | 2026-01-31 |
| TASK-260 | Weather System — Neon Rain & Space Dust | 2026-01-31 |
| TASK-261 | Destructible Environment | 2026-01-31 |
| TASK-262 | Environmental Reactions | 2026-01-31 |
| TASK-263 | Underwater Theme | 2026-01-31 |
| TASK-256 | Punch Targets | 2026-01-31 |
| TASK-257 | Rhythm Targets | 2026-01-31 |
| TASK-258 | Wall Lean Dodge | 2026-01-31 |
| TASK-255 | Scare Balls | 2026-01-31 |
| TASK-250~254 | V11 Physical Movement | 2026-01-31 |
| TASK-240~244 | V10 Immersion | 2026-01-31 |
| TASK-234~236 | V9 Effects & Interaction | 2026-01-31 |

[View all completed tasks ->](./tasks-archive.md)
