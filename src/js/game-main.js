import gameManager, { GameState } from './core/game-manager.js';
import scoreManager from './game/score-manager.js';
import TargetSystem from './game/target-system.js';
import audioManager from './core/audio-manager.js';

const GAME_DURATION = 60;
const COUNTDOWN_FROM = 3;

let targetSystem;
let timerInterval;
let timeLeft;

function init() {
  const container = document.getElementById('target-container');
  targetSystem = new TargetSystem(container);

  const hudScore = document.getElementById('hud-score');
  const hudTimer = document.getElementById('hud-timer');
  const hudCombo = document.getElementById('hud-combo');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownNumber = document.getElementById('countdown-number');

  // Score updates
  scoreManager.onChange(score => {
    hudScore.setAttribute('value', `Score: ${score}`);
  });

  // Combo display
  targetSystem.onComboChange = (combo) => {
    if (combo >= 2) {
      hudCombo.setAttribute('value', `x${combo} COMBO!`);
      hudCombo.setAttribute('animation__pop', {
        property: 'scale',
        from: '0.4 0.4 0.4',
        to: '0.3 0.3 0.3',
        dur: 200,
        easing: 'easeOutElastic',
      });
    } else {
      hudCombo.setAttribute('value', '');
    }
  };

  // Start with countdown
  startCountdown();

  // Retry
  document.getElementById('btn-retry').addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    startCountdown();
  });

  // Back to menu
  document.getElementById('btn-menu').addEventListener('click', () => {
    window.location.href = './index.html';
  });

  function startCountdown() {
    countdownOverlay.classList.remove('hidden');
    let count = COUNTDOWN_FROM;
    countdownNumber.textContent = count;

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count;
        audioManager.playCountdown();
      } else {
        countdownNumber.textContent = 'GO!';
        audioManager.playGo();
        clearInterval(countInterval);
        setTimeout(() => {
          countdownOverlay.classList.add('hidden');
          startGame();
        }, 500);
      }
    }, 1000);
  }

  function startGame() {
    scoreManager.reset();
    timeLeft = GAME_DURATION;
    gameManager.changeState(GameState.PLAYING);
    targetSystem.start();

    hudScore.setAttribute('value', 'Score: 0');
    hudTimer.setAttribute('value', String(timeLeft));
    hudCombo.setAttribute('value', '');

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timeLeft--;
      hudTimer.setAttribute('value', String(timeLeft));

      // Timer color change when low
      if (timeLeft <= 10) {
        hudTimer.setAttribute('color', '#ff4444');
      } else {
        hudTimer.setAttribute('color', '#ffaa00');
      }

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }

  function endGame() {
    clearInterval(timerInterval);
    gameManager.changeState(GameState.GAME_OVER);
    targetSystem.stop();
    audioManager.playGameOver();

    const result = scoreManager.finalize();

    document.getElementById('final-score').textContent = `Score: ${result.score}`;
    document.getElementById('final-high-score').textContent =
      result.isNewHighScore ? 'New High Score!' : `High Score: ${result.highScore}`;

    gameOverOverlay.classList.remove('hidden');
  }
}

document.addEventListener('DOMContentLoaded', init);
