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
import { tryEnterVR } from './core/vr-util.js';

const COUNTDOWN_FROM = 3;

let targetSystem;
let timerInterval;
let timeLeft;

// Expose weapon system to A-Frame components (non-module)
window.__weaponSystem = weaponSystem;

function init() {
  const container = document.getElementById('target-container');
  const mode = gameModeManager.current;

  targetSystem = new TargetSystem(container, {
    spawnInterval: mode.spawnInterval,
    maxTargets: mode.maxTargets,
    targetLifetime: mode.targetLifetime,
    bossMode: mode.id === 'bossRush',
  });

  const hudScore = document.getElementById('hud-score');
  const hudTimer = document.getElementById('hud-timer');
  const hudCombo = document.getElementById('hud-combo');
  const hudLives = document.getElementById('hud-lives');
  const hudWeapon = document.getElementById('hud-weapon');
  const hudLevel = document.getElementById('hud-level');
  const gameOverOverlay = document.getElementById('game-over-overlay');
  const countdownOverlay = document.getElementById('countdown-overlay');
  const countdownNumber = document.getElementById('countdown-number');

  // Load audio settings
  audioManager.loadSettings();

  // Read selected mode & weapon from URL params
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get('mode');
  const weaponParam = params.get('weapon');
  const themeParam = params.get('theme');
  if (modeParam) gameModeManager.select(modeParam);
  if (weaponParam) weaponSystem.select(weaponParam);

  // Apply theme (TASK-112)
  const scene = document.getElementById('game-scene');
  const selectedTheme = themeParam || authManager.profile?.selectedTheme || 'cyber';
  applyTheme(scene, selectedTheme);

  tryEnterVR(scene);

  // Spawn ambient particles (TASK-111)
  spawnAmbientParticles(scene);

  // Apply settings (TASK-114)
  const settings = getSettings();
  applyGameSettings(settings);

  // Update weapon laser colors on controllers (with skin overrides)
  updateControllerLasers();

  // Show weapon in HUD
  if (hudWeapon) {
    hudWeapon.setAttribute('value', `${weaponSystem.current.icon} ${weaponSystem.current.name}`);
  }

  // Show level in HUD
  if (hudLevel) {
    const profile = authManager.profile;
    if (profile) {
      hudLevel.setAttribute('value', `Lv.${profile.level}`);
    }
  }

  // Show lives for survival mode
  updateLivesDisplay();

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

  // Miss handler for survival mode
  targetSystem.onMiss = () => {
    const currentMode = gameModeManager.current;
    if (currentMode.lives !== Infinity) {
      const dead = gameModeManager.loseLife();
      audioManager.playLifeLost();
      updateLivesDisplay();
      if (dead) endGame();
    }
  };

  // Quit button — always visible during gameplay, essential for Zen/Survival
  const btnQuit = document.getElementById('btn-quit');
  if (btnQuit) {
    btnQuit.addEventListener('click', () => endGame());
  }

  startCountdown();

  document.getElementById('btn-retry').addEventListener('click', () => {
    gameOverOverlay.classList.add('hidden');
    // Reconfigure target system for current mode
    const m = gameModeManager.current;
    targetSystem.configure({
      spawnInterval: m.spawnInterval,
      maxTargets: m.maxTargets,
      targetLifetime: m.targetLifetime,
      bossMode: m.id === 'bossRush',
    });
    gameModeManager.startRound();
    updateLivesDisplay();
    startCountdown();
  });

  document.getElementById('btn-menu').addEventListener('click', () => {
    window.location.href = './index.html';
  });

  function updateLivesDisplay() {
    if (!hudLives) return;
    const lives = gameModeManager.lives;
    if (lives === Infinity) {
      hudLives.setAttribute('value', '');
    } else {
      hudLives.setAttribute('value', '♥'.repeat(Math.max(0, lives)));
    }
  }

  function updateControllerLasers() {
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

  function spawnAmbientParticles(sceneEl) {
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

  function applyGameSettings(settings) {
    // Crosshair
    const crosshair = document.getElementById('crosshair');
    if (crosshair) {
      crosshair.setAttribute('material', `shader: flat; color: ${settings.crosshairColor}; opacity: 0.8`);
      crosshair.setAttribute('color', settings.crosshairColor);
      const sizes = { small: { inner: 0.007, outer: 0.01 }, medium: { inner: 0.01, outer: 0.015 }, large: { inner: 0.015, outer: 0.022 } };
      const s = sizes[settings.crosshairSize] || sizes.medium;
      crosshair.setAttribute('radius-inner', String(s.inner));
      crosshair.setAttribute('radius-outer', String(s.outer));
    }

    // Combo counter visibility
    if (!settings.showCombo && hudCombo) {
      hudCombo.setAttribute('visible', 'false');
    }
  }

  function startCountdown() {
    countdownOverlay.classList.remove('hidden');
    let count = COUNTDOWN_FROM;
    countdownNumber.textContent = count;

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownNumber.textContent = count;
        audioManager.playCountdownBeep();
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

  // Track shots for accuracy (VR triggers and flat-screen clicks)
  document.addEventListener('shot-fired', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
    }
  });
  scene.addEventListener('click', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
    }
  });

  function startGame() {
    scoreManager.reset();
    const currentMode = gameModeManager.current;
    timeLeft = currentMode.duration;
    gameModeManager.startRound();
    gameManager.changeState(GameState.PLAYING);
    if (btnQuit) btnQuit.classList.remove('hidden');
    targetSystem.start();

    // Start music
    musicManager.loadSettings();
    musicManager.startMusic(selectedTheme);

    hudScore.setAttribute('value', 'Score: 0');
    hudCombo.setAttribute('value', '');

    // Timer display
    if (timeLeft === Infinity) {
      hudTimer.setAttribute('value', '∞');
      hudTimer.setAttribute('color', '#44ff44');
    } else {
      hudTimer.setAttribute('value', String(timeLeft));
      hudTimer.setAttribute('color', '#ffaa00');
    }

    updateLivesDisplay();

    if (timerInterval) clearInterval(timerInterval);
    if (timeLeft !== Infinity) {
      timerInterval = setInterval(() => {
        timeLeft--;
        hudTimer.setAttribute('value', String(timeLeft));

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
  }

  async function endGame() {
    if (timerInterval) clearInterval(timerInterval);
    if (btnQuit) btnQuit.classList.add('hidden');
    gameManager.changeState(GameState.GAME_OVER);
    targetSystem.stop();
    musicManager.stopMusic();
    audioManager.playGameOver();

    const result = scoreManager.finalize();
    const currentMode = gameModeManager.current;

    // Build game summary (TASK-119)
    const summary = buildSummary(result, authManager.profile, currentMode, targetSystem);

    // XP calculation
    const xpEarned = summary.xpEarned;

    // Update profile
    const isNewHigh = await authManager.updateHighScore(currentMode.id, result.score);
    const levelResult = await authManager.addXp(xpEarned);
    await authManager.recordGameResult({
      targetsHit: targetSystem.targetsHit,
      bestCombo: targetSystem.bestCombo,
    });

    // Track weapon and mode usage (TASK-110)
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

    // Leaderboard (TASK-106)
    if (isNewHigh) {
      leaderboardManager.submitScore(currentMode.id, result.score).catch(() => {});
    }

    // Daily challenge (TASK-107)
    const challengeResult = await checkProgress({
      score: result.score,
      targetsHit: targetSystem.targetsHit,
      bestCombo: targetSystem.bestCombo,
      mode: currentMode.id,
      weapon: weaponId,
    });

    // Achievements (TASK-108)
    const newAchievements = await checkAchievements();

    // Display results with count-up animation (TASK-120)
    const scoreEl = document.getElementById('final-score');
    scoreEl.textContent = 'Score: 0';
    countUp(scoreEl, 0, result.score, 800);
    // Prefix the counter text
    const origCountUp = scoreEl.textContent;
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

    // XP display
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

    // Enhanced stats display (TASK-119)
    const statsEl = document.getElementById('final-stats');
    if (statsEl) {
      statsEl.textContent = `Targets: ${targetSystem.targetsHit} | Combo: x${targetSystem.bestCombo} | Accuracy: ${summary.accuracy}%`;
    }

    // Daily challenge notification (TASK-120 toast)
    if (challengeResult.justCompleted) {
      showToast(`Challenge Complete! +${challengeResult.challenge.rewardXp} XP +${challengeResult.challenge.rewardCoins} Coins`, 'success');
    }

    // Achievement notifications via toast (TASK-120)
    newAchievements.forEach((ach, i) => {
      setTimeout(() => showToast(`${ach.icon} ${ach.name} unlocked! +${ach.rewardXp} XP`, 'achievement'), 500 + i * 800);
    });

    // Level up toast
    if (levelResult.leveledUp) {
      showToast(`Level Up! You are now Lv.${levelResult.newLevel}`, 'achievement');
    }

    // Wire share button (TASK-119)
    let shareBtn = document.getElementById('btn-share');
    if (!shareBtn) {
      shareBtn = document.createElement('button');
      shareBtn.id = 'btn-share';
      shareBtn.className = 'btn btn-secondary';
      shareBtn.textContent = 'Share';
      const btnRow = gameOverOverlay.querySelector('.buttons');
      if (btnRow) btnRow.appendChild(shareBtn);
    }
    shareBtn.onclick = async () => {
      summary.isNewHigh = isNewHigh;
      const text = formatShareText(summary);
      const ok = await copyToClipboard(text);
      showToast(ok ? 'Copied to clipboard!' : 'Could not copy', ok ? 'success' : 'error');
    };

    gameOverOverlay.classList.remove('hidden');
  }
}

// Wait for auth before init
let initialized = false;
authManager.waitReady().then(() => {
  const safeInit = () => { if (!initialized) { initialized = true; init(); } };
  document.addEventListener('DOMContentLoaded', safeInit);
  if (document.readyState !== 'loading') safeInit();
});
