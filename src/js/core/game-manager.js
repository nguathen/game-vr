const STORAGE_KEY = 'vr_quest_player';

const GameState = Object.freeze({
  MENU: 'menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
});

class GameManager {
  constructor() {
    this._state = GameState.MENU;
    this._listeners = [];
    this._playerData = this._loadPlayerData();
  }

  get state() { return this._state; }
  get playerData() { return this._playerData; }

  changeState(newState) {
    if (this._state === newState) return;
    this._state = newState;
    this._listeners.forEach(fn => fn(this._state));
  }

  onStateChange(fn) {
    this._listeners.push(fn);
  }

  getHighScore() { return this._playerData.highScore; }
  getCoins() { return this._playerData.coins; }
  isPremium() { return this._playerData.isPremium; }

  setHighScore(score) {
    if (score > this._playerData.highScore) {
      this._playerData.highScore = score;
      this._save();
    }
  }

  addCoins(amount) {
    this._playerData.coins += amount;
    this._save();
  }

  spendCoins(amount) {
    if (this._playerData.coins < amount) return false;
    this._playerData.coins -= amount;
    this._save();
    return true;
  }

  setPremium(value) {
    this._playerData.isPremium = value;
    this._save();
  }

  addPurchase(productId) {
    if (!this._playerData.purchasedItems.includes(productId)) {
      this._playerData.purchasedItems.push(productId);
      this._save();
    }
  }

  hasPurchased(productId) {
    return this._playerData.purchasedItems.includes(productId);
  }

  _loadPlayerData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[GameManager] Failed to load player data:', e);
    }
    return { highScore: 0, coins: 0, isPremium: false, purchasedItems: [] };
  }

  _save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this._playerData));
    } catch (e) {
      console.warn('[GameManager] Failed to save:', e);
    }
  }
}

// Singleton
const gameManager = new GameManager();
export { gameManager, GameState };
export default gameManager;
