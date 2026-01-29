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

_None_

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
