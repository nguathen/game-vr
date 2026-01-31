import scoreManager from './score-manager.js';
import audioManager from '../core/audio-manager.js';
import authManager from '../core/auth-manager.js';
import powerUpManager from './power-up-manager.js';
import { getSettings } from './settings-util.js';

const BASE_POINTS = 10;
// 360-degree spawn: distance bands (close/mid/far), full height range, hemisphere bias
const SPAWN = {
  distMin: 4, distMax: 14,   // distance from player
  yMin: 0.5, yMax: 6,        // floor to overhead
  frontBias: 0.60,            // 60% front hemisphere
  sideBias: 0.25,             // 25% sides
  // remaining 15% behind
};
const COLORS = ['#e94560', '#ff6b6b', '#ffa502', '#2ed573', '#1e90ff', '#a855f7', '#ff69b4'];

const TARGET_MATERIALS = {
  standard: { metalness: 0.6, roughness: 0.3, emissive: '#222222', emissiveIntensity: 0.4 },
  speed:    { metalness: 0.8, roughness: 0.2, emissive: '#ffdd00', emissiveIntensity: 0.6 },
  heavy:    { metalness: 0.9, roughness: 0.1, emissive: '#ff1111', emissiveIntensity: 0.5 },
  bonus:    { metalness: 0.7, roughness: 0.2, emissive: '#ffd700', emissiveIntensity: 0.8 },
  decoy:    { metalness: 0.5, roughness: 0.5, emissive: '#440000', emissiveIntensity: 0.3 },
  powerup:  { metalness: 0.9, roughness: 0.1, emissive: '#00ffaa', emissiveIntensity: 1.0 },
};

const TARGET_TYPES = {
  standard:  { weight: 50, points: 10, radius: 0.3,  geometry: 'a-icosahedron', color: null, hp: 1, speed: 0, lifetime: null, coins: 0 },
  speed:     { weight: 20, points: 25, radius: 0.22, geometry: 'a-octahedron', color: '#ffdd00', hp: 1, speed: 2.5, lifetime: null, coins: 0 },
  heavy:     { weight: 15, points: 30, radius: 0.4,  geometry: 'a-dodecahedron', color: '#ff3333', hp: 2, speed: 0, lifetime: null, coins: 0 },
  bonus:     { weight: 8,  points: 50, radius: 0.25, geometry: 'a-torus', color: '#ffd700', hp: 1, speed: 0, lifetime: 2000, coins: 5 },
  decoy:     { weight: 7,  points: -10, radius: 0.3, geometry: 'a-sphere', color: '#882222', hp: 1, speed: 0, lifetime: null, coins: 0 },
  powerup:   { weight: 5,  points: 10,  radius: 0.35, geometry: 'a-torus-knot', color: '#00ffaa', hp: 1, speed: 1.5, lifetime: 3000, coins: 0 },
};

class TargetSystem {
  constructor(containerEl, config = {}) {
    this._container = containerEl;
    this._targets = new Set();
    this._spawnTimer = null;
    this._running = false;
    this._combo = 0;
    this._comboTimer = null;
    this._onComboChange = null;
    this._onMiss = null;
    this._targetsHit = 0;
    this._bestCombo = 0;

    // Configurable per game mode
    this._spawnInterval = config.spawnInterval || 1500;
    this._maxTargets = config.maxTargets || 8;
    this._targetLifetime = config.targetLifetime || 5000;
    this._bossMode = config.bossMode || false;
    this._wave = 0;
    this._coinsEarned = 0;
    this._slowMoActive = false;
    this._slowMoTimeout = null;

    // Boss mode tracking
    this._bossWave = 0;
    this._bossWaveKills = 0;
    this._bossSpawnPaused = false;
    this._currentBoss = null;
    this._currentBossHp = 0;
    this._currentBossMaxHp = 0;
  }

  set onComboChange(fn) { this._onComboChange = fn; }
  set onMiss(fn) { this._onMiss = fn; }
  get targetsHit() { return this._targetsHit; }
  get bestCombo() { return this._bestCombo; }

  get coinsEarned() { return this._coinsEarned; }

  configure(config) {
    this._spawnInterval = config.spawnInterval || this._spawnInterval;
    this._maxTargets = config.maxTargets || this._maxTargets;
    this._targetLifetime = config.targetLifetime || this._targetLifetime;
    this._bossMode = config.bossMode || false;
    this._wave = 0;
    this._coinsEarned = 0;
  }

  start() {
    this._running = true;
    this._combo = 0;
    this._targetsHit = 0;
    this._bestCombo = 0;
    this._coinsEarned = 0;
    this._wave = 0;
    this._bossWave = 0;
    this._bossWaveKills = 0;
    this._bossSpawnPaused = false;
    this._currentBoss = null;
    this._clearAll();
    this._spawnTimer = setInterval(() => this._trySpawn(), this._spawnInterval);
    for (let i = 0; i < 3; i++) this._spawnTarget();
  }

  stop() {
    this._running = false;
    if (this._spawnTimer) {
      clearInterval(this._spawnTimer);
      this._spawnTimer = null;
    }
    if (this._slowMoTimeout) {
      clearTimeout(this._slowMoTimeout);
      this._slowMoTimeout = null;
      this._slowMoActive = false;
    }
    this._clearAll();
  }

  _trySpawn() {
    if (!this._running || this._bossSpawnPaused || this._targets.size >= this._maxTargets) return;
    this._spawnTarget();
  }

  _pickTargetType() {
    if (this._bossMode) return 'heavy';

    let total = 0;
    for (const t of Object.values(TARGET_TYPES)) total += t.weight;
    let r = Math.random() * total;
    for (const [id, t] of Object.entries(TARGET_TYPES)) {
      r -= t.weight;
      if (r <= 0) return id;
    }
    return 'standard';
  }

  _spawnTarget() {
    const typeId = this._pickTargetType();
    const type = TARGET_TYPES[typeId];

    // Set geometry directly on the entity so raycaster can intersect it
    // Map HTML primitive names to geometry component primitive names (camelCase)
    const GEO_MAP = { 'a-torus-knot': 'torusKnot' };
    const geoPrimitive = GEO_MAP[type.geometry] || type.geometry.replace('a-', '');
    const el = document.createElement('a-entity');
    el.setAttribute('class', 'target');

    // Set geometry on the entity itself (not a child) for raycaster hit detection
    let geoStr = `primitive: ${geoPrimitive}`;
    if (type.geometry === 'a-torus') {
      geoStr += `; radius: ${type.radius}; radiusTubular: 0.06; segmentsRadial: 8; segmentsTubular: 24`;
    } else if (type.geometry === 'a-torus-knot') {
      geoStr += `; radius: ${type.radius * 0.6}; radiusTubular: 0.04`;
    } else {
      geoStr += `; radius: ${type.radius}`;
    }
    el.setAttribute('geometry', geoStr);

    // All non-sphere types get slow rotation for visual interest
    if (type.geometry !== 'a-sphere') {
      el.setAttribute('animation__rotate', {
        property: 'rotation',
        to: '360 360 0',
        dur: 4000 + Math.random() * 2000,
        easing: 'linear', loop: true,
      });
    }

    const color = type.color || this._randomColor();
    // 3D materials: metallic + emissive for sci-fi look
    const matProps = TARGET_MATERIALS[typeId] || TARGET_MATERIALS.standard;
    el.setAttribute('material', `color: ${color}; metalness: ${matProps.metalness}; roughness: ${matProps.roughness}; emissive: ${matProps.emissive}; emissiveIntensity: ${matProps.emissiveIntensity}`);
    el.setAttribute('shadow', 'cast: true; receive: false');

    // Wireframe overlay for visual depth
    if (typeId !== 'decoy') {
      const wire = document.createElement(type.geometry === 'a-torus' ? 'a-torus' : type.geometry === 'a-torus-knot' ? 'a-torus-knot' : 'a-sphere');
      const wr = type.radius * 1.05;
      if (type.geometry === 'a-torus') {
        wire.setAttribute('radius', String(type.radius * 1.05));
        wire.setAttribute('radius-tubular', '0.065');
        wire.setAttribute('segments-radial', '8');
        wire.setAttribute('segments-tubular', '24');
      } else if (type.geometry === 'a-torus-knot') {
        wire.setAttribute('radius', String(type.radius * 0.65));
        wire.setAttribute('radius-tubular', '0.05');
      } else {
        wire.setAttribute('radius', String(wr));
      }
      wire.setAttribute('material', `color: ${color}; wireframe: true; opacity: 0.15; transparent: true`);
      el.appendChild(wire);
    } else {
      // Decoy: wireframe-only overlay to look "glitchy"
      const wire = document.createElement('a-sphere');
      wire.setAttribute('radius', String(type.radius * 1.08));
      wire.setAttribute('material', `color: #ff0000; wireframe: true; opacity: 0.2; transparent: true`);
      el.appendChild(wire);
    }

    const hp = this._bossMode ? type.hp + Math.floor(this._wave / 3) : type.hp;
    el.setAttribute('target-hit', `hp: ${hp}; targetType: ${typeId}`);

    // Boss mode: scale, color tiers, glow, compound geometry
    if (this._bossMode) {
      const scale = Math.min(1.0 + this._bossWave * 0.05, 2.0);
      el.setAttribute('scale', `${scale} ${scale} ${scale}`);

      // Color tiers by wave
      let bossColor = '#ff3333';
      let bossEmissive = '#ff1111';
      if (this._bossWave >= 16)     { bossColor = '#ffd700'; bossEmissive = '#ffaa00'; }
      else if (this._bossWave >= 11) { bossColor = '#aa00ff'; bossEmissive = '#7700cc'; }
      else if (this._bossWave >= 6)  { bossColor = '#ff6600'; bossEmissive = '#cc4400'; }
      el.setAttribute('material', `color: ${bossColor}; metalness: 0.9; roughness: 0.1; emissive: ${bossEmissive}; emissiveIntensity: 0.6`);

      // Boss compound geometry: outer rotating ring
      const bossRing = document.createElement('a-torus');
      bossRing.setAttribute('radius', String(type.radius * 1.6));
      bossRing.setAttribute('radius-tubular', '0.02');
      bossRing.setAttribute('material', `color: ${bossColor}; emissive: ${bossEmissive}; emissiveIntensity: 0.8; opacity: 0.4`);
      bossRing.setAttribute('animation__spin', {
        property: 'rotation', to: '0 360 0',
        dur: 2000, easing: 'linear', loop: true,
      });
      el.appendChild(bossRing);

      // Second ring (perpendicular)
      const bossRing2 = document.createElement('a-torus');
      bossRing2.setAttribute('radius', String(type.radius * 1.4));
      bossRing2.setAttribute('radius-tubular', '0.015');
      bossRing2.setAttribute('rotation', '90 0 0');
      bossRing2.setAttribute('material', `color: ${bossColor}; emissive: ${bossEmissive}; emissiveIntensity: 0.6; opacity: 0.3`);
      bossRing2.setAttribute('animation__spin', {
        property: 'rotation', from: '90 0 0', to: '90 0 360',
        dur: 3000, easing: 'linear', loop: true,
      });
      el.appendChild(bossRing2);

      // Pulsing glow on core
      el.setAttribute('animation__glow', {
        property: 'material.emissiveIntensity', from: 0.3, to: 0.8,
        dur: 800, loop: true, dir: 'alternate', easing: 'easeInOutSine',
      });

      // Track as current boss
      this._currentBoss = el;
      this._currentBossHp = hp;
      this._currentBossMaxHp = hp;
      audioManager.playBossSpawn();
      document.dispatchEvent(new CustomEvent('boss-spawn', {
        detail: { hp, maxHp: hp, wave: this._bossWave },
      }));
    }

    // 360-degree spawn with hemisphere bias
    const spawnPos = this._pick360Position();
    const x = spawnPos.x;
    const y = spawnPos.y;
    const z = spawnPos.z;
    el.setAttribute('position', `${x} ${y} ${z}`);

    // Dispatch spatial spawn event for directional audio
    document.dispatchEvent(new CustomEvent('target-spawn-at', {
      detail: { x, y, z, type: typeId },
    }));

    el.setAttribute('animation__spawn', {
      property: 'scale', from: '0 0 0', to: '1 1 1',
      dur: 300, easing: 'easeOutElastic',
    });

    const settings = getSettings();
    if (!settings.reducedMotion) {
      if (type.speed > 0) {
        const range = type.speed;
        el.setAttribute('animation__move', {
          property: 'position',
          to: `${x + range} ${y} ${z}`,
          dur: 800 + Math.random() * 400,
          easing: 'easeInOutSine', loop: true, dir: 'alternate',
        });
      } else {
        el.setAttribute('animation__float', {
          property: 'position',
          to: `${x} ${y + 0.3} ${z}`,
          dur: 1200 + Math.random() * 600,
          easing: 'easeInOutSine', loop: true, dir: 'alternate',
        });
      }
    }

    // Power-up target: spinning + pulsing glow
    if (typeId === 'powerup') {
      el.setAttribute('animation__rotate', {
        property: 'rotation', to: '360 360 0',
        dur: 2000, easing: 'linear', loop: true,
      });
      el.setAttribute('animation__glow', {
        property: 'material.emissiveIntensity', from: 0.5, to: 1.2,
        dur: 600, loop: true, dir: 'alternate', easing: 'easeInOutSine',
      });
    }

    el._targetType = typeId;
    el._targetPoints = type.points;
    el._targetCoins = type.coins;

    el.addEventListener('destroyed', (evt) => {
      const damage = evt?.detail?.damage || 1;
      const hitPos = evt?.detail?.position || null;
      this._onTargetHit(el, damage, hitPos);
    });

    const lifetime = type.lifetime || this._targetLifetime;
    const expireTimeout = setTimeout(() => {
      if (this._targets.has(el)) {
        this._removeTarget(el, true);
      }
    }, lifetime);
    el._expireTimeout = expireTimeout;

    this._container.appendChild(el);
    this._targets.add(el);
    audioManager.playSpawn({ x, y, z });
  }

  _onTargetHit(el, damage = 1, hitPos = null) {
    if (!this._running) return;

    const basePoints = el._targetPoints !== undefined ? el._targetPoints : BASE_POINTS;
    const isDecoy = el._targetType === 'decoy';
    const pos = hitPos || { x: 0, y: 2, z: -5 };

    if (isDecoy) {
      scoreManager.add(basePoints); // negative points
      this._combo = 0;
      this._onComboChange?.(0);
      audioManager.playMiss();
      document.dispatchEvent(new CustomEvent('crosshair-miss'));
      this._spawnDamageNumber(pos, basePoints, '#ff4444', '');
      this._flashScreen('miss');
    } else {
      this._combo++;
      this._targetsHit++;
      this._wave++;
      if (this._combo > this._bestCombo) this._bestCombo = this._combo;

      if (this._comboTimer) clearTimeout(this._comboTimer);
      this._comboTimer = setTimeout(() => {
        this._combo = 0;
        this._onComboChange?.(0);
      }, 2000);

      const comboMultiplier = Math.min(this._combo, 5);
      const powerUpMultiplier = powerUpManager.getMultiplier();
      const points = basePoints * comboMultiplier * damage * powerUpMultiplier;
      scoreManager.add(points);
      this._onComboChange?.(this._combo);

      audioManager.playHit(pos);
      window.__hapticManager?.hit();
      document.dispatchEvent(new CustomEvent('crosshair-hit'));
      if (this._combo >= 2) {
        audioManager.playCombo(this._combo);
        window.__hapticManager?.combo(this._combo);
      }

      // Slow-motion at combo 10+
      if (this._combo >= 10) {
        this._triggerSlowMotion();
      }

      // Power-up target: activate random power-up
      if (el._targetType === 'powerup') {
        const pu = powerUpManager.activateRandom();
        this._spawnDamageNumber(pos, 0, pu.config.color, pu.config.label);
        window.__hapticManager?.powerUp();
      }

      // Damage number
      const comboText = comboMultiplier > 1 ? ` x${comboMultiplier}` : '';
      const puText = powerUpMultiplier > 1 ? ' 2X' : '';
      const color = el._targetType === 'bonus' ? '#ffd700' : el._targetType === 'powerup' ? '#00ffaa' : comboMultiplier > 1 ? '#00d4ff' : '#ffffff';
      this._spawnDamageNumber(pos, points, color, comboText + puText);
      this._flashScreen('hit');

      // Bonus coins
      if (el._targetCoins > 0) {
        this._coinsEarned += el._targetCoins;
        const profile = authManager.profile;
        if (profile) {
          authManager.saveProfile({ coins: (profile.coins || 0) + el._targetCoins });
        }
      }

      // Boss mode: track kills, wave clears, boss events
      if (this._bossMode) {
        if (el === this._currentBoss) {
          audioManager.playBossKill();
          window.__hapticManager?.bossKill();
          this._currentBoss = null;
          document.dispatchEvent(new CustomEvent('boss-killed'));
        }

        this._bossWaveKills++;
        if (this._bossWaveKills >= 5) {
          this._bossWaveKills = 0;
          this._bossWave++;
          audioManager.playWaveClear();
          document.dispatchEvent(new CustomEvent('boss-wave-clear', {
            detail: { wave: this._bossWave },
          }));

          // Dramatic pause between waves
          this._bossSpawnPaused = true;
          setTimeout(() => { this._bossSpawnPaused = false; }, 1500);
        }
      }
    }

    this._targets.delete(el);
    if (el._expireTimeout) clearTimeout(el._expireTimeout);
  }

  _triggerSlowMotion() {
    if (this._slowMoActive) return;
    this._slowMoActive = true;

    // Store original animation durations and slow them
    const animData = [];
    this._targets.forEach(el => {
      ['animation__move', 'animation__float', 'animation__rotate'].forEach(name => {
        const attr = el.getAttribute(name);
        if (attr && attr.dur) {
          const origDur = attr.dur;
          animData.push({ el, name, origDur });
          el.setAttribute(name, 'dur', origDur * 3);
        }
      });
    });

    audioManager.playSlowMoHit();
    window.__hapticManager?.slowMo();
    document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: true } }));

    // Restore after 300ms
    this._slowMoTimeout = setTimeout(() => {
      this._slowMoActive = false;
      animData.forEach(({ el, name, origDur }) => {
        if (el.parentNode) {
          el.setAttribute(name, 'dur', origDur);
        }
      });
      document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: false } }));
    }, 300);
  }

  _spawnDamageNumber(pos, points, color, suffix) {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const text = points >= 0 ? `+${points}${suffix}` : `${points}`;
    const el = document.createElement('a-entity');
    el.setAttribute('position', `${pos.x} ${pos.y + 0.3} ${pos.z}`);
    el.setAttribute('damage-number', `text: ${text}; color: ${color}`);
    scene.appendChild(el);
  }

  _flashScreen(type) {
    let flash = document.getElementById('hit-flash');
    if (!flash) {
      flash = document.createElement('div');
      flash.id = 'hit-flash';
      flash.className = 'hit-flash';
      document.body.appendChild(flash);
    }
    flash.className = 'hit-flash';
    // Force reflow
    void flash.offsetWidth;
    flash.classList.add(type === 'miss' ? 'flash-miss' : 'flash-hit');
    setTimeout(() => flash.classList.remove('flash-hit', 'flash-miss'), 100);
  }

  _removeTarget(el, expired = false) {
    this._targets.delete(el);
    if (el._expireTimeout) clearTimeout(el._expireTimeout);

    if (expired) {
      this._combo = 0;
      this._onComboChange?.(0);
      audioManager.playMiss();
      this._onMiss?.();

      el.setAttribute('animation__fade', {
        property: 'material.opacity', to: 0, dur: 200,
      });
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 250);
    } else {
      if (el.parentNode) el.parentNode.removeChild(el);
    }
  }

  _clearAll() {
    this._targets.forEach(el => {
      if (el._expireTimeout) clearTimeout(el._expireTimeout);
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    this._targets.clear();
  }

  _pick360Position() {
    // Pick angle with hemisphere bias: front 60%, sides 25%, behind 15%
    let angle;
    const r = Math.random();
    if (r < SPAWN.frontBias) {
      // Front hemisphere: -70° to +70° (facing -Z)
      angle = (Math.random() - 0.5) * (140 * Math.PI / 180);
    } else if (r < SPAWN.frontBias + SPAWN.sideBias) {
      // Sides: 70°–110° left or right
      const side = Math.random() < 0.5 ? 1 : -1;
      angle = side * (70 + Math.random() * 40) * Math.PI / 180;
    } else {
      // Behind: 110°–180° left or right
      const side = Math.random() < 0.5 ? 1 : -1;
      angle = side * (110 + Math.random() * 70) * Math.PI / 180;
    }

    // Distance: weighted toward mid-range
    const dist = SPAWN.distMin + Math.random() * (SPAWN.distMax - SPAWN.distMin);
    const y = this._rand(SPAWN.yMin, SPAWN.yMax);

    // Convert to XZ (angle 0 = -Z direction = forward)
    const x = Math.sin(angle) * dist;
    const z = -Math.cos(angle) * dist;

    // Clamp to arena bounds (platform is 32x32, barriers at ±15)
    return {
      x: THREE.MathUtils.clamp(x, -13, 13),
      y,
      z: THREE.MathUtils.clamp(z, -13, 13),
    };
  }

  _randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  _rand(min, max) {
    return Math.random() * (max - min) + min;
  }
}

export { TargetSystem };
export default TargetSystem;
