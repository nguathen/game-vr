# Task Management

> Last Updated: 2026-01-30
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 3 |
| Completed | 37 |

> Note: V1 tasks (TASK-010~020) completed. V2 Phase 1 (TASK-101~105) completed + all 6 issues resolved.
> V2 Phase 2 (TASK-106~110) completed.
> V2 Phase 3 (TASK-111~115) completed.
> V2 Phase 4 (TASK-116~120) completed.
> V2 Cleanup (TASK-122~129) completed. Power-Ups (TASK-133) + Slow-Mo (TASK-134) completed.

---

## In Progress

_None_

---

## Pending

### TASK-135: Haptic Feedback System — Hit/Combo/Power-Up Vibrations
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Expand haptic feedback beyond weapon fire. Currently only `shoot-controls.js` pulses on trigger. Add context-aware vibrations for target hits, combo milestones, power-up activations, slow-mo, damage taken (survival), and boss kills. Use the vibration settings slider (already exists: `settings.vibration` 0-100).

#### Current State
- `shoot-controls.js:64-72`: Fires haptic on weapon trigger via `gamepad.hapticActuators[0].pulse(intensity, duration)`
- `settings-main.js`: Has `vibration: 50` slider (0-100), saved to profile
- Controllers: `oculus-touch-controls` or `tracked-controls` on `#left-hand` / `#right-hand`

#### Implementation

**New file: `client/src/js/core/haptic-manager.js`**
```js
import { getSettings } from '../game/settings-util.js';

class HapticManager {
  pulse(intensity, duration) {
    const settings = getSettings();
    const scale = (settings.vibration ?? 50) / 100;
    if (scale === 0) return;

    const scaledIntensity = Math.min(intensity * scale, 1.0);
    ['left-hand', 'right-hand'].forEach(id => {
      const el = document.getElementById(id);
      const tracked = el?.components?.['oculus-touch-controls']
        || el?.components?.['tracked-controls'];
      if (tracked?.controller?.gamepad?.hapticActuators?.[0]) {
        try {
          tracked.controller.gamepad.hapticActuators[0].pulse(scaledIntensity, duration);
        } catch { /* ignore */ }
      }
    });
  }

  // Presets
  hit()        { this.pulse(0.4, 40); }
  combo(n)     { this.pulse(Math.min(0.3 + n * 0.05, 1.0), 60); }
  powerUp()    { this._pattern([0.5, 80], [0.0, 50], [0.7, 80]); }
  slowMo()     { this.pulse(0.8, 200); }
  damageTaken(){ this._pattern([1.0, 100], [0.0, 50], [1.0, 100]); }
  bossKill()   { this._pattern([0.6, 60], [0.0, 40], [0.8, 80], [0.0, 40], [1.0, 120]); }

  async _pattern(...steps) {
    for (const [intensity, duration] of steps) {
      if (intensity > 0) this.pulse(intensity, duration);
      await new Promise(r => setTimeout(r, duration));
    }
  }
}

const hapticManager = new HapticManager();
export default hapticManager;
```

**Integration points:**

1. **`shoot-controls.js`** — Replace inline haptic code (lines 64-73) with:
   ```js
   import hapticManager from '../core/haptic-manager.js';
   // In _onTrigger(): remove old haptic block, add:
   hapticManager.pulse(weapon?.hapticIntensity || 0.3, weapon?.hapticDuration || 50);
   ```
   **Note:** shoot-controls is a non-module A-Frame component. Use `window.__hapticManager` pattern (same as weaponSystem).

2. **`target-system.js` → `_onTargetHit()`:**
   - After `audioManager.playHit()`: `window.__hapticManager?.hit()`
   - After combo check: `window.__hapticManager?.combo(this._combo)`
   - On power-up activate: `window.__hapticManager?.powerUp()`

3. **`target-system.js` → `_triggerSlowMotion()`:**
   - After `audioManager.playSlowMoHit()`: `window.__hapticManager?.slowMo()`

4. **`game-main.js`:**
   - Import hapticManager, set `window.__hapticManager = hapticManager`
   - On life lost (survival mode miss handler): `hapticManager.damageTaken()`
   - On boss kill (wave milestone in bossRush): detect via `_wave % 5 === 0` in target-system, dispatch `boss-wave-clear` event, hapticManager.bossKill()

5. **`game-main.js` → countdown:**
   - On each countdown tick (3, 2, 1): `hapticManager.pulse(0.2, 30)` — subtle tick

#### Acceptance Criteria
- [ ] HapticManager singleton with centralized vibration control
- [ ] Vibration scaled by settings.vibration slider (0 = off, 100 = full)
- [ ] Hit vibration on every target hit
- [ ] Combo vibration escalates with combo count
- [ ] Power-up activation: double-pulse pattern
- [ ] Slow-mo: long heavy pulse
- [ ] Damage taken (survival miss): strong double-pulse
- [ ] Boss wave clear: celebration pattern
- [ ] Countdown ticks: subtle pulse
- [ ] Weapon fire haptic still works (migrated to HapticManager)
- [ ] No vibration when slider = 0
- [ ] Works on Quest 2 controllers

---

### TASK-136: Boss Rush Polish — Health Bar, Phases, Visual Upgrades
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Boss Rush mode currently just spawns heavy targets with scaling HP. Make it feel like actual boss fights with visible health bars, wave announcements, boss size scaling, unique visual effects, and phase transitions.

#### Current State
- `game-modes.js`: bossRush mode — `lives: 5, spawnInterval: 3000, maxTargets: 4`
- `target-system.js`: `_bossMode` flag → `_pickTargetType()` always returns `'heavy'`
- HP scaling: `type.hp + Math.floor(this._wave / 3)` — boss gains +1 HP every 3 waves
- Heavy target: `a-box`, red, radius 0.4, hp: 2, no speed, no lifetime

#### Implementation

**A. Boss Health Bar (VR HUD)**
File: `client/src/index.html` → inside `<a-camera>` (and `game.html`)
```html
<a-entity id="hud-boss" visible="false" position="0 -0.25 -1">
  <a-plane id="boss-bar-bg" width="0.5" height="0.03" color="#330000" shader="flat" opacity="0.7"></a-plane>
  <a-plane id="boss-bar-fill" width="0.5" height="0.025" color="#ff3333" shader="flat"
           position="0 0 0.001"></a-plane>
  <a-text id="boss-bar-label" value="BOSS" position="0 0.03 0" scale="0.15 0.15 0.15"
          color="#ff6666" font="mozillavr" align="center"></a-text>
</a-entity>
```

**B. Wave Announcement**
File: `client/src/js/game-main.js`
- On every wave start in bossRush: show floating text "WAVE X" in HUD for 2s
- Every 5 waves: show "BOSS WAVE!" in gold with larger text
- Use existing `#hud-combo` position temporarily, or add `#hud-announcement` text

**C. Boss Target Visual Scaling**
File: `client/src/js/game/target-system.js` → `_spawnTarget()`
- In bossMode, scale boss size with wave: `scale = 1.0 + (wave * 0.05)` (max 2.0)
- Boss color shifts: wave 1-5 red, 6-10 orange (#ff6600), 11-15 purple (#aa00ff), 16+ gold (#ffd700)
- Add pulsing emissive animation (like power-up but slower, red glow)
- Add rotation animation: slower spin for heavier bosses

**D. Boss Health Bar Update Logic**
File: `client/src/js/game/target-system.js`
- Track current boss target ref: `this._currentBoss = null`
- On boss spawn: set `_currentBoss`, dispatch `boss-spawn` event with `{ hp, maxHp }`
- On boss hit (partial damage, not destroyed): dispatch `boss-damaged` event with `{ hp, maxHp }`
- On boss destroyed: dispatch `boss-killed` event, `_currentBoss = null`

File: `client/src/js/game-main.js`
- Listen `boss-spawn`: show `#hud-boss`, set bar width to 100%
- Listen `boss-damaged`: update `#boss-bar-fill` width = `(hp/maxHp) * 0.5`
- Listen `boss-killed`: hide `#hud-boss` after 0.5s fade, show "+X pts" flash
- Color transitions: >50% HP green, 25-50% yellow, <25% red

**E. Wave Clear Feedback**
File: `client/src/js/game/target-system.js`
- Track kills per wave: `this._waveKills` counter, reset every 5 kills
- On wave clear (every 5 kills in bossMode): dispatch `boss-wave-clear` event
- Briefly pause spawning for 1.5s between waves (dramatic pause)

File: `client/src/js/game-main.js`
- On `boss-wave-clear`: show "WAVE X CLEAR!" text, play level-up sound
- Increment wave counter display

**F. Audio**
File: `client/src/js/core/audio-manager.js`
- Add `playBossSpawn()`: deep rumble (60Hz sine, 500ms, heavy gain envelope)
- Add `playBossHit()`: metallic clang (high freq + low freq combo, short)
- Add `playBossKill()`: explosion + ascending chime (combine existing patterns)

#### Acceptance Criteria
- [ ] Boss health bar visible in HUD during bossRush
- [ ] Health bar updates on each hit, color transitions by HP %
- [ ] Health bar hidden when no boss present
- [ ] Wave announcement shows "WAVE X" / "BOSS WAVE!" text
- [ ] Boss targets scale larger with wave progression
- [ ] Boss color shifts by wave tier (red → orange → purple → gold)
- [ ] Boss has pulsing glow animation
- [ ] 1.5s pause between waves for dramatic effect
- [ ] Wave clear text + sound on every 5 kills
- [ ] Boss spawn/hit/kill SFX (procedural, no files)
- [ ] Works on Quest 2 (performance OK with larger bosses)
- [ ] Existing non-boss modes unaffected

---

### TASK-133: Power-Up System
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Add a power-up system where special targets drop temporary buffs. Three power-up types: Double Points, Freeze Time, Multi-shot.

#### Design

**New file:** `client/src/js/game/power-up-manager.js`

```js
const POWER_UPS = {
  doublePoints: { duration: 10000, color: '#00ff88', icon: '2X', label: 'DOUBLE POINTS!' },
  freezeTime:   { duration: 5000,  color: '#00d4ff', icon: '❄️', label: 'TIME FREEZE!' },
  multiShot:    { duration: 10000, color: '#ff44aa', icon: '💥', label: 'MULTI-SHOT!' },
};
```

**PowerUpManager class:**
- `_activePowerUps: Map<string, { timeout, startTime }>` — tracks active buffs
- `activate(type)` — starts buff, sets timeout for deactivation, emits event
- `deactivate(type)` — removes buff, emits event
- `isActive(type)` → boolean
- `getMultiplier()` → returns `2` if doublePoints active, else `1`
- `getProjectileCount(base)` → returns `base * 3` if multiShot active, else `base`
- `isTimeFrozen()` → boolean
- `reset()` — clears all active power-ups

**New target type in `target-system.js`:**
```js
// Add to TARGET_TYPES:
powerup: { weight: 5, points: 10, radius: 0.35, geometry: 'a-sphere', color: '#00ffaa', hp: 1, speed: 1.5, lifetime: 3000, coins: 0 }

// Add to TARGET_MATERIALS:
powerup: { metalness: 0.9, roughness: 0.1, emissive: '#00ffaa', emissiveIntensity: 1.0 }
```

**Power-up spawn logic** (in `_onTargetHit`):
- When a `powerup` target is hit, randomly pick one of 3 power-up types
- Call `powerUpManager.activate(type)`
- Show floating label with power-up name (reuse `_spawnDamageNumber` with custom text)

**Integration points:**

1. **`target-system.js` → `_onTargetHit()`:**
   - After scoring: `const multiplier = ... * powerUpManager.getMultiplier()`
   - If target type is `powerup`: `powerUpManager.activate(randomPowerUp)`

2. **`weapon-system.js` → `fire()`:**
   - Return modified projectile count: `weapon.projectiles * powerUpManager.getProjectileCount(1)` when multiShot active

3. **`game-main.js` → timer interval:**
   - Skip `timeLeft--` when `powerUpManager.isTimeFrozen()`

4. **`game-main.js` → HUD:**
   - Add `#hud-powerup` text element to show active power-up name + remaining time
   - Update every 100ms while power-up is active
   - Position: `0 0.12 -1` (below combo, above crosshair)

5. **`audio-manager.js`:**
   - Add `playPowerUp()` — ascending chime (achievement-like but shorter)
   - Add `playPowerUpEnd()` — subtle fade-out tone

6. **`index.html`:**
   - Add `<a-text id="hud-powerup" ...>` inside `<a-camera>`

7. **Visual feedback:**
   - Power-up target: pulsing glow animation (emissiveIntensity oscillate 0.5-1.0)
   - On activation: screen flash green + power-up label float up
   - Power-up target spins (rotation animation)

#### Acceptance Criteria
- [ ] New `powerup` target type spawns with 5% weight
- [ ] Power-up target has distinct visual (green glow, spinning, pulsing)
- [ ] Hitting power-up target activates random buff
- [ ] Double Points: score ×2 for 10 seconds
- [ ] Freeze Time: timer pauses for 5 seconds
- [ ] Multi-shot: weapon fires 3× projectiles for 10 seconds
- [ ] HUD shows active power-up name + countdown
- [ ] Power-up SFX on activate/deactivate
- [ ] PowerUpManager.reset() called on game start/end
- [ ] Works on Quest 2

---

### TASK-134: Slow-Motion Hit Effect (Combo 10+)
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** TASK-133 (shares game-main.js changes)

#### Description
When combo reaches 10+, the next hit triggers a 0.3s slow-motion effect for dramatic feel.

#### Implementation

**In `target-system.js` → `_onTargetHit()`:**
```js
// After combo increment, if combo >= 10:
if (this._combo >= 10 && !isDecoy) {
  this._triggerSlowMotion();
}
```

**`_triggerSlowMotion()` method in TargetSystem:**
```js
_triggerSlowMotion() {
  if (this._slowMoActive) return;
  this._slowMoActive = true;

  // 1. Slow all target animations to 0.3x speed
  this._targets.forEach(el => {
    ['animation__move', 'animation__float', 'animation__rotate'].forEach(anim => {
      if (el.getAttribute(anim)) {
        const current = el.getAttribute(anim);
        el.setAttribute(anim, 'dur', current.dur * 3);
      }
    });
  });

  // 2. Dispatch event for game-main to handle timer/HUD
  document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: true } }));

  // 3. Restore after 300ms
  setTimeout(() => {
    this._slowMoActive = false;
    this._targets.forEach(el => {
      ['animation__move', 'animation__float', 'animation__rotate'].forEach(anim => {
        if (el.getAttribute(anim)) {
          const current = el.getAttribute(anim);
          el.setAttribute(anim, 'dur', current.dur / 3);
        }
      });
    });
    document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: false } }));
  }, 300);
}
```

**In `game-main.js`:**
```js
// Listen for slow-motion event
document.addEventListener('slow-motion', (e) => {
  if (e.detail.active) {
    // Visual: add blue tint overlay
    _showSlowMoOverlay();
    // Audio: lower pitch of background music temporarily
    musicManager.setPlaybackRate(0.5);
  } else {
    _hideSlowMoOverlay();
    musicManager.setPlaybackRate(1.0);
  }
});
```

**`_showSlowMoOverlay()` / `_hideSlowMoOverlay()`:**
- Create/show a full-screen `div` with `background: radial-gradient(transparent 50%, rgba(0, 100, 255, 0.15))`
- CSS transition opacity 0→1 in 50ms, 1→0 in 100ms
- Add CSS class `slow-mo-active` to body for potential other effects

**In `music-manager.js`:**
- Add `setPlaybackRate(rate)` method — adjusts all active oscillator `playbackRate` or detune
- Simple approach: adjust master gain + create a low-pass filter effect during slow-mo

**In `audio-manager.js`:**
- Add `playSlowMoHit()` — deep reverb hit sound (low frequency sine with long decay)

**In `client/src/css/style.css`:**
```css
.slow-mo-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0, 100, 255, 0.12) 100%);
  pointer-events: none; z-index: 50;
  opacity: 0; transition: opacity 0.05s ease-in;
}
.slow-mo-overlay.active { opacity: 1; }
```

#### Acceptance Criteria
- [ ] At combo 10+, each hit triggers 0.3s slow-motion
- [ ] All target animations slow to 0.3× speed during slow-mo
- [ ] Blue tint overlay appears during slow-mo
- [ ] Background music pitch drops during slow-mo
- [ ] Special deep hit sound plays
- [ ] Slow-mo doesn't stack (only one at a time)
- [ ] Timer continues normally (slow-mo is visual only, doesn't affect game time)
- [ ] Performance OK on Quest 2 (no frame drops)
- [ ] Respects `reducedMotion` setting (skip overlay if enabled)

---

### TASK-132: Quest 2 build & run — portable deploy script
**Priority:** High
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
Make `quest-deploy.ps1` work on any dev machine (no hardcoded user paths). Use ANDROID_HOME (default %LOCALAPPDATA%\Android\Sdk) for adb, JAVA_HOME (default Android Studio jbr) for Gradle, and quest-wrapper\gradlew.bat for APK build.

#### Acceptance Criteria
- [x] ADB path from ANDROID_HOME\platform-tools\adb.exe
- [x] Gradle via quest-wrapper\gradlew.bat (assembleRelease)
- [x] JAVA_HOME/ANDROID_HOME fallbacks documented in architecture
- [x] specs/architecture.md section "Build & Run on Quest 2" with prerequisites and steps

---

### TASK-131: Remove Cloudflare Tunnel — Use Nginx Proxy (vr.proxyit.online)
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Remove all Cloudflare Tunnel logic. Server runs local on `:3001`, nginx reverse proxy handles `vr.proxyit.online` → `localhost:3001` (user-managed). All hardcoded trycloudflare URLs replaced with `vr.proxyit.online`.

#### Files to Modify

**1. `package.json` (root)**
- Remove `"tunnel"` script

**2. `quest-deploy.ps1`**
- Remove `-TunnelUrl` parameter
- Remove entire tunnel step (lines 101-132): no more `cloudflared`, no log parsing
- Replace dynamic hostname injection with static `vr.proxyit.online`:
  - `hostName: 'vr.proxyit.online'` in build.gradle update
  - `https://vr.proxyit.online` in strings.xml update
  - `https://vr.proxyit.online/` in manifest.json update
- Remove tunnel URL regex replacements (use simple string set)
- Remove tunnel-related output at end ("Keep terminal open...")
- Remove `-Quick` skip-tunnel logic (simplify: `-SkipApk` just skips APK build)

**3. `quest-wrapper/app/build.gradle`**
- Replace `hostName: 'spider-webmasters-themselves-logs.trycloudflare.com'` → `hostName: 'vr.proxyit.online'`
- Replace `resValue` fullScopeUrl trycloudflare → `https://vr.proxyit.online/`

**4. `quest-wrapper/app/src/main/res/values/strings.xml`**
- Replace trycloudflare URL → `https://vr.proxyit.online`

**5. `client/src/manifest.json`**
- Replace `ovr_scope_url` trycloudflare → `https://vr.proxyit.online/`

**6. `update-twa.ps1`**
- Delete file (legacy, no longer needed with stable hostname)

**7. `specs/architecture.md`**
- ✅ Already updated (Tunnel → Nginx Proxy)

**8. `.gitignore`**
- Keep `tunnel-log.txt` and `tunnel*.log` entries (harmless)

#### Acceptance Criteria
- [ ] No cloudflared dependency or tunnel logic in codebase
- [ ] All URLs point to `vr.proxyit.online`
- [ ] `quest-deploy.ps1` simplified (no tunnel param/logic)
- [ ] `update-twa.ps1` deleted
- [ ] `package.json` has no tunnel script
- [ ] APK builds with correct hostname
- [ ] Server still runs on localhost:3001 (no changes to server/)

---

### TASK-125: VR Menu UI Upgrade — Visual Polish & Layout
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Redesign the VR main menu for better visuals and Quest UX. Current menu is flat text on a dark panel — lacks depth, hierarchy, and polish.

#### Current State
- Panel: `a-plane` at `(0, 1.4, -3.5)` size `4×3.6`, flat dark blue `#0a0a2a`
- Title: plain `a-text` "VR QUEST V2" in `#00d4ff`
- Buttons: flat `a-plane` with text, all at same z-depth `-3.4`
- Mode/weapon buttons: dynamically created via `createButton()` in `main.js`
- Decorative: 5 floating spheres + 1 rotating torus in background

#### Changes Required

**A. Panel Background — Add depth & glow**
File: `client/src/index.html` → `#menu-content`
1. Replace single flat panel with layered panels for depth:
   - Back panel: `position="0 1.4 -3.6"` width `4.2` height `3.8`, color `#050520`, opacity `0.95` (shadow layer)
   - Main panel: keep at `-3.5`, add `border` effect using a slightly larger wireframe plane behind it
   - Add a thin glowing border: `a-plane` width `4.05` height `3.65` at `z=-3.52`, color `#00d4ff`, opacity `0.08`
2. Add subtle animated accent line at top of panel:
   - `a-plane` at `(0, 3.15, -3.45)`, width `3`, height `0.005`, color `#00d4ff`
   - Animation: opacity oscillate `0.3` to `0.8` over `2s`

**B. Title — Add glow effect**
File: `client/src/index.html`
1. Keep "VR QUEST V2" but increase width to `7` for bigger text
2. Add a duplicate behind as glow: same text at `z=-3.42`, color `#00d4ff`, opacity `0.3`, scale `1.05`
3. Change subtitle "Target Shooter" to `#8888aa` for better contrast

**C. Player Info Bar — Visual upgrade**
File: `client/src/index.html`
1. Add a small background bar behind player info:
   - `a-plane` at `(0, 2.2, -3.45)`, width `2.5`, height `0.2`, color `#1a1a3a`, opacity `0.7`
2. Keep `#player-info` text at `z=-3.4` (in front of bar)

**D. Section Labels — Style upgrade**
File: `client/src/index.html`
1. Add small decorative lines beside "GAME MODE" and "WEAPON" labels:
   - Left line: `a-plane` width `0.4`, height `0.002`, color `#00d4ff`, opacity `0.3`
   - Right line: same, mirrored
   - Position: same Y as label, offset X ±1.0

**E. PLAY Button — Make it stand out**
File: `client/src/index.html`
1. Add a glow plane behind PLAY button:
   - `a-plane` at `(0, 0.35, -3.35)`, width `1.6`, height `0.55`, color `#00ff88`, opacity `0.06`
2. Add pulsing animation to PLAY button:
   - `animation="property: material.opacity; from: 0.85; to: 1.0; dur: 1200; loop: true; dir: alternate; easing: easeInOutSine"`

**F. Mode/Weapon Buttons — Visual upgrade**
File: `client/src/js/main.js` → `createButton()`
1. Selected button: add subtle glow — create a child `a-plane` behind (z=-0.01), same size +0.05, color `#00d4ff`, opacity `0.15`
2. Add hover animation: scale `1.05` on mouseenter, `1.0` on mouseleave (use `setAttribute('animation__hover', ...)`)
3. Locked buttons: add `🔒` icon prefix, color `#333355`

**G. Floor — Enhanced grid**
File: `client/src/index.html` → `#menu-content`
1. Add a radial gradient effect: second floor plane at `y=0.02`, circular (use `a-circle`), radius `8`, color `#0044aa`, opacity `0.05`
2. Keep wireframe grid but increase opacity to `0.3`

#### VR UX Rules (MUST follow)
- All clickable buttons: min `0.3` unit gap between edges (see ISSUE-008)
- All clickable: z-offset `≥ 0.05` in front of non-clickable panels
- Test: `createButton()` must call `refreshRaycasters()` after adding
- No overlapping hitboxes

#### Acceptance Criteria
- [ ] Panel has depth layers (shadow + glow border)
- [ ] Title has glow duplicate
- [ ] Player info has background bar
- [ ] Section labels have decorative lines
- [ ] PLAY button has glow + pulse animation
- [ ] Mode/weapon buttons have hover animation + selected glow
- [ ] Floor has enhanced grid/glow
- [ ] All changes work on Quest 2 (test after build)

---

### TASK-126: VR HUD Upgrade — In-Game Display
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Upgrade the in-game HUD for better readability and visual feedback on Quest. Current HUD is plain `a-text` elements attached to camera.

#### Current State (all in `src/index.html` inside `<a-camera>`)
- `#hud-score`: `position="-0.45 0.3 -1"`, scale `0.35`, color `#00ff88`
- `#hud-timer`: `position="0.45 0.3 -1"`, scale `0.35`, color `#ffaa00`
- `#hud-combo`: `position="0 0.2 -1"`, scale `0.3`, color `#ff44aa`
- `#hud-lives`: `position="-0.45 0.22 -1"`, scale `0.25`, color `#ff4444`
- `#hud-weapon`: `position="0.45 0.22 -1"`, scale `0.2`, color `#aaaaff`
- `#hud-level`: `position="-0.45 0.35 -1"`, scale `0.2`, color `#ffd700`
- `#crosshair`: `a-ring` at `0 0 -1`

#### Changes Required

**A. HUD Background Panels**
File: `client/src/index.html` → inside `<a-camera>`
1. Add semi-transparent background panels behind HUD groups for readability:
   - Top-left group (score + level + lives): `a-plane` at `(-0.45, 0.3, -1.01)`, width `0.35`, height `0.18`, color `#000000`, opacity `0.3`, `shader: flat`
   - Top-right group (timer + weapon): `a-plane` at `(0.45, 0.3, -1.01)`, width `0.3`, height `0.18`, color `#000000`, opacity `0.3`
2. These panels sit behind text (z=-1.01 vs text at z=-1)

**B. Crosshair Enhancement**
File: `client/src/index.html`
1. Add a dot center to crosshair: `a-circle` radius `0.003`, color `#00ff88`, position `0 0 -0.999`
2. Add outer ring: `a-ring` radius-inner `0.025` radius-outer `0.027`, color `#00ff88`, opacity `0.3`
3. Hit feedback: In `game-main.js`, on target hit, briefly flash crosshair to white then back

**C. Combo Display — More impact**
File: `client/src/index.html` + `src/js/game-main.js`
1. Increase combo text scale to `0.4` for bigger impact
2. In `game-main.js` `onComboChange`: add color escalation:
   - x2-x4: `#ff44aa` (current)
   - x5-x9: `#ff8800` (orange)
   - x10+: `#ffd700` (gold) + add shake animation

**D. Timer — Low time warning**
File: `client/src/js/game-main.js`
1. When `timeLeft <= 10`: add pulsing animation to timer text
   ```js
   _hudTimer.setAttribute('animation__pulse', {
     property: 'scale', from: '0.35 0.35 0.35', to: '0.42 0.42 0.42',
     dur: 500, loop: true, dir: 'alternate', easing: 'easeInOutSine'
   });
   ```
2. When `timeLeft <= 5`: change color to `#ff0000` (brighter red)
3. When timer ends or goes back to normal: remove animation

**E. Lives Display — Heart icons with animation**
File: `client/src/js/game-main.js` → `_updateLivesDisplay()`
1. On life lost: add brief shake animation to `_hudLives`:
   ```js
   _hudLives.setAttribute('animation__shake', {
     property: 'position', from: '-0.47 0.22 -1', to: '-0.43 0.22 -1',
     dur: 100, loop: 2, dir: 'alternate', easing: 'linear'
   });
   ```
2. Reset position after animation completes

**F. Score — Pop on change**
File: `client/src/js/game-main.js` → `scoreManager.onChange`
1. On score change, briefly scale up the score text:
   ```js
   _hudScore.setAttribute('animation__pop', {
     property: 'scale', from: '0.4 0.4 0.4', to: '0.35 0.35 0.35',
     dur: 150, easing: 'easeOutQuad'
   });
   ```

#### Acceptance Criteria
- [ ] HUD has background panels for readability
- [ ] Crosshair has center dot + outer ring
- [ ] Combo text color escalates with combo count
- [ ] Timer pulses when ≤10s, brighter red at ≤5s
- [ ] Lives shake on hit
- [ ] Score pops on change
- [ ] All animations work in VR on Quest 2

---

### TASK-127: Game Over Screen Upgrade
**Priority:** Medium
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Upgrade the Game Over overlay for better visual presentation. Currently uses HTML overlay with basic text.

#### Current State
File: `client/src/index.html` (HTML overlay, not VR)
- `#game-over-overlay`: hidden div, shows on game end
- Contains: h1 "Game Over", score, high score, XP, stats line, Retry/Menu buttons
- Score uses `countUp` animation already
File: `client/src/css/style.css` → `.game-over-menu`, `#final-score`, etc.
File: `client/src/js/game-main.js` → `endGame()` populates all fields

#### Changes Required

**A. Layout Restructure**
File: `client/src/index.html` → `#game-over-overlay`
1. Replace current flat layout with structured card:
```html
<div id="game-over-overlay" class="hidden">
  <div class="menu game-over-menu">
    <h1 class="game-over-title">Game Over</h1>
    <div id="new-high-badge" class="new-high-badge hidden">NEW HIGH SCORE!</div>
    <div class="score-section">
      <p id="final-score" class="final-score">0</p>
      <p id="final-high-score" class="final-high-score">High Score: 0</p>
    </div>
    <div class="stats-section">
      <div class="stat-box">
        <span id="stat-targets" class="stat-box-value">0</span>
        <span class="stat-box-label">Targets</span>
      </div>
      <div class="stat-box">
        <span id="stat-combo" class="stat-box-value">x0</span>
        <span class="stat-box-label">Best Combo</span>
      </div>
      <div class="stat-box">
        <span id="stat-accuracy" class="stat-box-value">0%</span>
        <span class="stat-box-label">Accuracy</span>
      </div>
    </div>
    <div class="xp-section">
      <p id="final-xp" class="xp-display">+0 XP</p>
      <div class="xp-bar-go"><div id="xp-fill-go" class="xp-fill"></div></div>
    </div>
    <div class="buttons">
      <button id="btn-retry" class="btn btn-primary">Retry</button>
      <button id="btn-share" class="btn btn-secondary">Share</button>
      <button id="btn-menu" class="btn btn-secondary">Main Menu</button>
    </div>
  </div>
</div>
```

**B. CSS Styles**
File: `client/src/css/style.css`
```css
.game-over-title {
  font-size: 1.8rem;
  background: linear-gradient(135deg, #ff4466, #ff8800);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 8px;
}
.new-high-badge {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #000;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 4px 16px;
  border-radius: 20px;
  letter-spacing: 2px;
  margin-bottom: 12px;
  animation: badge-glow 1.5s ease-in-out infinite alternate;
}
@keyframes badge-glow {
  from { box-shadow: 0 0 8px rgba(255, 215, 0, 0.3); }
  to { box-shadow: 0 0 20px rgba(255, 215, 0, 0.6); }
}
.final-score {
  font-size: 3rem;
  font-weight: 800;
  color: #00ff88;
  margin: 8px 0 4px;
}
.final-high-score {
  color: #888;
  font-size: 0.85rem;
  margin-bottom: 16px;
}
.stats-section {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}
.stat-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}
.stat-box-value {
  font-size: 1.3rem;
  font-weight: 700;
  color: #00d4ff;
}
.stat-box-label {
  font-size: 0.6rem;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-top: 4px;
}
.xp-section { margin-bottom: 16px; }
.xp-bar-go {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}
```

**C. JS Updates**
File: `client/src/js/game-main.js` → `endGame()`
1. Update to populate new stat boxes individually:
   ```js
   document.getElementById('stat-targets').textContent = targetSystem.targetsHit;
   document.getElementById('stat-combo').textContent = `x${targetSystem.bestCombo}`;
   document.getElementById('stat-accuracy').textContent = `${summary.accuracy}%`;
   ```
2. Show/hide `#new-high-badge` based on `isNewHigh`
3. Add XP bar fill animation:
   ```js
   const xpFill = document.getElementById('xp-fill-go');
   if (xpFill) {
     const pct = ((profile.xp % xpForNextLevel) / xpForNextLevel) * 100;
     xpFill.style.width = '0%';
     setTimeout(() => xpFill.style.width = pct + '%', 100);
   }
   ```
4. Remove old `#final-stats` single line, remove `btn-share` dynamic creation (now in HTML)
5. Move share button to static HTML (already in new layout)

#### Acceptance Criteria
- [ ] Game Over has structured card layout
- [ ] Stats shown in individual boxes (targets, combo, accuracy)
- [ ] "NEW HIGH SCORE!" badge with glow animation
- [ ] XP bar fills with animation
- [ ] Score count-up animation preserved
- [ ] Share button is static (not dynamically created)
- [ ] Retry/Menu buttons work as before

---

### TASK-128: VR Shop UI Upgrade
**Priority:** Medium
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** TASK-125

#### Description
Polish the VR Shop UI to match the upgraded menu style. Apply same visual language (glow borders, depth panels, hover effects).

#### Current State
File: `client/src/index.html` → `#shop-content`
- Background panel: flat `a-plane` at `-3.5`
- Title: "SHOP" text
- Product cards: dynamically built in `main.js` → `buildShopCards()`
- Back button: flat `a-plane`

#### Changes Required

**A. Shop Panel — Match menu style**
File: `client/src/index.html` → `#shop-content`
1. Add same layered panel as menu (shadow + glow border):
   - Shadow: `a-plane` at `z=-3.6`, slightly larger, dark
   - Glow border: `a-plane` at `z=-3.52`, `#ffd700`, opacity `0.08` (gold accent for shop)
2. Add accent line at top: `a-plane` gold colored, animated opacity

**B. Product Cards — Better design**
File: `client/src/js/main.js` → `buildShopCards()`
1. Add card border glow on hover:
   ```js
   btn.addEventListener('mouseenter', () => {
     card.setAttribute('material', 'opacity', 1.0);
     card.setAttribute('color', owned ? '#1a3a1a' : '#1a1a4e'); // lighter on hover
   });
   ```
2. Increase card size to `1.0 × 1.3` for better readability
3. Add separator line between product info and price
4. "OWNED" button: add checkmark `✓` prefix

**C. Balance Display — Prominent**
File: `client/src/js/main.js` → `buildShopCards()`
1. Add background bar behind balance text (same as player info in menu)
2. Add coin icon prefix: "🪙 500 Coins"

**D. Back Button — Match style**
File: `client/src/index.html`
1. Add hover glow effect (same as PLAY button treatment)
2. Add arrow prefix: "← BACK"

#### Acceptance Criteria
- [ ] Shop panel has depth layers matching menu
- [ ] Product cards have hover effects
- [ ] Balance display has background bar
- [ ] Back button has arrow + hover glow
- [ ] All clicks work on Quest 2

---

### TASK-129: Game Arena Visual Upgrade
**Priority:** Medium
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Upgrade the in-game arena environment for a more immersive feel. Current arena is a basic flat floor with faint walls and grid.

#### Current State
File: `client/src/index.html` → `#game-content`
- Floor: plain `a-plane` 100×100, color `#111133`
- Grid: wireframe `a-plane` 30×30, opacity `0.3`
- Walls: 4 `a-box` transparent blue
- Pillars: 4 `a-cylinder` at corners
- Lights: 4 point lights (blue, red, green, pink)
- Ambient particles: 25 tiny white spheres (spawned in JS)

#### Changes Required

**A. Floor — Add glow ring**
File: `client/src/index.html` → `#game-content`
1. Add a glowing ring on the floor at arena center:
   - `a-torus` position `0 0.02 0` rotation `-90 0 0`, radius `8`, radius-tubular `0.02`, color `#00d4ff`, opacity `0.15`
   - Animation: slow rotation `0 0 360` over 20s, loop
2. Add a second inner ring: radius `4`, color `#ff44aa`, opacity `0.1`

**B. Walls — Add edge glow lines**
File: `client/src/index.html`
1. Add thin glowing lines at the base of each wall:
   - Front wall base: `a-plane` at `(0, 0.05, -15)`, width `30`, height `0.03`, color `#0088ff`, opacity `0.4`
   - Same for other 3 walls
2. Add vertical glow lines at wall corners (where walls meet):
   - `a-cylinder` radius `0.02`, height `5`, color `#0088ff`, opacity `0.3` at `(±15, 2.5, ±15)`

**C. Pillars — Enhanced**
File: `client/src/index.html`
1. Add glowing ring around each pillar base:
   - `a-torus` at pillar position (y=0.1), rotation `-90 0 0`, radius `0.5`, radius-tubular `0.01`, color `#00d4ff`, opacity `0.2`
2. Add light orb on top of each pillar:
   - `a-sphere` at pillar position (y=4.2), radius `0.15`, color matching nearby light, shader flat

**D. Sky — Dynamic**
File: `client/src/index.html`
1. Add very faint star field: 15 tiny `a-sphere` at random positions (y=8-15, spread x/z ±20), radius `0.03`, white, opacity `0.2-0.4`
   - Animation: twinkle (opacity oscillate) at random durations

#### Acceptance Criteria
- [ ] Floor has 2 glowing rings (rotating)
- [ ] Walls have base glow lines
- [ ] Wall corners have vertical glow lines
- [ ] Pillars have base ring + top light orb
- [ ] Faint star field in sky
- [ ] Performance: < 50 new entities total (Quest 2 limit)
- [ ] All decorative elements use `shader: flat` (no lighting calculation)

---

### TASK-124: In-Game VR Shop UI
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Add a Shop panel to the VR menu so players can browse and purchase IAP products (coin packs, premium unlock) without leaving the game. The shop is a VR panel within the SPA — toggling between menu-content and shop-content (same pattern as menu→game).

#### Design

**Shop Access:**
- Add a "SHOP" button on the main menu (below PLAY button, at position `0 0.0 -3.4`)
- Clicking SHOP hides `menu-content`, shows `shop-content`

**Shop Layout (VR panels at z=-3.4):**
```
┌─────────────────────────────┐
│         🛒 SHOP             │  ← Title
│                             │
│  ┌───────┐ ┌───────┐ ┌───────┐
│  │ 100   │ │ 500   │ │Premium│  ← Product cards
│  │ Coins │ │ Coins │ │Unlock │
│  │ $0.99 │ │ $3.99 │ │ $4.99 │
│  │ [BUY] │ │ [BUY] │ │ [BUY] │
│  └───────┘ └───────┘ └───────┘
│                             │
│      [ ← BACK TO MENU ]    │  ← Back button
│                             │
│     Coins: 250  ⭐ Premium  │  ← Current balance
└─────────────────────────────┘
```

**Each product card:** `a-plane` (0.9w × 1.0h) containing:
- Product icon/emoji (`a-text`)
- Product name (`a-text`)
- Price (`a-text`) — use `iapManager.getDisplayPrice()`
- BUY button (`a-plane.clickable`, green) — or "OWNED" (gray) for non_consumable already purchased

**Purchase Flow:**
1. Player clicks BUY → `iapManager.purchase(productId)`
2. On Quest: opens Meta payment dialog
3. On dev: instant grant
4. On success: show toast "Purchased! +100 Coins" and update balance display
5. On error: show toast "Purchase failed" (red)

#### Implementation

**Files to modify:**
- `src/index.html` — Add `<a-entity id="shop-content" visible="false">` with shop panels
- `src/js/main.js` — Add `switchToShop()`, `switchFromShop()`, build product cards, wire buy buttons
- `src/js/iap/iap-manager.js` — No changes needed (already has `purchase()`, `getDisplayPrice()`, `isOwned()`)

**In `src/index.html`:**
- Add `shop-content` entity after `menu-content`, before `game-content`
- Contains: back panel background, title text, product card containers, back button, balance text

**In `src/js/main.js`:**
- Import `iapManager` and `showToast`
- `initShop()` — call `iapManager.init()`, build product cards dynamically
- `buildShopCards()` — for each product in `iapManager.products`, create a card with name, price, buy/owned button
- `switchToShop()` — hide menu-content, show shop-content, refresh cards (balance, owned state)
- `switchFromShop()` — hide shop-content, show menu-content, update player-info coins
- Wire SHOP button click → `switchToShop()`
- Wire BACK button click → `switchFromShop()`
- Wire BUY button click → `async purchase(productId)` with try/catch, toast feedback

#### Acceptance Criteria
- [ ] SHOP button visible on main menu
- [ ] Shop shows 3 product cards with correct names and prices
- [ ] BUY button triggers iapManager.purchase()
- [ ] On Quest: Meta payment dialog opens
- [ ] On dev: instant purchase with coin grant
- [ ] Toast shows success/failure feedback
- [ ] Premium shows "OWNED" if already purchased
- [ ] Coins balance updates after purchase
- [ ] BACK button returns to menu
- [ ] VR controller click works on shop buttons (raycaster refresh)

---

### TASK-116: Tutorial & Onboarding
**Priority:** High
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
New players currently land on the menu with no guidance. Add an interactive tutorial that teaches controls, target types, and game modes. First-time players see the tutorial automatically; returning players can replay it from Settings.

#### Implementation
- Create `src/tutorial.html` + `src/js/tutorial-main.js`
  - Add to Vite multi-page build in `vite.config.js`
- Tutorial is a simplified game scene with guided steps (not a video — interactive):
  1. **Step 1 — Look Around**: "Look around by moving your head (VR) or mouse (flat)" — wait for camera rotation > 90°
  2. **Step 2 — Shoot**: Spawn 1 static standard target at close range — "Aim at the target and click/trigger to shoot" — wait for hit
  3. **Step 3 — Target Types**: Spawn 3 targets (standard, bonus, decoy) one-by-one with labels — "Green = hit it! Gold = bonus points! Red = avoid!"
  4. **Step 4 — Combo**: Spawn 3 standard targets in a row — "Hit multiple targets quickly for combo multiplier!"
  5. **Step 5 — Complete**: "You're ready! Choose a game mode and start playing" — button to go to menu
- Each step shows instruction text as `a-text` entity positioned in front of camera (billboard)
- Progress indicator (Step 1/5) in HUD
- Add `tutorialCompleted: false` to `DEFAULT_PROFILE`
- In `main.js init()` — if `!profile.tutorialCompleted`, redirect to `tutorial.html`
- On tutorial completion, save `tutorialCompleted: true` to profile
- Add "Replay Tutorial" button to `settings.html`

#### Acceptance Criteria
- [ ] 5-step interactive tutorial with guided instructions
- [ ] First-time players auto-redirected to tutorial
- [ ] Tutorial works in VR and flat-screen mode
- [ ] Progress saved — tutorial not shown again
- [ ] "Replay Tutorial" in Settings
- [ ] Tutorial page in Vite build

---

### TASK-117: Background Music & Sound Polish
**Priority:** High
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
Add procedural background music and polish existing SFX. Currently the game has basic procedural shoot/hit sounds but no ambient audio. Add looping ambient music per theme and enhance sound variety.

#### Implementation
- Create `src/js/core/music-manager.js`
  - Procedural ambient music using Web Audio API (oscillators + filters, no audio files)
  - Define 4 music profiles matching themes:
    - **Cyber**: Slow pulse bass (40Hz sine, rhythmic gain envelope), filtered noise pad, subtle arpeggiated high tones
    - **Sunset**: Warm drone (low-pass filtered saw, 60Hz), gentle reverb pad
    - **Space**: Deep sub bass (30Hz), sparse high pings with long delay, cold reverb
    - **Neon**: Punchy kick pulse (80Hz), fast hi-hat noise bursts, synth stab accents
  - Each profile: `{ bassFreq, bassType, padFreq, padFilter, tempo, layers[] }`
  - `startMusic(themeId)` — creates oscillator nodes, connects to audioManager.destination
  - `stopMusic()` — fade out over 500ms, disconnect nodes
  - Volume controlled by audioManager master gain (already implemented)
- Add music toggle to settings (already has `music: true` placeholder in settings UI)
- In `game-main.js` — call `startMusic(themeId)` when game starts, `stopMusic()` on game over
- Polish existing SFX in `audio-manager.js`:
  - Add sound variation: randomize pitch ±10% on each shot/hit
  - Add `playComboSound(comboCount)` — ascending pitch with combo level
  - Add `playLevelUpSound()` — ascending arpeggio
  - Add `playCountdownBeep()` — short beep for 3-2-1 countdown

#### Acceptance Criteria
- [ ] Procedural ambient music plays during gameplay
- [ ] Music matches selected theme
- [ ] Music toggle in settings works
- [ ] SFX pitch variation on shots/hits
- [ ] Combo sound with ascending pitch
- [ ] Countdown beeps during 3-2-1
- [ ] No audio files needed (all procedural)
- [ ] Music respects master volume

---

### TASK-118: Friend System & Social
**Priority:** Medium
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
Add a basic friend system allowing players to share friend codes, view each other's stats, and compare leaderboard positions. Uses Firestore for friend data. Falls back gracefully when Firebase is not configured.

#### Implementation
- Create `src/js/core/friend-manager.js`
  - Generate a unique 6-character friend code per player (stored in profile)
  - `generateFriendCode()` — random alphanumeric, stored in Firestore `players/{uid}.friendCode`
  - `addFriend(friendCode)` — look up code in Firestore, add to `profile.friends[]` array
  - `removeFriend(uid)` — remove from friends array
  - `getFriendProfiles()` — batch fetch friend profiles (displayName, level, highScores)
  - Max 20 friends
- Add `friends.html` + `src/js/friends-main.js`
  - Add to Vite multi-page build
  - Show "Your Code: XXXX" with copy button
  - Input field to add friend by code
  - Friends list showing: name, level, top score, online indicator (lastSeen < 5min)
  - Remove friend button per entry
- Add `friendCode: null, friends: []` to `DEFAULT_PROFILE`
- Add "Friends" button to main menu (next to Stats/Settings)
- Friends leaderboard tab in existing leaderboard (filter to friends only)
  - In `leaderboard-manager.js` add `getFriendsLeaderboard(friendUids, mode)` query
- Offline fallback: show "Friends require online mode" message when Firebase not configured

#### Acceptance Criteria
- [ ] Unique friend code generated per player
- [ ] Add/remove friends by code
- [ ] Friends list with stats display
- [ ] Friends-only leaderboard filter
- [ ] Max 20 friends limit
- [ ] Graceful offline fallback
- [ ] Friends page in Vite build

---

### TASK-119: Game Replay Summary & Share
**Priority:** Medium
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
Enhance the game-over screen with a detailed replay summary and shareable results. Players can see a breakdown of their performance and share results as text to clipboard.

#### Implementation
- Update game-over overlay in `game.html` with expanded stats section:
  - Score breakdown: base points, combo bonus, accuracy bonus
  - Performance stats: accuracy %, targets hit/missed, best combo, time played
  - Comparison: "New High Score!" badge or "+X vs your best"
  - XP earned breakdown: base XP + mode bonus + combo bonus
- Create `src/js/game/game-summary.js`
  - `buildSummary(gameResult, profile)` — compute all derived stats
  - `formatShareText(summary)` — generate shareable text block:
    ```
    VR Quest | Time Attack
    Score: 1,250 | Combo: x12
    Accuracy: 87% | Level 8
    🎯 Can you beat my score?
    ```
  - `copyToClipboard(text)` — uses `navigator.clipboard.writeText()`
- Add "Share" button to game-over overlay
  - On click: copy formatted text to clipboard, show "Copied!" toast
- Track accuracy in `target-system.js`:
  - Count total shots fired (from shoot-controls events)
  - Count hits vs misses
  - Pass `accuracy` in game result to `game-main.js`
- Update `game-main.js endGame()`:
  - Build summary, render expanded stats in overlay
  - Wire share button

#### Acceptance Criteria
- [ ] Detailed score breakdown on game-over screen
- [ ] Accuracy tracking (shots fired vs hits)
- [ ] "New High Score!" badge when applicable
- [ ] Share button copies formatted results to clipboard
- [ ] "Copied!" confirmation toast
- [ ] Comparison with previous best score
- [ ] Clean, readable share text format

---

### TASK-120: UI Polish & Animations
**Priority:** Low
**Status:** Completed
**Assigned:** /dev
**Dependencies:** None

#### Description
Polish the overall UI with smooth transitions, micro-animations, and visual consistency. The menu currently works but feels static. Add entrance animations, hover effects, and loading states.

#### Implementation
- Update `src/css/style.css` with animations:
  - **Menu entrance**: Cards slide up with stagger (each card delayed 50ms), fade in
  - **Button hover**: Scale 1.05 + glow shadow on hover, scale 0.97 on active
  - **Page transitions**: Current fade works; add slide direction (left for forward, right for back)
  - **Loading state**: Pulsing dot animation for async operations (leaderboard fetch, profile load)
  - **Toast notifications**: Slide in from top, auto-dismiss after 3s, for achievements/level-ups/copy
- Create `src/js/ui/toast.js`
  - `showToast(message, type)` — type: 'success' (green), 'info' (blue), 'warning' (yellow), 'achievement' (gold)
  - Toast container fixed at top center, stacks multiple toasts
  - Auto-dismiss with progress bar, click to dismiss early
- Create `src/js/ui/animations.js`
  - `staggerIn(selector, delay)` — animate child elements with stagger
  - `pulseElement(el)` — attention pulse for important elements
  - `countUp(el, from, to, duration)` — animated number counter for scores
- Update `game-main.js` game-over screen:
  - Score counts up from 0 to final value (countUp animation)
  - XP bar fills with animation
  - Achievement toasts slide in sequentially
- Update `main.js`:
  - Use `staggerIn` for mode grid, weapon grid, theme grid on page load
  - Toast for daily challenge completion
- Add achievement unlock toast in `game-main.js` (replace console.log with visual toast)

#### Acceptance Criteria
- [ ] Menu cards animate in with stagger effect
- [ ] Buttons have hover/active micro-animations
- [ ] Toast notification system for achievements, level-ups, copy
- [ ] Score count-up animation on game-over
- [ ] Loading state indicator for async operations
- [ ] Smooth page transitions
- [ ] No animation when `reducedMotion` setting is true

---

### TASK-121: Fix VR Menu Buttons Not Clickable on Quest TWA
**Priority:** High
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None
**Related:** ISSUE-007

#### Description
Menu buttons (Play, mode, weapon selection) are not clickable when running on Quest 2 via TWA app. Works fine on desktop browser. Root cause: raycaster doesn't detect dynamically created buttons + race condition with autoEnterVR.

#### Implementation
Fix 3 issues in `src/js/main.js`:

1. **Force raycaster refresh after dynamic button creation:**
   - After `buildModeButtons()` and `buildWeaponButtons()`, call `refreshRaycasters()` to force A-Frame raycaster to re-query `.clickable` elements
   - Add helper: `function refreshRaycasters() { ['left-hand', 'right-hand'].forEach(id => { const el = document.getElementById(id); if (el?.components?.raycaster) el.components.raycaster.refreshObjects(); }); }`

2. **Move `autoEnterVR()` after menu init:**
   - Move `autoEnterVR()` call inside `authManager.waitReady().then()`, AFTER `initMenu()` and `setupControllerClick()` complete
   - This ensures buttons exist before VR session starts

3. **Use event delegation for hover effects:**
   - Replace static `querySelectorAll('.clickable')` with scene-level event delegation
   - Listen for `mouseenter`/`mouseleave` on the scene and check if target has `.clickable` class
   - OR: attach hover listeners inside `createButton()` so every dynamic button gets them

#### Acceptance Criteria
- [ ] Play button clickable on Quest 2 TWA
- [ ] Mode/weapon buttons clickable on Quest 2 TWA
- [ ] Hover effects work on dynamically created buttons
- [ ] Desktop mouse click still works
- [ ] No race condition between VR entry and menu creation

---

### TASK-122: Clean debug/temp and redundant files
**Priority:** Medium
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Remove debug artifacts, tunnel logs, one-off test scripts, and duplicate component so the repo is clean and build is unambiguous.

#### Implementation
- Delete from repo root: `iap-test.mjs`, `iap-test2.mjs`, `tunnel.log`, `tunnel2.log`, `quest-screenshot-debug.png`, `quest-screenshot-debug2.png`, `QUEST_TEST_CHECKLIST.md`
- Delete duplicate: `public/js/components/menu-button.js` (HTML loads from `src/`; Vite root is src, so only `src/js/components/menu-button.js` is used)
- Add to `.gitignore`: `tunnel*.log`, `*-debug.png`, `iap-test*.mjs` so future debug artifacts stay local

#### Acceptance Criteria
- [ ] No iap-test*.mjs, tunnel*.log, *-debug.png, QUEST_TEST_CHECKLIST.md in repo
- [ ] Only one menu-button.js (under src)
- [ ] .gitignore updated for above patterns

---

### TASK-123: Production logging cleanup
**Priority:** Low
**Status:** Completed ✅ (2026-01-30)
**Assigned:** /dev
**Dependencies:** None

#### Description
Reduce console noise in production. Keep only actionable warnings; remove verbose info logs from IAP and auth.

#### Implementation
- In `src/js/iap/iap-manager.js`: remove `console.log` for "Digital Goods API connected", "Prices fetched from Meta", "Restored entitlement", "Dev purchase". Keep `console.warn` for fallbacks and failures.
- In `src/js/core/auth-manager.js`: keep `console.warn` for Firebase timeout/error fallback (useful for support). No change if no other logs.

#### Acceptance Criteria
- [ ] No console.log in iap-manager.js for normal flow
- [ ] console.warn retained for errors/fallbacks in iap-manager and auth-manager

---

## Recently Completed

| Task | Title | Completed |
|------|-------|-----------|
| TASK-010 | Project Setup (WebXR + A-Frame) | 2026-01-29 |
| TASK-011 | VR Game Scene + Player Controls | 2026-01-29 |
| TASK-012 | Target Shooting Game Logic | 2026-01-29 |
| TASK-013 | IAP Backend + Stripe Integration | 2026-01-29 |
| TASK-014 | Main Menu + Polish | 2026-01-29 |
| TASK-015 | Meta Digital Goods API Integration | 2026-01-29 |
| TASK-016 | TWA APK Build + Meta Store Upload | 2026-01-29 |
| TASK-019 | App Icon & Splash Screen | 2026-01-29 |
| TASK-020 | Release Signing Key | 2026-01-29 |
| TASK-018 | Meta Quest Store Submission | 2026-01-29 |
| TASK-101 | Firebase/Supabase Integration | 2026-01-29 |
| TASK-102 | User Account System | 2026-01-29 |
| TASK-103 | Multiple Game Modes | 2026-01-29 |
| TASK-104 | Weapon System | 2026-01-29 |
| TASK-105 | XP/Level Progression | 2026-01-29 |
| TASK-106 | Global Leaderboard | 2026-01-29 |
| TASK-107 | Daily Challenges | 2026-01-29 |
| TASK-108 | Achievement System | 2026-01-29 |
| TASK-109 | Enhanced Target Types | 2026-01-29 |
| TASK-110 | Stats Dashboard & Game History | 2026-01-29 |
| TASK-111 | Particle Effects System | 2026-01-29 |
| TASK-112 | Themed Environments | 2026-01-29 |
| TASK-113 | Weapon Skins | 2026-01-29 |
| TASK-114 | Settings & Accessibility | 2026-01-29 |
| TASK-115 | Hit Feedback & Damage Numbers | 2026-01-29 |
| TASK-116 | Tutorial & Onboarding | 2026-01-29 |
| TASK-117 | Background Music & Sound Polish | 2026-01-29 |
| TASK-118 | Friend System & Social | 2026-01-29 |
| TASK-119 | Game Replay Summary & Share | 2026-01-29 |
| TASK-120 | UI Polish & Animations | 2026-01-29 |
| TASK-130 | Quest build + deploy script | 2026-01-30 |
| TASK-132 | Quest 2 build & run — portable deploy script | 2026-01-30 |
| TASK-122 | Clean debug/temp and redundant files | 2026-01-30 |
| TASK-123 | Production logging cleanup | 2026-01-30 |
| TASK-124 | In-Game VR Shop UI | 2026-01-30 |
| TASK-125 | VR Menu UI Upgrade | 2026-01-30 |
| TASK-126 | VR HUD Upgrade | 2026-01-30 |
| TASK-127 | Game Over Screen Upgrade | 2026-01-30 |
| TASK-128 | VR Shop UI Upgrade | 2026-01-30 |
| TASK-129 | Game Arena Visual Upgrade | 2026-01-30 |

[View all completed tasks ->](./tasks-archive.md)
