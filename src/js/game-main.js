import gameManager, { GameState } from './core/game-manager.js';
import authManager from './core/auth-manager.js';
import scoreManager from './game/score-manager.js';
import TargetSystem from './game/target-system.js';
import audioManager from './core/audio-manager.js';
import gameModeManager from './game/game-modes.js';
import weaponSystem from './game/weapon-system.js';
import leaderboardManager from './core/leaderboard-manager.js';
import { checkProgress } from './game/daily-challenge.js';
import { checkAchievements } from './game/achievements.js';
import { applyTheme } from './game/environment-themes.js';
import { getSkinOverrides } from './game/weapon-skins.js';
import { getSettings } from './game/settings-util.js';
import musicManager from './core/music-manager.js';
import { buildSummary, formatShareText, copyToClipboard } from './game/game-summary.js';
import { showToast } from './ui/toast.js';
import { countUp } from './ui/animations.js';

const COUNTDOWN_FROM = 3;

let targetSystem;
let timerInterval;
let timeLeft;
let _onReturnToMenu;
let _initialized = false;

// Expose weapon system to A-Frame components (non-module)
window.__weaponSystem = weaponSystem;

export function startGame({ mode, weapon, theme, onReturnToMenu }) {
  if (mode) gameModeManager.select(mode);
  if (weapon) weaponSystem.select(weapon);
  _onReturnToMenu = onReturnToMenu;

  if (!_initialized) {
    _initOnce();
    _initialized = true;
  }
  _initRound(theme);
}

// DOM refs (set once)
let _hudScore, _hudTimer, _hudCombo, _hudLives, _hudWeapon, _hudLevel;
let _gameOverOverlay, _countdownOverlay, _countdownNumber, _scene, _btnQuit;

function _initOnce() {
  _hudScore = document.getElementById('hud-score');
  _hudTimer = document.getElementById('hud-timer');
  _hudCombo = document.getElementById('hud-combo');
  _hudLives = document.getElementById('hud-lives');
  _hudWeapon = document.getElementById('hud-weapon');
  _hudLevel = document.getElementById('hud-level');
  _gameOverOverlay = document.getElementById('game-over-overlay');
  _countdownOverlay = document.getElementById('countdown-overlay');
  _countdownNumber = document.getElementById('countdown-number');
  _scene = document.getElementById('scene');
  _btnQuit = document.getElementById('btn-quit');

  // One-time event listeners
  if (_btnQuit) {
    _btnQuit.addEventListener('click', () => endGame());
  }

  document.getElementById('btn-retry').addEventListener('click', () => {
    _gameOverOverlay.classList.add('hidden');
    const m = gameModeManager.current;
    targetSystem.configure({
      spawnInterval: m.spawnInterval,
      maxTargets: m.maxTargets,
      targetLifetime: m.targetLifetime,
      bossMode: m.id === 'bossRush',
    });
    gameModeManager.startRound();
    _updateLivesDisplay();
    _startCountdown();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    if (_onReturnToMenu) _onReturnToMenu();
  });

  // Track shots for accuracy (VR triggers and flat-screen clicks)
  document.addEventListener('shot-fired', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
    }
  });
  _scene.addEventListener('click', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
    }
  });

  // Spawn ambient particles once
  _spawnAmbientParticles(_scene);
}

function _initRound(themeParam) {
  const container = document.getElementById('target-container');
  const mode = gameModeManager.current;

  targetSystem = new TargetSystem(container, {
    spawnInterval: mode.spawnInterval,
    maxTargets: mode.maxTargets,
    targetLifetime: mode.targetLifetime,
    bossMode: mode.id === 'bossRush',
  });

  audioManager.loadSettings();

  _selectedTheme = themeParam || authManager.profile?.selectedTheme || 'cyber';
  applyTheme(_scene, _selectedTheme);

  const settings = getSettings();
  _applyGameSettings(settings);
  _updateControllerLasers();

  if (_hudWeapon) {
    _hudWeapon.setAttribute('value', `${weaponSystem.current.icon} ${weaponSystem.current.name}`);
  }
  if (_hudLevel) {
    const profile = authManager.profile;
    if (profile) {
      _hudLevel.setAttribute('value', `Lv.${profile.level}`);
    }
  }

  _updateLivesDisplay();

  scoreManager.onChange(score => {
    _hudScore.setAttribute('value', `Score: ${score}`);
  });

  targetSystem.onComboChange = (combo) => {
    if (combo >= 2) {
      _hudCombo.setAttribute('value', `x${combo} COMBO!`);
      _hudCombo.setAttribute('animation__pop', {
        property: 'scale',
        from: '0.4 0.4 0.4',
        to: '0.3 0.3 0.3',
        dur: 200,
        easing: 'easeOutElastic',
      });
    } else {
      _hudCombo.setAttribute('value', '');
    }
  };

  targetSystem.onMiss = () => {
    const currentMode = gameModeManager.current;
    if (currentMode.lives !== Infinity) {
      const dead = gameModeManager.loseLife();
      audioManager.playLifeLost();
      _updateLivesDisplay();
      if (dead) endGame();
    }
  };

  _startCountdown();
}

function _updateLivesDisplay() {
  if (!_hudLives) return;
  const lives = gameModeManager.lives;
  if (lives === Infinity) {
    _hudLives.setAttribute('value', '');
  } else {
    _hudLives.setAttribute('value', '♥'.repeat(Math.max(0, lives)));
  }
}

function _updateControllerLasers() {
  const weapon = weaponSystem.current;
  const profile = authManager.profile;
  const skinId = profile?.weaponSkins?.[weapon.id] || 'default';
  const overrides = getSkinOverrides(skinId, weapon);
  const laserColor = overrides.laserColor || weapon.laserColor;
  const laserOpacity = overrides.laserOpacity || weapon.laserOpacity;

  const rightHand = document.getElementById('right-hand');
  const leftHand = document.getElementById('left-hand');
  if (rightHand) {
    rightHand.setAttribute('raycaster', 'lineColor', laserColor);
    rightHand.setAttribute('raycaster', 'lineOpacity', laserOpacity);
  }
  if (leftHand) {
    leftHand.setAttribute('raycaster', 'lineColor', laserColor);
    leftHand.setAttribute('raycaster', 'lineOpacity', laserOpacity);
  }
}

function _spawnAmbientParticles(sceneEl) {
  for (let i = 0; i < 25; i++) {
    const p = document.createElement('a-sphere');
    const x = (Math.random() - 0.5) * 28;
    const y = Math.random() * 4 + 0.5;
    const z = (Math.random() - 0.5) * 28;
    p.setAttribute('radius', String(0.02 + Math.random() * 0.03));
    p.setAttribute('material', `shader: flat; color: #ffffff; opacity: ${0.1 + Math.random() * 0.15}`);
    p.setAttribute('position', `${x} ${y} ${z}`);
    p.setAttribute('animation', {
      property: 'position',
      to: `${x + (Math.random() - 0.5) * 2} ${y + 1 + Math.random()} ${z + (Math.random() - 0.5) * 2}`,
      dur: 6000 + Math.random() * 4000,
      easing: 'linear', loop: true, dir: 'alternate',
    });
    sceneEl.appendChild(p);
  }
}

function _applyGameSettings(settings) {
  const crosshair = document.getElementById('crosshair');
  if (crosshair) {
    crosshair.setAttribute('material', `shader: flat; color: ${settings.crosshairColor}; opacity: 0.8`);
    crosshair.setAttribute('color', settings.crosshairColor);
    const sizes = { small: { inner: 0.007, outer: 0.01 }, medium: { inner: 0.01, outer: 0.015 }, large: { inner: 0.015, outer: 0.022 } };
    const s = sizes[settings.crosshairSize] || sizes.medium;
    crosshair.setAttribute('radius-inner', String(s.inner));
    crosshair.setAttribute('radius-outer', String(s.outer));
  }

  if (!settings.showCombo && _hudCombo) {
    _hudCombo.setAttribute('visible', 'false');
  }
}

function _startCountdown() {
  _countdownOverlay.classList.remove('hidden');
  let count = COUNTDOWN_FROM;
  _countdownNumber.textContent = count;

  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      _countdownNumber.textContent = count;
      audioManager.playCountdownBeep();
    } else {
      _countdownNumber.textContent = 'GO!';
      audioManager.playGo();
      clearInterval(countInterval);
      setTimeout(() => {
        _countdownOverlay.classList.add('hidden');
        startRound();
      }, 500);
    }
  }, 1000);
}

let _selectedTheme = 'cyber';

function startRound() {
  scoreManager.reset();
  const currentMode = gameModeManager.current;
  timeLeft = currentMode.duration;
  gameModeManager.startRound();
  gameManager.changeState(GameState.PLAYING);
  if (_btnQuit) _btnQuit.classList.remove('hidden');
  targetSystem.start();

  musicManager.loadSettings();
  musicManager.startMusic(_selectedTheme);

  _hudScore.setAttribute('value', 'Score: 0');
  _hudCombo.setAttribute('value', '');

  if (timeLeft === Infinity) {
    _hudTimer.setAttribute('value', '∞');
    _hudTimer.setAttribute('color', '#44ff44');
  } else {
    _hudTimer.setAttribute('value', String(timeLeft));
    _hudTimer.setAttribute('color', '#ffaa00');
  }

  _updateLivesDisplay();

  if (timerInterval) clearInterval(timerInterval);
  if (timeLeft !== Infinity) {
    timerInterval = setInterval(() => {
      timeLeft--;
      _hudTimer.setAttribute('value', String(timeLeft));

      if (timeLeft <= 10) {
        _hudTimer.setAttribute('color', '#ff4444');
      } else {
        _hudTimer.setAttribute('color', '#ffaa00');
      }

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }
}

async function endGame() {
  if (timerInterval) clearInterval(timerInterval);
  if (_btnQuit) _btnQuit.classList.add('hidden');
  gameManager.changeState(GameState.GAME_OVER);
  targetSystem.stop();
  musicManager.stopMusic();
  audioManager.playGameOver();

  const result = scoreManager.finalize();
  const currentMode = gameModeManager.current;

  const summary = buildSummary(result, authManager.profile, currentMode, targetSystem);
  const xpEarned = summary.xpEarned;

  const isNewHigh = await authManager.updateHighScore(currentMode.id, result.score);
  const levelResult = await authManager.addXp(xpEarned);
  await authManager.recordGameResult({
    targetsHit: targetSystem.targetsHit,
    bestCombo: targetSystem.bestCombo,
  });

  const profile = authManager.profile;
  const weaponId = weaponSystem.currentId;
  const wu = { ...(profile.weaponUsage || {}) };
  wu[weaponId] = (wu[weaponId] || 0) + 1;
  const ms = { ...(profile.modeStats || {}) };
  if (!ms[currentMode.id]) ms[currentMode.id] = { games: 0 };
  ms[currentMode.id].games++;
  const recent = [...(profile.recentGames || [])];
  recent.push({ mode: currentMode.id, weapon: weaponId, score: result.score, targets: targetSystem.targetsHit, date: Date.now() });
  if (recent.length > 10) recent.shift();
  await authManager.saveProfile({ weaponUsage: wu, modeStats: ms, recentGames: recent });

  if (isNewHigh) {
    leaderboardManager.submitScore(currentMode.id, result.score).catch(() => {});
  }

  const challengeResult = await checkProgress({
    score: result.score,
    targetsHit: targetSystem.targetsHit,
    bestCombo: targetSystem.bestCombo,
    mode: currentMode.id,
    weapon: weaponId,
  });

  const newAchievements = await checkAchievements();

  const scoreEl = document.getElementById('final-score');
  scoreEl.textContent = 'Score: 0';
  countUp(scoreEl, 0, result.score, 800);
  const scoreObserver = new MutationObserver(() => {
    if (!scoreEl.textContent.startsWith('Score:')) {
      scoreEl.textContent = `Score: ${scoreEl.textContent}`;
    }
  });
  scoreObserver.observe(scoreEl, { childList: true, characterData: true, subtree: true });
  setTimeout(() => {
    scoreObserver.disconnect();
    scoreEl.textContent = `Score: ${result.score.toLocaleString()}`;
  }, 900);

  const highScoreEl = document.getElementById('final-high-score');
  if (isNewHigh) {
    highScoreEl.textContent = 'New High Score!';
    highScoreEl.style.color = '#ffd700';
  } else {
    const hs = authManager.profile?.highScores?.[currentMode.id] || 0;
    const diff = result.score - hs;
    highScoreEl.textContent = diff >= 0 ? `High Score: ${hs}` : `High Score: ${hs} (${diff})`;
    highScoreEl.style.color = '#888';
  }

  const xpEl = document.getElementById('final-xp');
  if (xpEl) {
    xpEl.textContent = `+${xpEarned} XP`;
    if (levelResult.leveledUp) {
      xpEl.textContent += ` — LEVEL UP! Lv.${levelResult.newLevel}`;
      xpEl.style.color = '#ffd700';
      audioManager.playLevelUp();
    } else {
      xpEl.style.color = '#00d4ff';
    }
  }

  const statsEl = document.getElementById('final-stats');
  if (statsEl) {
    statsEl.textContent = `Targets: ${targetSystem.targetsHit} | Combo: x${targetSystem.bestCombo} | Accuracy: ${summary.accuracy}%`;
  }

  if (challengeResult.justCompleted) {
    showToast(`Challenge Complete! +${challengeResult.challenge.rewardXp} XP +${challengeResult.challenge.rewardCoins} Coins`, 'success');
  }

  newAchievements.forEach((ach, i) => {
    setTimeout(() => showToast(`${ach.icon} ${ach.name} unlocked! +${ach.rewardXp} XP`, 'achievement'), 500 + i * 800);
  });

  if (levelResult.leveledUp) {
    showToast(`Level Up! You are now Lv.${levelResult.newLevel}`, 'achievement');
  }

  let shareBtn = document.getElementById('btn-share');
  if (!shareBtn) {
    shareBtn = document.createElement('button');
    shareBtn.id = 'btn-share';
    shareBtn.className = 'btn btn-secondary';
    shareBtn.textContent = 'Share';
    const btnRow = _gameOverOverlay.querySelector('.buttons');
    if (btnRow) btnRow.appendChild(shareBtn);
  }
  shareBtn.onclick = async () => {
    summary.isNewHigh = isNewHigh;
    const text = formatShareText(summary);
    const ok = await copyToClipboard(text);
    showToast(ok ? 'Copied to clipboard!' : 'Could not copy', ok ? 'success' : 'error');
  };

  _gameOverOverlay.classList.remove('hidden');
}

// SPA: game is started via startGame() exported above, called from main.js
