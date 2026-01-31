import audioManager from './audio-manager.js';

const MUSIC_PROFILES = {
  cyber: {
    bassFreq: 40, bassType: 'sine',
    padFreq: 220, padFilter: 400,
    tempo: 0.5,
    arpNotes: [330, 440, 550, 660],
  },
  sunset: {
    bassFreq: 55, bassType: 'triangle',
    padFreq: 165, padFilter: 300,
    tempo: 0.4,
    arpNotes: [262, 330, 392, 440],
  },
  space: {
    bassFreq: 30, bassType: 'sine',
    padFreq: 110, padFilter: 250,
    tempo: 0.3,
    arpNotes: [880, 1047, 1175, 1319],
  },
  neon: {
    bassFreq: 80, bassType: 'square',
    padFreq: 330, padFilter: 600,
    tempo: 0.7,
    arpNotes: [523, 659, 784, 880],
  },
  day: {
    bassFreq: 50, bassType: 'triangle',
    padFreq: 196, padFilter: 350,
    tempo: 0.45,
    arpNotes: [294, 370, 440, 523],
  },
};

class MusicManager {
  constructor() {
    this._nodes = [];
    this._intervals = [];
    this._playing = false;
    this._enabled = true;
  }

  loadSettings() {
    try {
      const raw = localStorage.getItem('vr_quest_player_v2');
      if (raw) {
        const profile = JSON.parse(raw);
        const s = profile.settings || {};
        this._enabled = s.music !== false;
      }
    } catch (e) { /* ignore */ }
  }

  startMusic(themeId) {
    if (!this._enabled) return;
    this.stopMusic();

    const ctx = audioManager._getCtx();
    if (!ctx) return;
    const dest = audioManager.destination;
    if (!dest) return;

    const profile = MUSIC_PROFILES[themeId] || MUSIC_PROFILES.cyber;
    this._playing = true;

    // Master gain for music (quieter than SFX)
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(dest);
    // Fade in
    masterGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 2);
    this._nodes.push(masterGain);
    this._masterGain = masterGain;

    // Bass drone
    const bass = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bass.type = profile.bassType;
    bass.frequency.value = profile.bassFreq;
    bassGain.gain.value = 0.4;
    bass.connect(bassGain).connect(masterGain);
    bass.start();
    this._nodes.push(bass, bassGain);

    // Rhythmic bass pulse
    const pulseInterval = setInterval(() => {
      if (!this._playing) return;
      bassGain.gain.setValueAtTime(0.4, ctx.currentTime);
      bassGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + (1 / profile.tempo));
      bassGain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + (2 / profile.tempo));
    }, (2 / profile.tempo) * 1000);
    this._intervals.push(pulseInterval);

    // Pad layer (filtered noise)
    const padOsc = ctx.createOscillator();
    const padGain = ctx.createGain();
    const padFilter = ctx.createBiquadFilter();
    padOsc.type = 'sawtooth';
    padOsc.frequency.value = profile.padFreq;
    padFilter.type = 'lowpass';
    padFilter.frequency.value = profile.padFilter;
    padFilter.Q.value = 2;
    padGain.gain.value = 0.1;
    padOsc.connect(padFilter).connect(padGain).connect(masterGain);
    padOsc.start();
    this._nodes.push(padOsc, padGain, padFilter);

    // Slow pad modulation
    const padModInterval = setInterval(() => {
      if (!this._playing) return;
      const f = profile.padFreq * (0.9 + Math.random() * 0.2);
      padOsc.frequency.linearRampToValueAtTime(f, ctx.currentTime + 2);
    }, 4000);
    this._intervals.push(padModInterval);

    // Arp pings (sparse melodic pings)
    const arpInterval = setInterval(() => {
      if (!this._playing) return;
      const note = profile.arpNotes[Math.floor(Math.random() * profile.arpNotes.length)];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
      osc.connect(gain).connect(masterGain);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    }, (3 / profile.tempo) * 1000);
    this._intervals.push(arpInterval);
  }

  setPlaybackRate(rate) {
    if (!this._playing || !this._masterGain) return;
    try {
      const ctx = audioManager._getCtx();
      // Detune all oscillators to simulate pitch shift
      const cents = Math.log2(rate) * 1200;
      this._nodes.forEach(node => {
        if (node instanceof OscillatorNode) {
          node.detune.setValueAtTime(cents, ctx.currentTime);
        }
      });
    } catch (e) { /* ignore */ }
  }

  stopMusic() {
    this._playing = false;

    // Fade out if possible
    if (this._masterGain) {
      try {
        const ctx = audioManager._getCtx();
        this._masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      } catch (e) { /* ignore */ }
    }

    // Clean up after fade
    setTimeout(() => {
      this._intervals.forEach(id => clearInterval(id));
      this._intervals = [];
      this._nodes.forEach(node => {
        try { if (node.stop) node.stop(); } catch (e) { /* ignore */ }
        try { node.disconnect(); } catch (e) { /* ignore */ }
      });
      this._nodes = [];
      this._masterGain = null;
    }, 600);
  }
}

const musicManager = new MusicManager();
export { musicManager };
export default musicManager;
