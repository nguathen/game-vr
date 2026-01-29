# Browser Behavior Reference (Anti-Detection)

> Reference file for detailed human-like behavior patterns.
> **Parent:** `CLAUDE.md` → TIMING section links here for advanced details.
> **Used by:** Skill agents (/fb, /eb, /wm, /az)

---

## Timing Patterns (Gaussian Distribution)

**Base delays (use random within range, prefer middle values):**
```
Action Type           | Min    | Typical | Max    | Distribution
---------------------|--------|---------|--------|-------------
Between keystrokes   | 50ms   | 120ms   | 300ms  | Gaussian
Between words        | 200ms  | 400ms   | 800ms  | Gaussian
Before first click   | 1.5s   | 2.5s    | 4s     | Gaussian
Between form fields  | 0.8s   | 1.5s    | 3s     | Gaussian
After page load      | 2s     | 3.5s    | 6s     | Gaussian
Before submit        | 1s     | 2s      | 4s     | Gaussian
After popup close    | 0.5s   | 1s      | 2s     | Gaussian
Reading pause        | 2s     | 5s      | 10s    | Exponential
Thinking pause       | 1s     | 3s      | 8s     | Exponential
```

**Micro-pauses (inject randomly):**
- 5% chance: pause 100-300ms mid-typing (hesitation)
- 10% chance: pause 500-1500ms between actions (distraction)
- 3% chance: pause 2-5s (reading something)

**Rhythm patterns:**
- Burst typing: 3-5 chars fast, then micro-pause
- Slow start: first 2-3 chars slower, then speed up
- End slowdown: last 2 chars of word slightly slower

---

## Mouse Movement Patterns

**Bezier curve movement (NOT straight lines):**
```
Start point -> Control point 1 -> Control point 2 -> End point
- Control points offset 20-40% from straight line
- Random curve direction (left or right of straight path)
- Movement time: 200-600ms depending on distance
```

**Overshoot and correct:**
- 30% of clicks: overshoot target by 5-15px
- Pause 100-200ms
- Correct to actual target
- Then click

**Natural tremor:**
- Add 1-3px random offset to final position
- Slight wobble during movement (1-2px variance)

**Speed curve:**
- Start slow (acceleration)
- Fast in middle
- Slow down near target (deceleration)
- Follow ease-in-out curve

**Hover patterns:**
- Hover 300-800ms before clicking
- Occasionally hover wrong element first (10% chance)
- Move away, then back to correct element

---

## Scroll Behavior

**Reading scroll pattern:**
```
1. Scroll down 300-500px
2. Pause 1-3s (reading)
3. Sometimes scroll up 50-100px (re-reading)
4. Continue down
5. Occasionally scroll to random section
```

**Finding element scroll:**
- Don't jump directly to element
- Scroll in 200-400px increments
- Pause briefly between scrolls
- Overshoot by 100-200px, scroll back

**Scroll speed variation:**
- Fast scroll: when clearly looking for something
- Slow scroll: when reading content
- Variable: mix of both

**Natural scroll quirks:**
- 15% chance: scroll past target, then back up
- 10% chance: small scroll up before continuing down
- 5% chance: scroll to wrong section, pause, scroll to correct

---

## Keyboard Input Patterns

**Typing simulation:**
```
Character type     | Delay multiplier
-------------------|------------------
Same hand twice    | 0.8x (faster)
Hand alternation   | 1.0x (normal)
Same finger twice  | 1.3x (slower)
Shift + key        | 1.2x (slower)
Special chars      | 1.4x (slower)
Numbers            | 1.1x (slightly slower)
```

**Typo simulation (inject naturally):**
- 3-5% typo rate for long text
- Common typos: adjacent keys, double letters, missed letters
- Fix pattern: backspace 1-3 chars, pause 200-500ms, retype correctly
- Sometimes fix immediately, sometimes after 2-3 more chars

**Example typo fixes:**
```
"hello" -> "helo" -> backspace -> "hello"
"world" -> "wolrd" -> backspace x2 -> "orld" -> "world"
"email" -> "emial" -> continue typing -> backspace x3 -> "ail"
```

**Paste behavior (for long text):**
- Don't paste instantly
- Pause 500-1000ms after paste
- Sometimes review (scroll/look at pasted content)
- Occasionally paste in chunks

**Field navigation:**
- 60% Tab key to next field
- 30% Click next field
- 10% Tab then click (changed mind)

---

## Click Patterns

**Pre-click behavior:**
- Move mouse to element area (not exact center)
- Hover 300-800ms
- Click offset from center (-10 to +10 px both axes)

**Click types:**
```
Action          | Mouse behavior
----------------|----------------------------------
Button click    | Hover, click near center
Link click      | Hover on text part, not edge
Checkbox        | Click on box OR label (vary)
Dropdown        | Click, wait, then select
Text input      | Click slightly left of center
Submit          | Longer hover (reviewing), then click
```

**Double-click timing:**
- Interval: 80-150ms between clicks
- Small position variance between clicks (1-3px)

---

## Form Interaction Advanced

**Field focus pattern:**
```
1. Move mouse to field (Bezier curve)
2. Hover 200-500ms
3. Click (offset from center)
4. Pause 100-300ms (cursor blinking)
5. Start typing
```

**Multi-field forms:**
- Don't fill in strict order always
- Sometimes skip optional field, fill later
- Occasionally scroll to see whole form
- Pause longer before submit (2-4s review)

**Dropdown/Select:**
```
1. Click dropdown
2. Wait 300-600ms (menu opens)
3. Scroll through options if many (don't jump to target)
4. Hover target option 200-400ms
5. Click option
```

**Checkbox/Radio:**
- Click on label 60% of time (more human)
- Click on box 40% of time
- Pause briefly after selection (100-300ms)

**Date picker:**
- Use picker if available (not direct typing)
- Navigate months naturally (not jump to target)
- Pause on calendar as if finding date

**Auto-fill detection avoidance:**
- Small pause between fields (not instant Tab-Tab-Tab)
- Occasionally clear field and retype
- Mix Tab and Click for navigation

---

## Page Interaction Patterns

**New page loaded:**
```
1. Wait 2-4s (page rendering)
2. Scroll down slightly (100-200px)
3. Pause 1-2s (orienting)
4. Scroll back up if needed
5. Start interaction
```

**Reading content:**
- Scroll at reading speed (~100px per second)
- Pause at headings/important content
- Occasional scroll back (re-reading)
- Move mouse occasionally while reading

**Finding element:**
- Don't go directly to element
- Scan page visually (scroll around)
- Pause at wrong sections briefly
- Then navigate to correct element

**Tab/Window behavior:**
- 5% chance: Check other tab briefly
- If multiple tabs needed, switch with realistic timing
- Don't instant-switch, pause 500-1000ms before switch

---

## Session Behavior

**Session start:**
```
1. Page loads
2. Wait 3-5s
3. Scroll down to view page (100-300px)
4. Scroll back up
5. Begin task
```

**Session patterns:**
- Occasional idle periods (5-15s)
- Random mouse movements during "thinking"
- Sometimes move mouse off content area
- Periodic small scrolls (checking something)

**Long session:**
- Speed naturally varies (faster when confident, slower when confused)
- Occasional longer pauses (1-2min simulation if needed)
- Error rate might increase slightly over time (fatigue simulation)

---

## Anti-Detection Signals

### Avoid These Patterns (Bot Indicators)
- Instant field filling (< 50ms between fields)
- Perfectly straight mouse movements
- Exact same timing patterns repeated
- Clicking exact center of elements every time
- Inhuman typing speed (< 30ms per char)
- No mouse movement between actions
- Perfect form filling (no corrections)
- Completing complex forms in < 10 seconds
- No scroll before interacting with below-fold content
- Immediate action after page load (< 1s)

### Simulate These Patterns (Human Indicators)
- Variable timing (never exact same delay twice)
- Mouse movement even when not clicking
- Occasional hesitation
- Natural reading time before actions
- Scroll to see content before interacting
- Hover before click
- Occasional typos that get fixed
- Review behavior before submit
- Idle moments (human distraction)
- Slight position variance in clicks

### Fingerprint Awareness
- Don't change viewport unnaturally
- Maintain consistent timezone behavior
- Don't expose automation signals
- Act within normal browser capabilities
- If detected, don't retry immediately (wait 30-60s)

---

## Platform Speed Adjustment

| Platform | Speed multiplier | Notes |
|----------|-----------------|-------|
| Facebook | 1.5x slower | Very aggressive detection |
| Google | 1.5x slower | ML-based detection |
| eBay | 1.3x slower | Fraud prevention |
| Azure | 1.2x slower | Enterprise security |
| Walmart | 1.3x slower | PerimeterX |
| YouTube | 1.0x normal | Standard Google |
