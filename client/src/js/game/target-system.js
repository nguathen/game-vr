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

    // Spatial audio hums for targets (max 8 concurrent)
    this._targetHums = new Map();
    this._humTick = null;

    // Projectile system (TASK-250)
    this._projectiles = new Set();
    this._projectileTick = null;
    this._lastProjectileTime = 0;

    // Charger targets (TASK-251)
    this._chargerTimer = null;
    this._chargerTick = null;
    this._chargers = new Set();

    // Danger zones (TASK-253)
    this._dangerZones = new Set();
    this._dangerZoneTimer = null;
    this._dangerZoneTick = null;
    this._lastDangerZoneTime = 0;

    // Callback for damage events
    this._onPlayerDamage = null;

    // Scare balls (TASK-255)
    this._scareBalls = new Set();
    this._scareBallTimer = null;
    this._scareBallTick = null;
    this._lastScareBallTime = 0;

    // Punch targets (TASK-256)
    this._punchTick = null;
    this._lastControllerPos = { right: null, left: null };
    this._controllerVelocity = { right: 0, left: 0 };

    // Rhythm targets (TASK-257)
    this._rhythmMode = false;
    this._beatPhase = 0;
    this._beatTimer = null;
    this._lastBeatTime = 0;
    this._bpm = 120;

    // Laser sweeps (TASK-258)
    this._laserSweeps = new Set();
    this._laserSweepTimer = null;
    this._laserSweepTick = null;
    this._lastLaserSweepTime = 0;
  }

  set onComboChange(fn) { this._onComboChange = fn; }
  set onMiss(fn) { this._onMiss = fn; }
  set onPlayerDamage(fn) { this._onPlayerDamage = fn; }
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
    // Stagger initial spawns slightly for telegraph effect
    for (let i = 0; i < 3; i++) {
      setTimeout(() => { if (this._running) this._spawnTarget(); }, i * 200);
    }
    // Spatial audio tick: update target hum positions + urgency volume
    this._humTick = setInterval(() => this._updateHums(), 200);

    // Projectile collision tick (TASK-250)
    this._projectileTick = setInterval(() => this._updateProjectiles(), 50);
    this._lastProjectileTime = Date.now();

    // Charger spawn timer (TASK-251)
    const chargerInterval = this._bossMode ? 12000 : 18000;
    this._chargerTimer = setInterval(() => this._trySpawnCharger(), chargerInterval);
    this._chargerTick = setInterval(() => this._updateChargers(), 50);

    // Danger zone timer (TASK-253)
    this._lastDangerZoneTime = Date.now();
    this._dangerZoneTimer = setInterval(() => this._trySpawnDangerZone(), 1000);
    this._dangerZoneTick = setInterval(() => this._updateDangerZones(), 500);

    // Scare ball timer (TASK-255)
    this._lastScareBallTime = Date.now() + 10000; // grace period at start
    this._scareBallTimer = setInterval(() => this._tryLaunchScareBall(), 1000);
    this._scareBallTick = setInterval(() => this._updateScareBalls(), 30);

    // Punch target detection tick (TASK-256)
    this._lastControllerPos = { right: null, left: null };
    this._controllerVelocity = { right: 0, left: 0 };
    this._punchTick = setInterval(() => this._updatePunchDetection(), 30);

    // Rhythm beat tick (TASK-257)
    this._rhythmMode = false;
    this._lastBeatTime = Date.now();
    this._beatTimer = setInterval(() => this._updateRhythmBeat(), 50);

    // Laser sweep timer (TASK-258)
    this._lastLaserSweepTime = Date.now() + 15000; // grace period
    this._laserSweepTimer = setInterval(() => this._tryLaunchLaserSweep(), 1000);
    this._laserSweepTick = setInterval(() => this._updateLaserSweeps(), 30);
  }

  stop() {
    this._running = false;
    if (this._spawnTimer) {
      clearInterval(this._spawnTimer);
      this._spawnTimer = null;
    }
    if (this._humTick) {
      clearInterval(this._humTick);
      this._humTick = null;
    }
    if (this._slowMoTimeout) {
      clearTimeout(this._slowMoTimeout);
      this._slowMoTimeout = null;
      this._slowMoActive = false;
    }
    // Stop all target hums
    this._targetHums.forEach(h => h.stop());
    this._targetHums.clear();

    // Cleanup projectiles (TASK-250)
    if (this._projectileTick) { clearInterval(this._projectileTick); this._projectileTick = null; }
    this._projectiles.forEach(p => { if (p.el?.parentNode) p.el.parentNode.removeChild(p.el); });
    this._projectiles.clear();

    // Cleanup chargers (TASK-251)
    if (this._chargerTimer) { clearInterval(this._chargerTimer); this._chargerTimer = null; }
    if (this._chargerTick) { clearInterval(this._chargerTick); this._chargerTick = null; }
    this._chargers.forEach(c => {
      if (c.hum) c.hum.stop();
      if (c.el?.parentNode) c.el.parentNode.removeChild(c.el);
    });
    this._chargers.clear();

    // Cleanup danger zones (TASK-253)
    if (this._dangerZoneTimer) { clearInterval(this._dangerZoneTimer); this._dangerZoneTimer = null; }
    if (this._dangerZoneTick) { clearInterval(this._dangerZoneTick); this._dangerZoneTick = null; }
    this._dangerZones.forEach(z => { if (z.el?.parentNode) z.el.parentNode.removeChild(z.el); });
    this._dangerZones.clear();

    // Cleanup scare balls (TASK-255)
    if (this._scareBallTimer) { clearInterval(this._scareBallTimer); this._scareBallTimer = null; }
    if (this._scareBallTick) { clearInterval(this._scareBallTick); this._scareBallTick = null; }
    this._scareBalls.forEach(b => { if (b.el?.parentNode) b.el.parentNode.removeChild(b.el); });
    this._scareBalls.clear();

    // Cleanup punch detection (TASK-256)
    if (this._punchTick) { clearInterval(this._punchTick); this._punchTick = null; }

    // Cleanup rhythm (TASK-257)
    if (this._beatTimer) { clearInterval(this._beatTimer); this._beatTimer = null; }
    this._rhythmMode = false;

    // Cleanup laser sweeps (TASK-258)
    if (this._laserSweepTimer) { clearInterval(this._laserSweepTimer); this._laserSweepTimer = null; }
    if (this._laserSweepTick) { clearInterval(this._laserSweepTick); this._laserSweepTick = null; }
    this._laserSweeps.forEach(s => { if (s.el?.parentNode) s.el.parentNode.removeChild(s.el); });
    this._laserSweeps.clear();

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

    // TASK-256: 15% chance to spawn melee target (standard type only, not boss mode)
    if (!this._bossMode && typeId === 'standard' && Math.random() < 0.15) {
      this._spawnMeleeTarget();
      return;
    }

    // 360-degree spawn position (pick early for telegraph)
    const spawnPos = this._pick360Position();

    // TASK-257: rhythm mode overrides spawn position timing
    if (this._rhythmMode && typeId !== 'decoy') {
      spawnPos._rhythmTarget = true;
      spawnPos._beatSpawnTime = Date.now();
    }

    // Telegraph effect: show pre-spawn visual 0.5s before actual spawn
    this._spawnTelegraph(spawnPos, typeId);

    // Delay actual spawn by 500ms for telegraph anticipation
    setTimeout(() => {
      if (!this._running) return;
      this._spawnTargetAt(typeId, type, spawnPos);
    }, 500);
  }

  _spawnTelegraph(pos, typeId) {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const isBoss = this._bossMode;
    const color = TARGET_TYPES[typeId]?.color || '#00d4ff';
    const size = isBoss ? 1.5 : 0.8;

    // Glow point light
    const light = document.createElement('a-entity');
    light.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    light.setAttribute('light', `type: point; color: ${color}; intensity: 0; distance: ${isBoss ? 8 : 4}; decay: 2`);
    light.setAttribute('animation__fadein', {
      property: 'light.intensity', from: 0, to: isBoss ? 1.5 : 0.8,
      dur: 450, easing: 'easeInQuad',
    });
    scene.appendChild(light);

    // Converging particles (swirl inward)
    const particleCount = isBoss ? 5 : 3;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const dist = size;
      const px = pos.x + Math.cos(angle) * dist;
      const py = pos.y + Math.sin(angle) * dist * 0.5;
      const pz = pos.z + Math.sin(angle) * dist;
      const p = document.createElement('a-sphere');
      p.setAttribute('radius', isBoss ? '0.04' : '0.025');
      p.setAttribute('material', `shader: flat; color: ${color}; opacity: 0.6`);
      p.setAttribute('position', `${px} ${py} ${pz}`);
      p.setAttribute('animation__converge', {
        property: 'position',
        to: `${pos.x} ${pos.y} ${pos.z}`,
        dur: 450, easing: 'easeInQuad',
      });
      p.setAttribute('animation__fade', {
        property: 'material.opacity', from: 0.6, to: 0,
        dur: 480, easing: 'easeInQuad',
      });
      scene.appendChild(p);
      setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 520);
    }

    // Spatial audio cue
    audioManager.playTelegraph(pos, isBoss);

    // Cleanup light
    setTimeout(() => { if (light.parentNode) light.parentNode.removeChild(light); }, 550);
  }

  _spawnTargetAt(typeId, type, spawnPos) {
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

    // TASK-257: Rhythm timing ring for rhythm-mode targets
    if (spawnPos._rhythmTarget) {
      el._rhythmTarget = true;
      el._beatSpawnTime = spawnPos._beatSpawnTime;
      const beatDuration = 60000 / this._bpm;
      const timingRing = document.createElement('a-ring');
      timingRing.setAttribute('radius-inner', '0.78');
      timingRing.setAttribute('radius-outer', '0.8');
      timingRing.setAttribute('material', 'shader: flat; color: #44ff44; opacity: 0.6; transparent: true');
      timingRing.setAttribute('animation__shrink', {
        property: 'radius-inner', from: 0.78, to: type.radius,
        dur: beatDuration, easing: 'linear',
      });
      timingRing.setAttribute('animation__shrink2', {
        property: 'radius-outer', from: 0.8, to: type.radius + 0.02,
        dur: beatDuration, easing: 'linear',
      });
      // Color transition green → yellow → red
      timingRing.setAttribute('animation__color', {
        property: 'material.color', from: '#44ff44', to: '#ff4444',
        dur: beatDuration, easing: 'linear',
      });
      el.appendChild(timingRing);
      el._timingRing = timingRing;
    }

    // Spatial audio hum (max 8 concurrent)
    if (this._targetHums.size < 8) {
      const hum = audioManager.createTargetHum({ x, y, z }, typeId);
      if (hum) {
        el._spawnTime = Date.now();
        el._lifetime = lifetime;
        this._targetHums.set(el, hum);
      }
    }
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

      // TASK-257: Rhythm timing bonus
      let rhythmMultiplier = 1;
      let rhythmGrade = '';
      if (el._rhythmTarget && el._beatSpawnTime) {
        const beatDuration = 60000 / this._bpm;
        const elapsed = Date.now() - el._beatSpawnTime;
        const beatError = Math.abs((elapsed / beatDuration) - 1);
        if (beatError < 0.1) {
          rhythmMultiplier = 3;
          rhythmGrade = 'PERFECT';
          audioManager.playRhythmPerfect(pos);
        } else if (beatError < 0.25) {
          rhythmMultiplier = 2;
          rhythmGrade = 'GOOD';
        } else {
          rhythmGrade = 'OK';
        }
      }

      const points = basePoints * comboMultiplier * damage * powerUpMultiplier * rhythmMultiplier;
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
      const rhythmText = rhythmGrade ? ` ${rhythmGrade}` : '';
      const color = rhythmGrade === 'PERFECT' ? '#ffff00' : el._targetType === 'bonus' ? '#ffd700' : el._targetType === 'powerup' ? '#00ffaa' : el._isMelee ? '#ff8800' : comboMultiplier > 1 ? '#00d4ff' : '#ffffff';
      this._spawnDamageNumber(pos, points, color, comboText + puText + rhythmText);
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
    // Stop spatial hum
    const hum = this._targetHums.get(el);
    if (hum) { hum.stop(); this._targetHums.delete(el); }
  }

  _updateHums() {
    this._targetHums.forEach((hum, el) => {
      if (!el.parentNode || !el.object3D) {
        hum.stop(); this._targetHums.delete(el); return;
      }
      const pos = el.object3D.position;
      const elapsed = Date.now() - (el._spawnTime || 0);
      const lifetime = el._lifetime || this._targetLifetime;
      const progress = Math.min(elapsed / lifetime, 1);
      // Volume ramps from 0.02 to 0.08 as target nears expiry
      const vol = 0.02 + progress * 0.06;
      hum.update({ x: pos.x, y: pos.y, z: pos.z }, vol);
    });

    // Check if heavy/boss targets should fire projectiles (TASK-250)
    this._checkProjectileFiring();
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
    const hum = this._targetHums.get(el);
    if (hum) { hum.stop(); this._targetHums.delete(el); }

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
    this._targetHums.forEach(h => h.stop());
    this._targetHums.clear();
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

  // === TASK-250: Incoming Projectiles ===

  _tryFireProjectile(targetEl) {
    if (!this._running) return;
    const now = Date.now();
    if (now - this._lastProjectileTime < 3000) return; // min 3s between projectiles
    this._lastProjectileTime = now;

    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const tPos = targetEl.object3D.position;
    const pos = { x: tPos.x, y: tPos.y, z: tPos.z };

    // Telegraph: charge-up glow on target for 0.8s
    audioManager.playProjectileCharge(pos);
    targetEl.setAttribute('animation__charge', {
      property: 'material.emissiveIntensity', from: 0.5, to: 2.0,
      dur: 700, easing: 'easeInQuad',
    });

    setTimeout(() => {
      if (!this._running || !targetEl.parentNode) return;
      targetEl.removeAttribute('animation__charge');
      this._launchProjectile(pos);
    }, 800);
  }

  _launchProjectile(origin) {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);

    // Direction toward player
    const dir = new THREE.Vector3(camPos.x - origin.x, camPos.y - origin.y, camPos.z - origin.z).normalize();

    const el = document.createElement('a-sphere');
    el.setAttribute('radius', '0.08');
    el.setAttribute('position', `${origin.x} ${origin.y} ${origin.z}`);
    el.setAttribute('material', 'shader: flat; color: #ff2222; emissive: #ff0000; emissiveIntensity: 2; opacity: 0.9; transparent: true');
    el.setAttribute('shadow', 'cast: false; receive: false');

    // Trail ring
    const trail = document.createElement('a-ring');
    trail.setAttribute('radius-inner', '0.02');
    trail.setAttribute('radius-outer', '0.06');
    trail.setAttribute('material', 'shader: flat; color: #ff4400; opacity: 0.4; transparent: true');
    trail.setAttribute('animation__spin', { property: 'rotation', to: '0 0 360', dur: 300, loop: true, easing: 'linear' });
    el.appendChild(trail);

    scene.appendChild(el);

    const projectile = {
      el,
      pos: new THREE.Vector3(origin.x, origin.y, origin.z),
      dir,
      speed: 3,
      spawnTime: Date.now(),
    };
    this._projectiles.add(projectile);
  }

  _updateProjectiles() {
    if (!this._running) return;
    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);

    // Also check shield (TASK-254)
    const leftHand = document.getElementById('left-hand');
    const shieldActive = leftHand?._shieldActive || false;
    const shieldPos = new THREE.Vector3();
    if (leftHand?.object3D) leftHand.object3D.getWorldPosition(shieldPos);

    const dt = 0.05; // 50ms tick
    const toRemove = [];

    this._projectiles.forEach(p => {
      p.pos.x += p.dir.x * p.speed * dt;
      p.pos.y += p.dir.y * p.speed * dt;
      p.pos.z += p.dir.z * p.speed * dt;
      p.el.setAttribute('position', `${p.pos.x} ${p.pos.y} ${p.pos.z}`);

      // Shield block check (TASK-254)
      if (shieldActive && p.pos.distanceTo(shieldPos) < 0.6) {
        toRemove.push(p);
        this._onShieldBlock(p);
        return;
      }

      // Hit check: distance to camera head
      if (p.pos.distanceTo(camPos) < 0.4) {
        toRemove.push(p);
        this._onProjectileHit(p);
        return;
      }

      // Timeout after 4s
      if (Date.now() - p.spawnTime > 4000) {
        toRemove.push(p);
      }
    });

    toRemove.forEach(p => {
      this._projectiles.delete(p);
      if (p.el?.parentNode) {
        p.el.setAttribute('animation__fade', { property: 'material.opacity', to: 0, dur: 150 });
        setTimeout(() => { if (p.el.parentNode) p.el.parentNode.removeChild(p.el); }, 200);
      }
    });
  }

  _onProjectileHit(p) {
    audioManager.playProjectileHit();
    window.__hapticManager?.damageTaken();
    this._flashScreen('miss');

    // Dispatch player damage event
    this._onPlayerDamage?.('projectile');

    // Impact particles at player
    const cam = document.getElementById('camera');
    if (cam) {
      const cp = new THREE.Vector3();
      cam.object3D.getWorldPosition(cp);
      const scene = this._container.sceneEl || this._container.closest('a-scene');
      if (scene) {
        for (let i = 0; i < 4; i++) {
          const s = document.createElement('a-sphere');
          s.setAttribute('radius', '0.015');
          s.setAttribute('material', 'shader: flat; color: #ff2222; opacity: 0.7');
          s.setAttribute('position', `${cp.x} ${cp.y} ${cp.z}`);
          const dx = (Math.random() - 0.5) * 1.5;
          const dy = (Math.random() - 0.5) * 1.5;
          const dz = (Math.random() - 0.5) * 1.5;
          s.setAttribute('animation__burst', {
            property: 'position', to: `${cp.x + dx} ${cp.y + dy} ${cp.z + dz}`,
            dur: 200, easing: 'easeOutQuad',
          });
          s.setAttribute('animation__fade', { property: 'material.opacity', from: 0.7, to: 0, dur: 250 });
          scene.appendChild(s);
          setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
        }
      }
    }
  }

  _onShieldBlock(p) {
    const pos = { x: p.pos.x, y: p.pos.y, z: p.pos.z };
    audioManager.playShieldBlock(pos);

    // Shield block gives +5 points via event
    document.dispatchEvent(new CustomEvent('shield-block', { detail: { pos, points: 5 } }));

    // Blue shatter particles
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (scene) {
      for (let i = 0; i < 5; i++) {
        const s = document.createElement('a-sphere');
        s.setAttribute('radius', '0.012');
        s.setAttribute('material', 'shader: flat; color: #4488ff; opacity: 0.8');
        s.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        const dx = (Math.random() - 0.5) * 1.5;
        const dy = (Math.random() - 0.5) * 1.5;
        const dz = (Math.random() - 0.5) * 1.5;
        s.setAttribute('animation__burst', {
          property: 'position', to: `${pos.x + dx} ${pos.y + dy} ${pos.z + dz}`,
          dur: 200, easing: 'easeOutQuad',
        });
        s.setAttribute('animation__fade', { property: 'material.opacity', from: 0.8, to: 0, dur: 250 });
        scene.appendChild(s);
        setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 300);
      }
    }

    // Haptic on left hand
    const leftHand = document.getElementById('left-hand');
    if (leftHand?.components?.['oculus-touch-controls']) {
      window.__hapticManager?.pulse(0.6, 80);
    }
  }

  // === TASK-251: Charging Targets ===

  _trySpawnCharger() {
    if (!this._running || this._chargers.size >= 2) return;

    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);
    const camDir = new THREE.Vector3();
    cam.object3D.getWorldDirection(camDir);
    camDir.y = 0;
    camDir.normalize();

    // Spawn behind or to the side (never in front FOV)
    const baseAngle = Math.atan2(-camDir.x, -camDir.z); // opposite of look direction
    const offset = (Math.random() - 0.5) * Math.PI * 0.8; // ±72° from behind
    const angle = baseAngle + offset;
    const dist = 12 + Math.random() * 2;

    const x = THREE.MathUtils.clamp(Math.sin(angle) * dist, -13, 13);
    const z = THREE.MathUtils.clamp(-Math.cos(angle) * dist, -13, 13);
    const y = 0.5;

    // Telegraph: pulsing ground glow at spawn point
    const telegraph = document.createElement('a-circle');
    telegraph.setAttribute('rotation', '-90 0 0');
    telegraph.setAttribute('position', `${x} 0.06 ${z}`);
    telegraph.setAttribute('radius', '0.8');
    telegraph.setAttribute('material', 'shader: flat; color: #ff4400; opacity: 0; transparent: true');
    telegraph.setAttribute('animation__warn', {
      property: 'material.opacity', from: 0, to: 0.4,
      dur: 800, easing: 'easeInQuad',
    });
    scene.appendChild(telegraph);
    audioManager.playChargerRumble({ x, y, z });

    setTimeout(() => {
      if (telegraph.parentNode) telegraph.parentNode.removeChild(telegraph);
      if (!this._running) return;
      this._spawnCharger(x, y, z);
    }, 1000);
  }

  _spawnCharger(x, y, z) {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const el = document.createElement('a-entity');
    el.setAttribute('class', 'target');
    el.setAttribute('geometry', 'primitive: cylinder; radius: 0.3; height: 0.6; segmentsRadial: 8');
    el.setAttribute('material', 'color: #ff4400; metalness: 0.8; roughness: 0.2; emissive: #ff2200; emissiveIntensity: 0.8');
    el.setAttribute('position', `${x} ${y} ${z}`);
    el.setAttribute('shadow', 'cast: true; receive: false');
    el.setAttribute('animation__pulse', {
      property: 'material.emissiveIntensity', from: 0.5, to: 1.2,
      dur: 300, loop: true, dir: 'alternate', easing: 'easeInOutSine',
    });
    el.setAttribute('animation__spawn', {
      property: 'scale', from: '0 0 0', to: '1 1 1',
      dur: 300, easing: 'easeOutElastic',
    });

    // Glowing ring around charger
    const ring = document.createElement('a-torus');
    ring.setAttribute('radius', '0.45');
    ring.setAttribute('radius-tubular', '0.02');
    ring.setAttribute('material', 'shader: flat; color: #ff6600; opacity: 0.5');
    ring.setAttribute('rotation', '90 0 0');
    ring.setAttribute('animation__spin', { property: 'rotation', from: '90 0 0', to: '90 360 0', dur: 500, loop: true, easing: 'linear' });
    el.appendChild(ring);

    el.setAttribute('target-hit', 'hp: 1; targetType: charger');
    el._targetType = 'charger';
    el._targetPoints = 15;
    el._targetCoins = 0;

    el.addEventListener('destroyed', (evt) => {
      const damage = evt?.detail?.damage || 1;
      const hitPos = evt?.detail?.position || null;
      this._onChargerKill(el);
      this._onTargetHit(el, damage, hitPos);
    });

    this._container.appendChild(el);
    this._targets.add(el);

    // Spatial hum
    const hum = audioManager.createTargetHum({ x, y, z }, 'charger');

    const charger = {
      el,
      pos: new THREE.Vector3(x, y, z),
      speed: 4,
      hum,
      spawnTime: Date.now(),
    };
    this._chargers.add(charger);
    audioManager.playSpawn({ x, y, z });
  }

  _updateChargers() {
    if (!this._running) return;
    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);
    camPos.y = 0.5; // ground level

    const dt = 0.05;
    const toRemove = [];

    this._chargers.forEach(c => {
      if (!c.el.parentNode) { toRemove.push(c); return; }

      // Move toward player
      const dir = new THREE.Vector3().subVectors(camPos, c.pos).normalize();
      c.pos.x += dir.x * c.speed * dt;
      c.pos.z += dir.z * c.speed * dt;
      c.el.setAttribute('position', `${c.pos.x} ${c.pos.y} ${c.pos.z}`);

      // Update hum position + volume (louder as closer)
      if (c.hum) {
        const dist = c.pos.distanceTo(camPos);
        const vol = Math.min(0.15, 0.02 + (1 - dist / 14) * 0.13);
        c.hum.update({ x: c.pos.x, y: c.pos.y, z: c.pos.z }, vol);
      }

      // Contact check (<1m from camera)
      const camWorldPos = new THREE.Vector3();
      cam.object3D.getWorldPosition(camWorldPos);
      if (c.pos.distanceTo(new THREE.Vector3(camWorldPos.x, 0.5, camWorldPos.z)) < 1.0) {
        toRemove.push(c);
        this._onChargerContact(c);
      }

      // Timeout after 8s
      if (Date.now() - c.spawnTime > 8000) {
        toRemove.push(c);
      }
    });

    toRemove.forEach(c => {
      this._chargers.delete(c);
      if (c.hum) c.hum.stop();
      this._targets.delete(c.el);
      if (c.el._expireTimeout) clearTimeout(c.el._expireTimeout);
      const hum = this._targetHums.get(c.el);
      if (hum) { hum.stop(); this._targetHums.delete(c.el); }
      if (c.el?.parentNode) {
        c.el.setAttribute('animation__fade', { property: 'material.opacity', to: 0, dur: 200 });
        setTimeout(() => { if (c.el.parentNode) c.el.parentNode.removeChild(c.el); }, 250);
      }
    });
  }

  _onChargerContact(charger) {
    const pos = { x: charger.pos.x, y: charger.pos.y, z: charger.pos.z };
    audioManager.playChargerExplode(pos);
    window.__hapticManager?.damageTaken();
    this._flashScreen('miss');
    this._onPlayerDamage?.('charger');

    // Explosion particles
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (scene) {
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('a-sphere');
        s.setAttribute('radius', '0.02');
        s.setAttribute('material', 'shader: flat; color: #ff4400; opacity: 0.8');
        s.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        const dx = (Math.random() - 0.5) * 2;
        const dy = Math.random() * 1.5;
        const dz = (Math.random() - 0.5) * 2;
        s.setAttribute('animation__burst', {
          property: 'position', to: `${pos.x + dx} ${pos.y + dy} ${pos.z + dz}`,
          dur: 300, easing: 'easeOutQuad',
        });
        s.setAttribute('animation__fade', { property: 'material.opacity', from: 0.8, to: 0, dur: 350 });
        scene.appendChild(s);
        setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 400);
      }

      // Flash light
      const fl = document.createElement('a-entity');
      fl.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
      fl.setAttribute('light', 'type: point; color: #ff4400; intensity: 2; distance: 5; decay: 2');
      fl.setAttribute('animation__dim', { property: 'light.intensity', from: 2, to: 0, dur: 200, easing: 'easeOutQuad' });
      scene.appendChild(fl);
      setTimeout(() => { if (fl.parentNode) fl.parentNode.removeChild(fl); }, 250);
    }
  }

  _onChargerKill(el) {
    // Remove from chargers set
    this._chargers.forEach(c => {
      if (c.el === el) {
        if (c.hum) c.hum.stop();
        this._chargers.delete(c);
      }
    });
  }

  // === TASK-253: Danger Zones ===

  _trySpawnDangerZone() {
    if (!this._running) return;
    const now = Date.now();
    const interval = this._bossMode ? 18000 : 25000;
    if (now - this._lastDangerZoneTime < interval) return;
    if (this._dangerZones.size >= 2) return;

    this._lastDangerZoneTime = now;
    this._spawnDangerZone();
  }

  _spawnDangerZone() {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    // Random position in arena
    const x = (Math.random() - 0.5) * 20;
    const z = (Math.random() - 0.5) * 20;
    const radius = 3 + Math.random() * 2;

    const el = document.createElement('a-entity');
    el.setAttribute('position', `${x} 0.07 ${z}`);

    // Warning outline ring (telegraph phase)
    const outline = document.createElement('a-ring');
    outline.setAttribute('rotation', '-90 0 0');
    outline.setAttribute('radius-inner', String(radius - 0.1));
    outline.setAttribute('radius-outer', String(radius));
    outline.setAttribute('material', 'shader: flat; color: #ff2222; opacity: 0; transparent: true');
    outline.setAttribute('animation__warn', {
      property: 'material.opacity', from: 0, to: 0.6,
      dur: 1500, easing: 'easeInQuad',
    });
    el.appendChild(outline);

    // Inner fill (activates after telegraph)
    const fill = document.createElement('a-circle');
    fill.setAttribute('rotation', '-90 0 0');
    fill.setAttribute('radius', String(radius));
    fill.setAttribute('material', 'shader: flat; color: #ff0000; opacity: 0; transparent: true');
    fill._activatable = true;
    el.appendChild(fill);

    scene.appendChild(el);
    audioManager.playDangerZoneWarn({ x, y: 0.1, z });

    const zone = {
      el, x, z, radius, fill,
      active: false,
      activateTime: Date.now() + 2000,
      expireTime: Date.now() + 2000 + 9000,
      lastDamageTick: 0,
    };
    this._dangerZones.add(zone);

    // Activate after 2s telegraph
    setTimeout(() => {
      if (!this._running || !el.parentNode) return;
      zone.active = true;
      fill.setAttribute('animation__activate', {
        property: 'material.opacity', from: 0, to: 0.15,
        dur: 300, easing: 'easeOutQuad',
      });
      fill.setAttribute('animation__pulse', {
        property: 'material.opacity', from: 0.08, to: 0.2,
        dur: 800, loop: true, dir: 'alternate', easing: 'easeInOutSine',
      });

      // Rising ember particles
      this._spawnDangerEmbers(scene, x, z, radius, zone);
    }, 2000);
  }

  _spawnDangerEmbers(scene, cx, cz, radius, zone) {
    const emberInterval = setInterval(() => {
      if (!this._running || !zone.active || !zone.el.parentNode) {
        clearInterval(emberInterval);
        return;
      }
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const ex = cx + Math.cos(angle) * dist;
      const ez = cz + Math.sin(angle) * dist;
      const ember = document.createElement('a-sphere');
      ember.setAttribute('radius', '0.01');
      ember.setAttribute('material', 'shader: flat; color: #ff4400; opacity: 0.6');
      ember.setAttribute('position', `${ex} 0.1 ${ez}`);
      ember.setAttribute('animation__rise', {
        property: 'position', to: `${ex} ${0.5 + Math.random() * 0.5} ${ez}`,
        dur: 600, easing: 'easeOutQuad',
      });
      ember.setAttribute('animation__fade', {
        property: 'material.opacity', from: 0.6, to: 0, dur: 600,
      });
      scene.appendChild(ember);
      setTimeout(() => { if (ember.parentNode) ember.parentNode.removeChild(ember); }, 650);
    }, 200);
    zone._emberInterval = emberInterval;
  }

  _updateDangerZones() {
    if (!this._running) return;

    const rig = document.getElementById('player-rig');
    if (!rig) return;
    const rigPos = rig.object3D.position;
    const now = Date.now();

    const toRemove = [];

    this._dangerZones.forEach(zone => {
      // Expire check
      if (now > zone.expireTime) {
        toRemove.push(zone);
        return;
      }

      if (!zone.active) return;

      // Distance check (2D XZ plane)
      const dx = rigPos.x - zone.x;
      const dz = rigPos.z - zone.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < zone.radius && now - zone.lastDamageTick > 1000) {
        zone.lastDamageTick = now;
        audioManager.playDangerZoneTick();
        window.__hapticManager?.pulse(0.3, 50);
        this._onPlayerDamage?.('dangerZone');
        this._flashScreen('miss');
      }
    });

    toRemove.forEach(zone => {
      this._dangerZones.delete(zone);
      if (zone._emberInterval) clearInterval(zone._emberInterval);
      if (zone.el?.parentNode) {
        zone.el.setAttribute('animation__fadeout', {
          property: 'scale', to: '0 0 0', dur: 500, easing: 'easeInQuad',
        });
        setTimeout(() => { if (zone.el.parentNode) zone.el.parentNode.removeChild(zone.el); }, 550);
      }
    });
  }

  // === TASK-255: Scare Balls — Dodge Reflex ===

  _tryLaunchScareBall() {
    if (!this._running) return;
    const now = Date.now();
    // Interval scales with combo: base 15-25s, at combo 15+ → 12-18s
    const combo = this._combo;
    const minInterval = combo >= 15 ? 12000 : 15000;
    const maxInterval = combo >= 15 ? 18000 : 25000;
    const interval = this._scareBallInterval || (minInterval + Math.random() * (maxInterval - minInterval));
    if (now - this._lastScareBallTime < interval) return;
    if (this._scareBalls.size >= 2) return;

    this._lastScareBallTime = now;
    this._scareBallInterval = minInterval + Math.random() * (maxInterval - minInterval);
    this._launchScareBall();
  }

  _launchScareBall() {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;
    const cam = document.getElementById('camera');
    if (!cam) return;

    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);

    // Pick random arena edge
    const edge = Math.floor(Math.random() * 4);
    let sx, sz;
    switch (edge) {
      case 0: sx = -14; sz = (Math.random() - 0.5) * 26; break; // left
      case 1: sx = 14;  sz = (Math.random() - 0.5) * 26; break; // right
      case 2: sx = (Math.random() - 0.5) * 26; sz = -14; break; // front
      default: sx = (Math.random() - 0.5) * 26; sz = 14; break;  // back
    }
    const sy = camPos.y + 0.1; // aim at face height

    // Direction toward player face
    const dir = new THREE.Vector3(camPos.x - sx, camPos.y + 0.1 - sy, camPos.z - sz).normalize();
    const speed = 8 + Math.random() * 2; // 8-10 units/s
    const radius = 0.15 + Math.random() * 0.1; // 0.15-0.25

    // Neon colors
    const neonColors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff88', '#ff4488'];
    const color = neonColors[Math.floor(Math.random() * neonColors.length)];

    // Audio whoosh telegraph (0.3s before visual arrives — play from origin)
    audioManager.playScareWhoosh({ x: sx, y: sy, z: sz });

    // Create ball after short delay (0.3s whoosh)
    setTimeout(() => {
      if (!this._running) return;

      const el = document.createElement('a-sphere');
      el.setAttribute('radius', String(radius));
      el.setAttribute('position', `${sx} ${sy} ${sz}`);
      el.setAttribute('material', `shader: flat; color: ${color}; opacity: 0.9; transparent: true`);
      el.setAttribute('shadow', 'cast: false; receive: false');

      // Glow light on ball
      const light = document.createElement('a-entity');
      light.setAttribute('light', `type: point; color: ${color}; intensity: 1.5; distance: 3; decay: 2`);
      el.appendChild(light);

      // Comet tail: 3 trailing spheres
      for (let i = 1; i <= 3; i++) {
        const tail = document.createElement('a-sphere');
        tail.setAttribute('radius', String(radius * (1 - i * 0.25)));
        tail.setAttribute('material', `shader: flat; color: ${color}; opacity: ${0.5 - i * 0.12}; transparent: true`);
        tail.setAttribute('position', `${-dir.x * i * 0.25} ${-dir.y * i * 0.25} ${-dir.z * i * 0.25}`);
        el.appendChild(tail);
      }

      scene.appendChild(el);

      const ball = {
        el,
        pos: new THREE.Vector3(sx, sy, sz),
        dir,
        speed,
        spawnTime: Date.now(),
        nearMissTriggered: false,
      };
      this._scareBalls.add(ball);
    }, 300);
  }

  _updateScareBalls() {
    if (!this._running) return;
    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);

    const dt = 0.03; // 30ms tick
    const toRemove = [];

    this._scareBalls.forEach(b => {
      b.pos.x += b.dir.x * b.speed * dt;
      b.pos.y += b.dir.y * b.speed * dt;
      b.pos.z += b.dir.z * b.speed * dt;
      b.el.setAttribute('position', `${b.pos.x} ${b.pos.y} ${b.pos.z}`);

      const dist = b.pos.distanceTo(camPos);

      // Hit check: ball hits player head (< 0.3m)
      if (dist < 0.3) {
        toRemove.push(b);
        this._onScareBallHit(b);
        return;
      }

      // Near-miss: passed close (< 0.5m) but moving away
      if (!b.nearMissTriggered && dist < 0.5) {
        // Check if ball is moving away (dot product of dir and ball→cam is negative)
        const toCam = new THREE.Vector3().subVectors(camPos, b.pos);
        if (toCam.dot(b.dir) < 0) {
          b.nearMissTriggered = true;
          this._onScareBallDodge(b);
        }
      }

      // Auto-remove after 2s or if far away
      if (Date.now() - b.spawnTime > 2000 || dist > 20) {
        toRemove.push(b);
      }
    });

    toRemove.forEach(b => {
      this._scareBalls.delete(b);
      if (b.el?.parentNode) {
        b.el.setAttribute('animation__fade', { property: 'material.opacity', to: 0, dur: 100 });
        setTimeout(() => { if (b.el.parentNode) b.el.parentNode.removeChild(b.el); }, 150);
      }
    });
  }

  _onScareBallHit(ball) {
    // Screen flash white (scare effect, no damage)
    const overlay = document.getElementById('transition');
    if (overlay) {
      overlay.style.background = 'rgba(255,255,255,0.6)';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => { overlay.style.opacity = '0'; }, 150);
      setTimeout(() => { overlay.style.background = ''; }, 300);
    }

    // Strong haptic burst
    window.__hapticManager?.pulse(0.8, 100);

    // Camera shake
    document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.015, duration: 150 } }));
  }

  _onScareBallDodge(ball) {
    // "DODGE!" popup + bonus points via event
    const pos = { x: ball.pos.x, y: ball.pos.y, z: ball.pos.z };
    document.dispatchEvent(new CustomEvent('scare-dodge', { detail: { pos, points: 3 } }));

    // Light haptic feedback
    window.__hapticManager?.pulse(0.3, 40);
  }

  // === TASK-256: Punch Targets — Melee Strike ===

  _spawnMeleeTarget() {
    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);
    const camDir = new THREE.Vector3();
    cam.object3D.getWorldDirection(camDir);

    // Spawn 1.0-1.5m in front of player
    const dist = 1.0 + Math.random() * 0.5;
    const angleOffset = (Math.random() - 0.5) * 0.8; // ±~23° spread
    const spawnDir = camDir.clone();
    spawnDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleOffset);

    const x = camPos.x + spawnDir.x * dist;
    const y = camPos.y + (Math.random() - 0.5) * 0.4; // near head height
    const z = camPos.z + spawnDir.z * dist;

    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    const el = document.createElement('a-entity');
    el.setAttribute('class', 'target');
    el.setAttribute('geometry', 'primitive: icosahedron; radius: 0.45');
    el.setAttribute('material', 'color: #ff8800; metalness: 0.8; roughness: 0.2; emissive: #ff6600; emissiveIntensity: 0.8');
    el.setAttribute('position', `${x} ${y} ${z}`);
    el.setAttribute('shadow', 'cast: true; receive: false');
    el.setAttribute('animation__spawn', {
      property: 'scale', from: '0 0 0', to: '1.5 1.5 1.5',
      dur: 300, easing: 'easeOutElastic',
    });
    el.setAttribute('animation__pulse', {
      property: 'material.emissiveIntensity', from: 0.5, to: 1.2,
      dur: 400, loop: true, dir: 'alternate', easing: 'easeInOutSine',
    });

    // Orange energy ring
    const ring = document.createElement('a-torus');
    ring.setAttribute('radius', '0.55');
    ring.setAttribute('radius-tubular', '0.02');
    ring.setAttribute('material', 'shader: flat; color: #ff8800; opacity: 0.5; transparent: true');
    ring.setAttribute('animation__spin', { property: 'rotation', to: '0 360 0', dur: 600, loop: true, easing: 'linear' });
    el.appendChild(ring);

    // Second ring perpendicular
    const ring2 = document.createElement('a-torus');
    ring2.setAttribute('radius', '0.5');
    ring2.setAttribute('radius-tubular', '0.015');
    ring2.setAttribute('rotation', '90 0 0');
    ring2.setAttribute('material', 'shader: flat; color: #ffaa44; opacity: 0.3; transparent: true');
    ring2.setAttribute('animation__spin', { property: 'rotation', from: '90 0 0', to: '90 360 0', dur: 800, loop: true, easing: 'linear' });
    el.appendChild(ring2);

    el.setAttribute('target-hit', 'hp: 1; targetType: standard');
    el._targetType = 'standard';
    el._targetPoints = 20; // 2× base
    el._targetCoins = 0;
    el._isMelee = true;

    el.addEventListener('destroyed', (evt) => {
      // Melee targets ignore raycaster hits — this only fires from punch
      const damage = evt?.detail?.damage || 1;
      const hitPos = evt?.detail?.position || null;
      this._onTargetHit(el, damage, hitPos);
    });

    const lifetime = 4000;
    const expireTimeout = setTimeout(() => {
      if (this._targets.has(el)) this._removeTarget(el, true);
    }, lifetime);
    el._expireTimeout = expireTimeout;

    this._container.appendChild(el);
    this._targets.add(el);
    audioManager.playSpawn({ x, y, z });
  }

  _updatePunchDetection() {
    if (!this._running) return;
    const dt = 0.03;

    // Track both controllers
    ['right', 'left'].forEach(hand => {
      const handEl = document.getElementById(`${hand}-hand`);
      if (!handEl?.object3D) return;

      const pos = new THREE.Vector3();
      handEl.object3D.getWorldPosition(pos);
      const prev = this._lastControllerPos[hand];

      if (prev) {
        const velocity = pos.distanceTo(prev) / dt;
        this._controllerVelocity[hand] = velocity;

        // Check for punch hit on melee targets
        if (velocity > 2.0) {
          this._targets.forEach(el => {
            if (!el._isMelee || !el.parentNode || !el.object3D) return;
            const tPos = el.object3D.getWorldPosition(new THREE.Vector3());
            if (pos.distanceTo(tPos) < 0.5) {
              // Punch hit!
              this._onPunchHit(el, pos, hand);
            }
          });
        }
      }

      this._lastControllerPos[hand] = pos.clone();
    });
  }

  _onPunchHit(el, hitPos, hand) {
    const pos = { x: hitPos.x, y: hitPos.y, z: hitPos.z };
    audioManager.playPunchImpact(pos);
    window.__hapticManager?.pulse(0.9, 120);

    // Shatter particles
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (scene) {
      for (let i = 0; i < 8; i++) {
        const s = document.createElement('a-icosahedron');
        s.setAttribute('radius', '0.02');
        s.setAttribute('material', 'shader: flat; color: #ff8800; opacity: 0.8');
        s.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
        const dx = (Math.random() - 0.5) * 2;
        const dy = (Math.random() - 0.5) * 2;
        const dz = (Math.random() - 0.5) * 2;
        s.setAttribute('animation__burst', {
          property: 'position', to: `${pos.x + dx} ${pos.y + dy} ${pos.z + dz}`,
          dur: 250, easing: 'easeOutQuad',
        });
        s.setAttribute('animation__fade', { property: 'material.opacity', from: 0.8, to: 0, dur: 300 });
        s.setAttribute('animation__spin', { property: 'rotation', to: `${Math.random()*360} ${Math.random()*360} 0`, dur: 300 });
        scene.appendChild(s);
        setTimeout(() => { if (s.parentNode) s.parentNode.removeChild(s); }, 350);
      }
    }

    // Camera shake
    document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.02, duration: 100 } }));

    // Dispatch punch-hit event for score tracking
    document.dispatchEvent(new CustomEvent('punch-hit', { detail: { pos, points: 20 } }));

    // Trigger target destruction
    el.dispatchEvent(new CustomEvent('destroyed', { detail: { damage: 1, position: pos } }));
    if (el.parentNode) el.parentNode.removeChild(el);
  }

  // === TASK-257: Rhythm Targets — Beat-Sync Shooting ===

  _updateRhythmBeat() {
    if (!this._running) return;

    // Activate rhythm mode at combo ≥ 10
    const shouldBeRhythm = this._combo >= 10;
    if (shouldBeRhythm !== this._rhythmMode) {
      this._rhythmMode = shouldBeRhythm;
    }

    if (!this._rhythmMode) return;

    // BPM scales with music intensity
    this._bpm = this._combo >= 15 ? 140 : 120;
    const beatDuration = 60000 / this._bpm;
    const now = Date.now();

    if (now - this._lastBeatTime >= beatDuration) {
      this._lastBeatTime = now;
      this._beatPhase = 0;
      document.dispatchEvent(new CustomEvent('music-beat'));
    } else {
      this._beatPhase = (now - this._lastBeatTime) / beatDuration;
    }
  }

  // === TASK-258: Wall Lean — Dodge Laser Sweeps ===

  _tryLaunchLaserSweep() {
    if (!this._running) return;
    const now = Date.now();
    const interval = this._bossMode ? 18000 : (25000 - Math.min(this._wave, 20) * 250);
    if (now - this._lastLaserSweepTime < interval) return;
    if (this._laserSweeps.size >= 1) return;

    this._lastLaserSweepTime = now;
    this._launchLaserSweep();
  }

  _launchLaserSweep() {
    const scene = this._container.sceneEl || this._container.closest('a-scene');
    if (!scene) return;

    // Pick variant: 50% head-height (must duck), 50% body-height (must lean)
    const isHeadHeight = Math.random() < 0.5;
    const laserY = isHeadHeight
      ? 1.4 + Math.random() * 0.3  // 1.4-1.7
      : 0.8 + Math.random() * 0.3; // 0.8-1.1

    const sweepDuration = 2500 + Math.random() * 500; // 2.5-3s
    const startX = -15;
    const endX = 15;

    // Telegraph: warning line for 2s
    const warnEl = document.createElement('a-box');
    warnEl.setAttribute('width', '30');
    warnEl.setAttribute('height', '0.02');
    warnEl.setAttribute('depth', '0.02');
    warnEl.setAttribute('position', `0 ${laserY} 0`);
    warnEl.setAttribute('material', 'shader: flat; color: #ff2222; opacity: 0; transparent: true');
    warnEl.setAttribute('animation__warn', {
      property: 'material.opacity', from: 0, to: 0.3,
      dur: 1500, loop: true, dir: 'alternate', easing: 'easeInOutSine',
    });
    scene.appendChild(warnEl);
    audioManager.playLaserWarn();

    setTimeout(() => {
      if (warnEl.parentNode) warnEl.parentNode.removeChild(warnEl);
      if (!this._running) return;

      // Launch actual laser beam
      const el = document.createElement('a-box');
      el.setAttribute('width', '30');
      el.setAttribute('height', '0.05');
      el.setAttribute('depth', '0.05');
      el.setAttribute('position', `${startX} ${laserY} 0`);
      el.setAttribute('material', 'shader: flat; color: #ff0000; opacity: 0.8; transparent: true; emissive: #ff0000; emissiveIntensity: 2');
      el.setAttribute('shadow', 'cast: false; receive: false');

      // Glow light
      const light = document.createElement('a-entity');
      light.setAttribute('light', 'type: point; color: #ff0000; intensity: 1.5; distance: 4; decay: 2');
      el.appendChild(light);

      el.setAttribute('animation__sweep', {
        property: 'position',
        from: `${startX} ${laserY} 0`,
        to: `${endX} ${laserY} 0`,
        dur: sweepDuration,
        easing: 'linear',
      });

      scene.appendChild(el);
      audioManager.playLaserSweep();

      const sweep = {
        el,
        laserY,
        isHeadHeight,
        startX,
        endX,
        startTime: Date.now(),
        duration: sweepDuration,
        hit: false,
        dodged: false,
      };
      this._laserSweeps.add(sweep);

      // Auto-remove after sweep + buffer
      setTimeout(() => {
        this._laserSweeps.delete(sweep);
        if (el.parentNode) el.parentNode.removeChild(el);
      }, sweepDuration + 200);
    }, 2000);
  }

  _updateLaserSweeps() {
    if (!this._running) return;
    const cam = document.getElementById('camera');
    if (!cam) return;
    const camPos = new THREE.Vector3();
    cam.object3D.getWorldPosition(camPos);

    this._laserSweeps.forEach(sweep => {
      if (sweep.hit || sweep.dodged) return;

      const elapsed = Date.now() - sweep.startTime;
      const progress = elapsed / sweep.duration;
      if (progress > 1) return;

      // Current laser X position
      const laserX = sweep.startX + (sweep.endX - sweep.startX) * progress;

      // Check if laser is near player X position (±1.5m window passing through)
      if (Math.abs(laserX - camPos.x) > 1.5) return;

      // Laser is passing through player area — check dodge
      if (sweep.isHeadHeight) {
        // Must duck: dodge if camera Y < laser Y - 0.3
        if (camPos.y < sweep.laserY - 0.3) {
          sweep.dodged = true;
          this._onLaserDodge(sweep);
        } else if (Math.abs(camPos.y - sweep.laserY) < 0.3) {
          sweep.hit = true;
          this._onLaserHit(sweep);
        }
      } else {
        // Body-height: dodge if leaned sideways (|camX - 0| > 0.4 from center)
        // Use camera X relative to player rig center
        const rig = document.getElementById('player-rig');
        const rigX = rig ? rig.object3D.position.x : 0;
        const lean = Math.abs(camPos.x - rigX);
        if (lean > 0.4) {
          sweep.dodged = true;
          this._onLaserDodge(sweep);
        } else if (camPos.y < sweep.laserY - 0.3) {
          // Can also duck under body-height laser
          sweep.dodged = true;
          this._onLaserDodge(sweep);
        } else if (Math.abs(camPos.y - sweep.laserY) < 0.3 && lean < 0.3) {
          sweep.hit = true;
          this._onLaserHit(sweep);
        }
      }
    });
  }

  _onLaserHit(sweep) {
    audioManager.playLaserHit();
    window.__hapticManager?.damageTaken();
    this._flashScreen('miss');
    this._onPlayerDamage?.('laser');
    document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.02, duration: 200 } }));
  }

  _onLaserDodge(sweep) {
    const pos = { x: 0, y: sweep.laserY, z: -2 };
    document.dispatchEvent(new CustomEvent('laser-dodge', { detail: { pos, points: 5 } }));
    window.__hapticManager?.pulse(0.3, 40);

    // Brief slow-mo reward
    document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: true } }));
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('slow-motion', { detail: { active: false } }));
    }, 200);
  }

  // Also: heavy/boss targets fire projectiles periodically
  _checkProjectileFiring() {
    if (!this._running || this._projectiles.size >= 3) return;
    const now = Date.now();
    if (now - this._lastProjectileTime < 4000) return;

    // Find a heavy or boss target to fire from
    for (const el of this._targets) {
      if (el._targetType === 'heavy' || this._bossMode) {
        if (el.parentNode && el.object3D) {
          this._tryFireProjectile(el);
          break;
        }
      }
    }
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
