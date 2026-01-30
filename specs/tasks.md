# Task Management

> Last Updated: 2026-01-30
> Purpose: Active work queue. Keep this file short.
> [View Completed Tasks Archive](./tasks-archive.md)

---

## Overview

| Status | Count |
|--------|-------|
| In Progress | 0 |
| Pending | 2 |
| Completed | 28 |

> Note: V1 tasks (TASK-010~020) completed. V2 Phase 1 (TASK-101~105) completed + all 6 issues resolved.
> V2 Phase 2 (TASK-106~110) completed.
> V2 Phase 3 (TASK-111~115) completed.
> V2 Phase 4 (TASK-116~120) completed.

---

## In Progress

_None_

---

## Pending

### TASK-124: In-Game VR Shop UI
**Priority:** High
**Status:** Pending
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
**Status:** Pending
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
**Status:** Pending
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

[View all completed tasks ->](./tasks-archive.md)
