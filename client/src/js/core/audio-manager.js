/**
 * Audio manager using Web Audio API.
 * Generates procedural sound effects (no external files needed).
 */
class AudioManager {
  constructor() {
    this._ctx = null;
    this._enabled = true;
    this._volume = 0.8;
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem('vr_quest_player_v2');
      if (raw) {
        const profile = JSON.parse(raw);
        const s = profile.settings || {};
        this._enabled = s.sfx !== false;
        this._volume = (s.volume !== undefined ? s.volume : 80) / 100;
      }
    } catch (e) { /* ignore */ }
  }

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.connect(this._ctx.destination);
      this._masterGain.gain.value = this._volume;
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
    this._masterGain.gain.value = this._volume;
    return this._ctx;
  }

  get destination() {
    return this._masterGain || this._ctx?.destination;
  }

  _pitchVar() {
    return 0.9 + Math.random() * 0.2;
  }

  /**
   * Create a PannerNode for 3D positional audio.
   * @param {{x:number,y:number,z:number}} pos - world position
   */
  _createPanner(pos) {
    const ctx = this._getCtx();
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 2;
    panner.maxDistance = 30;
    panner.rolloffFactor = 1.5;
    panner.setPosition(pos.x || 0, pos.y || 0, pos.z || 0);
    panner.connect(this.destination);
    return panner;
  }

  /** Update listener position from camera. Call from game tick. */
  updateListener(pos, fwd, up) {
    const ctx = this._getCtx();
    const l = ctx.listener;
    if (l.positionX) {
      l.positionX.value = pos.x;
      l.positionY.value = pos.y;
      l.positionZ.value = pos.z;
      l.forwardX.value = fwd.x;
      l.forwardY.value = fwd.y;
      l.forwardZ.value = fwd.z;
      l.upX.value = up.x;
      l.upY.value = up.y;
      l.upZ.value = up.z;
    } else {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    }
  }

  playHit(pos) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;
    const pv = this._pitchVar();
    const dest = pos ? this._createPanner(pos) : this.destination;

    // Short bright "ping"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * pv, now);
    osc.frequency.exponentialRampToValueAtTime(1760 * pv, now + 0.05);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playCombo(level) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Higher pitch for higher combo
    const baseFreq = 660 + level * 110;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playMiss() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Low "bwop" for miss/expire
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playSpawn(pos) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;
    const dest = pos ? this._createPanner(pos) : this.destination;

    // Soft "pop"
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(dest);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playGameOver() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Descending tones
    [440, 370, 330, 262].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.2;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playCountdown() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(440, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playGo() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playWeaponFire(type) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;
    const pv = this._pitchVar();

    if (type === 'shotgun') {
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.4;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      noise.connect(gain).connect(this.destination);
      noise.start(now);
    } else if (type === 'sniper') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1200 * pv, now);
      osc.frequency.exponentialRampToValueAtTime(200 * pv, now + 0.15);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain).connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600 * pv, now);
      osc.frequency.exponentialRampToValueAtTime(200 * pv, now + 0.06);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain).connect(this.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  }

  playLevelUp() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.12;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  playLifeLost() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  playAchievement() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    [784, 988, 1175, 1318].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playComboSound(comboCount) {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;
    const baseFreq = 440 + Math.min(comboCount, 10) * 80;

    for (let i = 0; i < Math.min(comboCount, 4); i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.06;
      osc.frequency.setValueAtTime(baseFreq + i * 110, t);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  playCountdownBeep() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playSlowMoHit() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Deep reverb impact
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.5);

    // Shimmer overtone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1200, now);
    osc2.frequency.exponentialRampToValueAtTime(600, now + 0.3);
    gain2.gain.setValueAtTime(0.06, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2).connect(this.destination);
    osc2.start(now);
    osc2.stop(now + 0.35);
  }

  playPowerUp() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Bright ascending chime
    [880, 1100, 1320, 1760].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.06;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  playPowerUpEnd() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Subtle descending fade
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.25);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playBossSpawn() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Deep rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.5);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  playBossHit() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Metallic clang: high + low
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(1400, now);
    osc1.frequency.exponentialRampToValueAtTime(800, now + 0.06);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc1.connect(gain1).connect(this.destination);
    osc1.start(now);
    osc1.stop(now + 0.1);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(200, now);
    gain2.gain.setValueAtTime(0.2, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc2.connect(gain2).connect(this.destination);
    osc2.start(now);
    osc2.stop(now + 0.12);
  }

  playBossKill() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Explosion: noise burst
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.25, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    noise.connect(nGain).connect(this.destination);
    noise.start(now);

    // Ascending chime
    [440, 660, 880, 1100].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + 0.1 + i * 0.08;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  playWaveClear() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    // Triumphant fanfare
    [523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain).connect(this.destination);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  playSelect() {
    if (!this._enabled) return;
    const ctx = this._getCtx();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(660, now);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain).connect(this.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const audioManager = new AudioManager();
export { audioManager };
export default audioManager;
