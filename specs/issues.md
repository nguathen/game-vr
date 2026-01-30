# Issue Tracker

> Last Updated: 2026-01-29
> Purpose: Track bugs/regressions discovered during development.

---

## Overview

| Status | Count |
|--------|-------|
| Open | 0 |
| In Progress | 0 |
| Resolved | 6 |

---

## Open Issues

### ISSUE-007: [High] Menu buttons not clickable on Quest TWA app

**Severity:** High
**Status:** Resolved (2026-01-30)
**Found By:** User (manual testing on Quest 2)
**Date:** 2026-01-30
**Assigned:** /dev

### Description
Welcome screen buttons (Play, mode selection, weapon selection) cannot be clicked when running inside the Quest TWA app. Same buttons work fine on desktop browser.

### Repro Steps
1. Launch app on Quest 2 via TWA
2. Auto-enters VR mode
3. Point controller laser at "PLAY" button
4. Pull trigger — nothing happens
5. Same for mode/weapon buttons

### Expected Behavior
Buttons should respond to VR controller trigger press.

### Actual Behavior
Buttons are visible but non-interactive in Quest TWA. Work fine on desktop.

### Location
- **File:** `src/js/main.js`
- **Functions:** `setupControllerClick()`, `autoEnterVR()`, `buildModeButtons()`, `buildWeaponButtons()`
- **File:** `src/index.html` (controller raycaster config)

### Root Cause (3 issues)
1. **Dynamic buttons not captured:** `setupControllerClick()` line 153 queries `.clickable` at setup time, but mode/weapon buttons are created dynamically after. These buttons miss mouseenter/mouseleave handlers.
2. **Raycaster static selector:** `raycaster="objects: .clickable"` on controllers is evaluated at parse time. Dynamically added `.clickable` elements may not be picked up without forcing a raycaster refresh.
3. **Race condition:** `autoEnterVR()` fires immediately (line 177), but `initMenu()` waits for `authManager.waitReady()` (line 179). VR session starts before buttons exist → raycaster finds nothing.

### Fix Plan
1. **Force raycaster refresh** after dynamic buttons are created — call `hand.components.raycaster.refreshObjects()` after `buildModeButtons()` and `buildWeaponButtons()`
2. **Move autoEnterVR()** inside the `authManager.waitReady().then()` block, after `initMenu()` completes
3. **Use event delegation** for hover effects instead of static querySelectorAll

---

## In Progress

_None_

---

## Recently Resolved

### ISSUE-001: [Medium] Dead code in shoot-controls shotgun ray
**Status:** Resolved (2026-01-29)
**Fix:** Removed dead line `raycaster.raycaster.ray.origin.toArray()` from `shoot-controls.js`.

### ISSUE-002: [Medium] Dual data persistence — GameManager and AuthManager conflict
**Status:** Resolved (2026-01-29)
**Fix:** Stripped `GameManager` to pure state machine. Removed `gameManager` dependency from `ScoreManager`. Migrated `shop-main.js` to use `authManager`.

### ISSUE-003: [Medium] Zen mode has no way to end the game
**Status:** Resolved (2026-01-29)
**Fix:** Added a "Quit" button (`btn-quit`) visible during gameplay in `game.html`. Wired to `endGame()` in `game-main.js`. Styled in `style.css`.

### ISSUE-004: [Low] `bossRush` mode missing from `DEFAULT_PROFILE.highScores`
**Status:** Resolved (2026-01-29)
**Fix:** Added `bossRush: 0` to `DEFAULT_PROFILE.highScores` in `auth-manager.js`.

### ISSUE-005: [Low] `init()` may be called twice
**Status:** Resolved (2026-01-29)
**Fix:** Added `let initialized = false` guard with `safeInit()` wrapper in both `game-main.js` and `main.js`.

### ISSUE-006: [Low] Unused variable `key` in `updateHighScore`
**Status:** Resolved (2026-01-29)
**Fix:** Removed unused `const key = 'highScores'` from `auth-manager.js`.

---

## Issue Template

```markdown
### ISSUE-XXX: Issue Title

**Severity:** Critical | High | Medium | Low
**Status:** Open | In Progress | Resolved
**Found By:** /code-check | /test | /debug | /sec
**Date:** YYYY-MM-DD
**Assigned:** /dev | /tl

### Description
What is the problem?

### Repro Steps
1. ...

### Expected Behavior
...

### Actual Behavior
...

### Location
- **File:** `path/to/file.py`
- **Function/Method:** `name()`

### Root Cause
...

### Fix
...

### Verification
...
```
