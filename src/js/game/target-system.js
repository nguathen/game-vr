import scoreManager from './score-manager.js';
import audioManager from '../core/audio-manager.js';

const BASE_POINTS = 10;
const SPAWN_INTERVAL_MS = 1500;
const MAX_TARGETS = 8;
const TARGET_LIFETIME_MS = 5000;
const ARENA = { x: 12, yMin: 1, yMax: 4, zMin: -14, zMax: -3 };
const COLORS = ['#e94560', '#ff6b6b', '#ffa502', '#2ed573', '#1e90ff', '#a855f7', '#ff69b4'];

class TargetSystem {
  constructor(containerEl) {
    this._container = containerEl;
    this._targets = new Set();
    this._spawnTimer = null;
    this._running = false;
    this._combo = 0;
    this._comboTimer = null;
    this._onComboChange = null;
  }

  set onComboChange(fn) { this._onComboChange = fn; }

  start() {
    this._running = true;
    this._combo = 0;
    this._clearAll();
    this._spawnTimer = setInterval(() => this._trySpawn(), SPAWN_INTERVAL_MS);
    // Spawn a few immediately
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
    if (!this._running || this._targets.size >= MAX_TARGETS) return;
    this._spawnTarget();
  }

  _spawnTarget() {
    const el = document.createElement('a-sphere');
    el.setAttribute('class', 'target');
    el.setAttribute('radius', '0.3');
    el.setAttribute('material', `shader: flat; color: ${this._randomColor()}`);
    el.setAttribute('target-hit', '');

    const x = this._rand(-ARENA.x, ARENA.x);
    const y = this._rand(ARENA.yMin, ARENA.yMax);
    const z = this._rand(ARENA.zMin, ARENA.zMax);
    el.setAttribute('position', `${x} ${y} ${z}`);

    // Spawn animation
    el.setAttribute('animation__spawn', {
      property: 'scale', from: '0 0 0', to: '1 1 1',
      dur: 300, easing: 'easeOutElastic',
    });

    // Idle float
    el.setAttribute('animation__float', {
      property: 'position',
      to: `${x} ${y + 0.3} ${z}`,
      dur: 1200 + Math.random() * 600,
      easing: 'easeInOutSine', loop: true, dir: 'alternate',
    });

    // Handle hit (from target-hit component)
    el.addEventListener('destroyed', () => this._onTargetHit(el));

    // Auto-expire
    const expireTimeout = setTimeout(() => {
      if (this._targets.has(el)) {
        this._removeTarget(el, true);
      }
    }, TARGET_LIFETIME_MS);
    el._expireTimeout = expireTimeout;

    this._container.appendChild(el);
    this._targets.add(el);
    audioManager.playSpawn();
  }

  _onTargetHit(el) {
    if (!this._running) return;

    // Combo
    this._combo++;
    if (this._comboTimer) clearTimeout(this._comboTimer);
    this._comboTimer = setTimeout(() => {
      this._combo = 0;
      this._onComboChange?.(0);
    }, 2000);

    const multiplier = Math.min(this._combo, 5);
    const points = BASE_POINTS * multiplier;
    scoreManager.add(points);
    this._onComboChange?.(this._combo);

    // Audio
    audioManager.playHit();
    if (this._combo >= 2) audioManager.playCombo(this._combo);

    this._targets.delete(el);
    if (el._expireTimeout) clearTimeout(el._expireTimeout);
  }

  _removeTarget(el, expired = false) {
    this._targets.delete(el);
    if (el._expireTimeout) clearTimeout(el._expireTimeout);

    if (expired) {
      // Missed — reset combo
      this._combo = 0;
      this._onComboChange?.(0);
      audioManager.playMiss();

      // Fade out
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
