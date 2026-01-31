# Task Management

> Last Updated: 2026-01-31
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 6 |
| Completed | 76 |

> V1–V13 — all completed (68 tasks).
> **V14 Content & QoL Upgrade (TASK-270~277)** — completed.
> **V15 Production Hardening & UX Polish (TASK-280~285)** — pending.

---

## In Progress

_None_

---

## Pending

### TASK-280: Service Worker + Offline Cache
**Priority:** High | **Assigned:** /dev

**Description:** Add service worker for offline play on Quest Browser:
- Register SW in all 8 HTML pages
- Cache strategy: A-Frame CDN + all built assets (JS/CSS/HTML) on install
- Network-first for Firebase calls, cache-first for static assets
- Offline fallback: game fully playable with localStorage profile
- Version-based cache busting (increment SW version on deploy)
- Add `manifest.json` enhancements for PWA install prompt

**Acceptance Criteria:**
- [ ] SW registered and caching all game assets
- [ ] Game loads and plays fully offline after first visit
- [ ] Firebase calls gracefully degrade (localStorage fallback already exists)
- [ ] New deploys invalidate old cache via version bump
- [ ] No console errors in offline mode

---

### TASK-281: Global Error Handling + Recovery
**Priority:** High | **Assigned:** /dev

**Description:** Add centralized error handling:
- `window.onerror` + `window.onunhandledrejection` → catch all uncaught errors
- User-friendly VR error overlay (a-text panel): "Something went wrong. Tap to retry."
- WebXR session loss recovery: detect `sessionend` event → show "VR session lost, re-entering..." → auto-restart
- Wrap critical paths (Firebase calls, audio context init, XR session request) with try-catch + user feedback
- Add `error-handler.js` in `core/`

**Acceptance Criteria:**
- [ ] Uncaught errors show friendly overlay instead of white screen
- [ ] WebXR session loss auto-recovers
- [ ] Firebase failures show "Offline mode" indicator
- [ ] Audio context blocked → shows "Tap to enable audio" prompt
- [ ] No error swallowing — all caught errors logged to console

---

### TASK-282: Loading Screen Tips + Progress
**Priority:** Medium | **Assigned:** /dev

**Description:** Add loading screen with tips:
- Pool of 15+ gameplay tips (weapon tips, power-up tips, mode tips, combo tips)
- Random tip displayed during page load + A-Frame scene init
- CSS loading overlay with spinner + tip text + progress bar
- Dismiss automatically when scene is ready (`scene.hasLoaded`)
- Add to game.html and index.html

**Acceptance Criteria:**
- [ ] Loading overlay shows on every page load
- [ ] Random tip rotates each load
- [ ] Progress indicator (spinner or bar)
- [ ] Auto-dismisses when scene ready
- [ ] Tips are accurate and helpful

---

### TASK-283: Weapon Tutorial Expansion
**Priority:** Medium | **Assigned:** /dev

**Description:** Expand tutorial system with weapon-specific lessons:
- Trigger on first unlock of each weapon (check `profile.weaponTutorials` map)
- 4 new mini-tutorials (shotgun, sniper, SMG, railgun):
  - **Shotgun**: "Wide spread hits multiple targets. Aim at groups!" + spawn 3 clustered targets
  - **Sniper**: "Slow but powerful. Aim carefully for 2x damage!" + spawn 1 distant target
  - **SMG**: "3-round burst. Tap trigger quickly!" + spawn 3 fast targets in sequence
  - **Railgun**: "Hold trigger to charge. Release for massive damage!" + spawn 1 heavy target
- Show as VR panel overlay with practice targets, auto-dismiss after completion
- Mark `weaponTutorials[weaponId] = true` in profile

**Acceptance Criteria:**
- [ ] Each weapon tutorial triggers once on first unlock
- [ ] Practice targets spawn appropriate to weapon type
- [ ] Tutorial panel shows weapon name + tip
- [ ] Completion saved to profile (no repeat)
- [ ] Can be replayed from settings page

---

### TASK-284: First-Unlock Tooltips
**Priority:** Low | **Assigned:** /dev

**Description:** Show VR popup notification when player unlocks new content:
- Weapon unlock (level gate): "New Weapon Unlocked! [icon] [name] — [description]"
- Game mode unlock: "New Mode Unlocked! [icon] [name]"
- Achievement unlock already has notification — skip
- Tooltip: 3D panel (a-entity) with glow border, auto-dismiss after 4s, position above player view
- Queue system: if multiple unlocks, show sequentially with 1s gap
- Track shown tooltips in `profile.shownTooltips[]` to prevent re-show

**Acceptance Criteria:**
- [ ] Weapon unlock shows tooltip on level-up
- [ ] Mode unlock shows tooltip
- [ ] Tooltips queue (no overlap)
- [ ] Each tooltip shown only once per content
- [ ] Auto-dismiss after 4s with fade animation

---

### TASK-285: Per-Weapon Detailed Stats
**Priority:** Low | **Assigned:** /dev

**Description:** Track and display per-weapon performance:
- New profile field: `perWeaponStats: { pistol: { kills: N, shots: N, games: N, bestScore: N }, ... }`
- Increment in `endGame()`: kills from targetSystem, shots from scoreManager, game count, score
- Stats dashboard: new "Weapon Performance" section showing per-weapon:
  - Kills, accuracy (kills/shots), games played, best score
  - Simple bar visualization (widest bar = most used weapon)
- Display in stats-main.js under weapon section

**Acceptance Criteria:**
- [ ] Per-weapon kills, shots, games, bestScore tracked
- [ ] Stats dashboard shows weapon performance breakdown
- [ ] Accuracy calculated per weapon
- [ ] Data persists across sessions
- [ ] Works for all 5 weapons

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
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
