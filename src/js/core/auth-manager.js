import {
  auth, db, isConfigured,
  signInAnonymously, onAuthStateChanged,
  doc, getDoc, setDoc, updateDoc, serverTimestamp,
} from './firebase-config.js';

const DEFAULT_PROFILE = {
  displayName: 'Player',
  level: 1,
  xp: 0,
  totalXp: 0,
  highScores: { timeAttack: 0, survival: 0, zen: 0, bossRush: 0 },
  coins: 0,
  isPremium: false,
  purchasedItems: [],
  selectedWeapon: 'pistol',
  unlockedWeapons: ['pistol'],
  achievements: [],
  gamesPlayed: 0,
  totalTargetsHit: 0,
  bestCombo: 0,
  dailyChallenge: null,
  weaponUsage: {},
  modeStats: {},
  recentGames: [],
  selectedTheme: 'cyber',
  weaponSkins: {},
  purchasedSkins: [],
  tutorialCompleted: false,
  friendCode: null,
  friends: [],
  settings: null,
  createdAt: null,
  lastSeen: null,
};

class AuthManager {
  constructor() {
    this._user = null;
    this._profile = null;
    this._listeners = [];
    this._ready = false;
    this._readyPromise = this._init();
  }

  async _init() {
    if (!isConfigured) {
      this._profile = this._loadLocal();
      this._ready = true;
      this._notify();
      return;
    }

    const TIMEOUT_MS = 5000;

    return new Promise((resolve) => {
      let resolved = false;
      const done = () => {
        if (resolved) return;
        resolved = true;
        this._ready = true;
        this._notify();
        resolve();
      };

      // Timeout fallback — if Firebase doesn't respond, use localStorage
      const timer = setTimeout(() => {
        if (!resolved) {
          console.warn('[AuthManager] Firebase timeout, falling back to localStorage');
          this._profile = this._loadLocal();
          done();
        }
      }, TIMEOUT_MS);

      onAuthStateChanged(auth, async (user) => {
        try {
          if (user) {
            this._user = user;
            await this._loadProfile();
          } else {
            await signInAnonymously(auth);
            return; // onAuthStateChanged will fire again
          }
          clearTimeout(timer);
          done();
        } catch (e) {
          console.warn('[AuthManager] Firebase error, falling back to localStorage', e);
          this._profile = this._loadLocal();
          clearTimeout(timer);
          done();
        }
      });
    });
  }

  async waitReady() {
    return this._readyPromise;
  }

  get isReady() { return this._ready; }
  get user() { return this._user; }
  get uid() { return this._user?.uid || 'local'; }
  get profile() { return this._profile; }
  get displayName() { return this._profile?.displayName || 'Player'; }

  async _loadProfile() {
    if (!isConfigured || !this._user) {
      this._profile = this._loadLocal();
      return;
    }

    const ref = doc(db, 'players', this._user.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      this._profile = { ...DEFAULT_PROFILE, ...snap.data() };
      this._saveLocal(this._profile);
    } else {
      const local = this._loadLocal();
      this._profile = {
        ...DEFAULT_PROFILE,
        ...local,
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      };
      await setDoc(ref, this._profile);
    }
  }

  async saveProfile(updates) {
    if (!this._profile) return;
    Object.assign(this._profile, updates);
    this._saveLocal(this._profile);

    if (isConfigured && this._user) {
      const ref = doc(db, 'players', this._user.uid);
      await updateDoc(ref, { ...updates, lastSeen: serverTimestamp() });
    }
    this._notify();
  }

  async addXp(amount) {
    const profile = this._profile;
    profile.xp += amount;
    profile.totalXp += amount;

    const oldLevel = profile.level;
    while (profile.xp >= this.xpForLevel(profile.level)) {
      profile.xp -= this.xpForLevel(profile.level);
      profile.level++;
    }

    const leveledUp = profile.level > oldLevel;
    await this.saveProfile({
      xp: profile.xp,
      totalXp: profile.totalXp,
      level: profile.level,
    });

    return { leveledUp, newLevel: profile.level, oldLevel };
  }

  xpForLevel(level) {
    return Math.floor(100 * Math.pow(1.15, level - 1));
  }

  xpProgress() {
    const needed = this.xpForLevel(this._profile.level);
    return { current: this._profile.xp, needed, percent: (this._profile.xp / needed) * 100 };
  }

  async updateHighScore(mode, score) {
    const scores = { ...this._profile.highScores };
    if (score > (scores[mode] || 0)) {
      scores[mode] = score;
      await this.saveProfile({ highScores: scores });
      return true;
    }
    return false;
  }

  async recordGameResult(result) {
    const profile = this._profile;
    profile.gamesPlayed++;
    if (result.targetsHit) profile.totalTargetsHit += result.targetsHit;
    if (result.bestCombo > profile.bestCombo) profile.bestCombo = result.bestCombo;

    await this.saveProfile({
      gamesPlayed: profile.gamesPlayed,
      totalTargetsHit: profile.totalTargetsHit,
      bestCombo: profile.bestCombo,
    });
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._profile));
  }

  _loadLocal() {
    try {
      const raw = localStorage.getItem('vr_quest_player_v2');
      if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
    } catch (e) { /* ignore */ }

    // Migrate from V1
    try {
      const v1 = localStorage.getItem('vr_quest_player');
      if (v1) {
        const old = JSON.parse(v1);
        return {
          ...DEFAULT_PROFILE,
          highScores: { ...DEFAULT_PROFILE.highScores, timeAttack: old.highScore || 0 },
          coins: old.coins || 0,
          isPremium: old.isPremium || false,
          purchasedItems: old.purchasedItems || [],
        };
      }
    } catch (e) { /* ignore */ }

    return { ...DEFAULT_PROFILE };
  }

  _saveLocal(profile) {
    try {
      localStorage.setItem('vr_quest_player_v2', JSON.stringify(profile));
    } catch (e) { /* ignore */ }
  }
}

const authManager = new AuthManager();
export { authManager };
export default authManager;
