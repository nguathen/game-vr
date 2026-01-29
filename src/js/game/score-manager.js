import gameManager from '../core/game-manager.js';

class ScoreManager {
  constructor() {
    this._score = 0;
    this._listeners = [];
  }

  get score() { return this._score; }

  reset() {
    this._score = 0;
    this._notify();
  }

  add(points) {
    this._score += points;
    this._notify();
  }

  finalize() {
    gameManager.setHighScore(this._score);
    return {
      score: this._score,
      highScore: gameManager.getHighScore(),
      isNewHighScore: this._score >= gameManager.getHighScore(),
    };
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _notify() {
    this._listeners.forEach(fn => fn(this._score));
  }
}

const scoreManager = new ScoreManager();
export { scoreManager };
export default scoreManager;
