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
  }

  get state() { return this._state; }

  changeState(newState) {
    if (this._state === newState) return;
    this._state = newState;
    this._listeners.forEach(fn => fn(this._state));
  }

  onStateChange(fn) {
    this._listeners.push(fn);
  }
}

// Singleton
const gameManager = new GameManager();
export { gameManager, GameState };
export default gameManager;
