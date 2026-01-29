import scoreManager from './score-manager.js';
import audioManager from '../core/audio-manager.js';
import authManager from '../core/auth-manager.js';
import { getSettings } from './settings-util.js';

const BASE_POINTS = 10;
const ARENA = { x: 12, yMin: 1, yMax: 4, zMin: -14, zMax: -3 };
const COLORS = ['#e94560', '#ff6b6b', '#ffa502', '#2ed573', '#1e90ff', '#a855f7', '#ff69b4'];

const TARGET_TYPES = {
  standard:  { weight: 50, points: 10, radius: 0.3,  geometry: 'a-sphere', color: null, hp: 1, speed: 0, lifetime: null, coins: 0 },
  speed:     { weight: 20, points: 25, radius: 0.22, geometry: 'a-sphere', color: '#ffdd00', hp: 1, speed: 2.5, lifetime: null, coins: 0 },
  heavy:     { weight: 15, points: 30, radius: 0.4,  geometry: 'a-box', color: '#ff3333', hp: 2, speed: 0, lifetime: null, coins: 0 },
  bonus:     { weight: 8,  points: 50, radius: 0.25, geometry: 'a-sphere', color: '#ffd700', hp: 1, speed: 0, lifetime: 2000, coins: 5 },
  decoy:     { weight: 7,  points: -10, radius: 0.3, geometry: 'a-sphere', color: '#882222', hp: 1, speed: 0, lifetime: null, coins: 0 },
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
    this._clearAll();
  }

  _trySpawn() {
    if (!this._running || this._targets.size >= this._maxTargets) return;
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

    const el = document.createElement(type.geometry);
    el.setAttribute('class', 'target');
    if (type.geometry === 'a-box') {
      const s = type.radius * 2;
      el.setAttribute('width', String(s));
      el.setAttribute('height', String(s));
      el.setAttribute('depth', String(s));
    } else {
      el.setAttribute('radius', String(type.radius));
    }

    const color = type.color || this._randomColor();
    el.setAttribute('material', `shader: flat; color: ${color}`);

    const hp = this._bossMode ? type.hp + Math.floor(this._wave / 3) : type.hp;
    el.setAttribute('target-hit', `hp: ${hp}; targetType: ${typeId}`);

    const x = this._rand(-ARENA.x, ARENA.x);
    const y = this._rand(ARENA.yMin, ARENA.yMax);
    const z = this._rand(ARENA.zMin, ARENA.zMax);
    el.setAttribute('position', `${x} ${y} ${z}`);

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
    audioManager.playSpawn();
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

      const multiplier = Math.min(this._combo, 5);
      const points = basePoints * multiplier * damage;
      scoreManager.add(points);
      this._onComboChange?.(this._combo);

      audioManager.playHit();
      if (this._combo >= 2) audioManager.playCombo(this._combo);

      // Damage number
      const comboText = multiplier > 1 ? ` x${multiplier}` : '';
      const color = el._targetType === 'bonus' ? '#ffd700' : multiplier > 1 ? '#00d4ff' : '#ffffff';
      this._spawnDamageNumber(pos, points, color, comboText);
      this._flashScreen('hit');

      // Bonus coins
      if (el._targetCoins > 0) {
        this._coinsEarned += el._targetCoins;
        const profile = authManager.profile;
        if (profile) {
          authManager.saveProfile({ coins: (profile.coins || 0) + el._targetCoins });
        }
      }
    }

    this._targets.delete(el);
    if (el._expireTimeout) clearTimeout(el._expireTimeout);
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

  _randomColor() {
    return COLORS[Math.floor(Math.random() * COLORS.length)];
  }

  _rand(min, max) {
    return Math.random() * (max - min) + min;
  }
}

export { TargetSystem };
export default TargetSystem;
