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
import { buildSummary } from './game/game-summary.js';
import powerUpManager from './game/power-up-manager.js';
import hapticManager from './core/haptic-manager.js';

const COUNTDOWN_FROM = 3;

let targetSystem;
let timerInterval;
let timeLeft;
let _onReturnToMenu;
let _initialized = false;

// Expose systems to A-Frame components (non-module)
window.__weaponSystem = weaponSystem;
window.__hapticManager = hapticManager;

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
let _hudScore, _hudTimer, _hudCombo, _hudLives, _hudWeapon, _hudLevel, _hudPowerup;
let _scene, _btnQuitVr;

function _initOnce() {
  _hudScore = document.getElementById('hud-score');
  _hudTimer = document.getElementById('hud-timer');
  _hudCombo = document.getElementById('hud-combo');
  _hudLives = document.getElementById('hud-lives');
  _hudWeapon = document.getElementById('hud-weapon');
  _hudLevel = document.getElementById('hud-level');
  _hudPowerup = document.getElementById('hud-powerup');
  _scene = document.getElementById('scene');
  _btnQuitVr = document.getElementById('btn-quit-vr');

  // VR Quit button
  if (_btnQuitVr) {
    const vrPlane = _btnQuitVr.querySelector('a-plane');
    if (vrPlane) {
      const handleQuit = () => {
        endGame();
      };
      vrPlane.addEventListener('click', handleQuit);
      vrPlane.addEventListener('hit', handleQuit);
      vrPlane.addEventListener('mouseenter', () => {
        vrPlane.setAttribute('material', 'opacity', 1.0);
        vrPlane.setAttribute('color', '#882222');
      });
      vrPlane.addEventListener('mouseleave', () => {
        vrPlane.setAttribute('material', 'opacity', 0.9);
        vrPlane.setAttribute('color', '#661a1a');
      });
    }
  }

  // Track shots for accuracy (VR triggers and flat-screen clicks)
  document.addEventListener('shot-fired', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
      document.dispatchEvent(new CustomEvent('camera-fov-punch'));
    }
  });
  _scene.addEventListener('click', () => {
    if (gameManager.state === GameState.PLAYING) {
      scoreManager.recordShot();
    }
  });

  // Spawn ambient particles once
  _spawnAmbientParticles(_scene);

  // Slow-motion overlay handler
  document.addEventListener('slow-motion', (e) => {
    const settings = getSettings();
    if (settings.reducedMotion) return;

    if (e.detail.active) {
      _showSlowMoOverlay();
      musicManager.setPlaybackRate(0.5);
      document.dispatchEvent(new CustomEvent('camera-impact-zoom', { detail: { duration: 200 } }));
    } else {
      _hideSlowMoOverlay();
      musicManager.setPlaybackRate(1.0);
    }
  });

  // Boss mode HUD handlers
  const hudBoss = document.getElementById('hud-boss');
  const bossBarFill = document.getElementById('boss-bar-fill');
  const bossBarLabel = document.getElementById('boss-bar-label');

  document.addEventListener('boss-spawn', (e) => {
    if (!hudBoss) return;
    hudBoss.setAttribute('visible', 'true');
    if (bossBarFill) {
      bossBarFill.setAttribute('width', '0.5');
      bossBarFill.setAttribute('color', '#44ff44');
    }
    if (bossBarLabel) {
      const w = e.detail.wave;
      bossBarLabel.setAttribute('value', w > 0 && w % 5 === 0 ? `BOSS WAVE ${w}!` : `WAVE ${w + 1}`);
    }
  });

  document.addEventListener('boss-damaged', (e) => {
    if (!hudBoss || !bossBarFill) return;
    const { hp, maxHp } = e.detail;
    const pct = hp / maxHp;
    bossBarFill.setAttribute('width', String(0.5 * pct));
    // Color transition by HP %
    if (pct > 0.5)      bossBarFill.setAttribute('color', '#44ff44');
    else if (pct > 0.25) bossBarFill.setAttribute('color', '#ffaa00');
    else                  bossBarFill.setAttribute('color', '#ff3333');
    audioManager.playBossHit();
  });

  document.addEventListener('boss-killed', (e) => {
    if (!hudBoss) return;
    setTimeout(() => hudBoss.setAttribute('visible', 'false'), 500);
    // Boss kill particle burst at boss position
    if (_scene && e.detail?.position) {
      _spawnEventParticles(_scene, e.detail.position, 8, '#ffd700');
    }
    // Big camera shake on boss kill
    document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.03, duration: 300 } }));
  });

  document.addEventListener('boss-wave-clear', (e) => {
    // Show wave clear announcement via combo HUD
    if (_hudCombo) {
      _hudCombo.setAttribute('value', `WAVE ${e.detail.wave} CLEAR!`);
      _hudCombo.setAttribute('color', '#ffd700');
      _hudCombo.setAttribute('animation__pop', {
        property: 'scale', from: '0.6 0.6 0.6', to: '0.4 0.4 0.4',
        dur: 300, easing: 'easeOutElastic',
      });
      setTimeout(() => _hudCombo.setAttribute('value', ''), 2000);
    }
  });
}

function _showSlowMoOverlay() {
  let overlay = document.getElementById('slow-mo-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'slow-mo-overlay';
    overlay.className = 'slow-mo-overlay';
    document.body.appendChild(overlay);
  }
  void overlay.offsetWidth;
  overlay.classList.add('active');
}

function _hideSlowMoOverlay() {
  const overlay = document.getElementById('slow-mo-overlay');
  if (overlay) overlay.classList.remove('active');
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

  // Power-up HUD updates
  powerUpManager.onUpdate = (display) => {
    if (!_hudPowerup) return;
    if (!display) {
      _hudPowerup.setAttribute('value', '');
      return;
    }
    const secs = (display.remaining / 1000).toFixed(1);
    _hudPowerup.setAttribute('value', `${display.label} ${secs}s`);
    _hudPowerup.setAttribute('color', display.color);
  };

  powerUpManager.onDeactivate = () => {
    if (_hudPowerup) _hudPowerup.setAttribute('value', '');
  };

  scoreManager.onChange(score => {
    _hudScore.setAttribute('value', `Score: ${score}`);
    // Score pop animation
    _hudScore.setAttribute('animation__pop', {
      property: 'scale', from: '0.42 0.42 0.42', to: '0.35 0.35 0.35',
      dur: 150, easing: 'easeOutQuad',
    });
  });

  targetSystem.onComboChange = (combo) => {
    if (combo >= 2) {
      _hudCombo.setAttribute('value', `x${combo} COMBO!`);
      // Color escalation
      let color = '#ff44aa';
      if (combo >= 10) color = '#ffd700';
      else if (combo >= 5) color = '#ff8800';

      // Camera shake scales with combo
      if (combo >= 5) {
        const intensity = combo >= 15 ? 0.025 : combo >= 10 ? 0.018 : 0.01;
        const dur = combo >= 15 ? 200 : combo >= 10 ? 150 : 100;
        document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity, duration: dur } }));
      }
      _hudCombo.setAttribute('color', color);
      _hudCombo.setAttribute('animation__pop', {
        property: 'scale',
        from: '0.5 0.5 0.5', to: '0.4 0.4 0.4',
        dur: 200, easing: 'easeOutElastic',
      });
      // Shake at x10+
      if (combo >= 10) {
        _hudCombo.setAttribute('animation__shake', {
          property: 'position', from: '-0.01 0.2 -1', to: '0.01 0.2 -1',
          dur: 80, loop: 3, dir: 'alternate', easing: 'linear',
        });
        // Energy burst at camera position for high combo
        const cam = document.getElementById('camera');
        if (cam && _scene) {
          const cp = cam.object3D.getWorldPosition(new THREE.Vector3());
          _spawnEventParticles(_scene, { x: cp.x, y: cp.y, z: cp.z - 2 }, 5, color);
        }
      }
    } else {
      _hudCombo.setAttribute('value', '');
    }
  };

  targetSystem.onMiss = () => {
    const currentMode = gameModeManager.current;
    if (currentMode.lives !== Infinity) {
      const dead = gameModeManager.loseLife();
      audioManager.playLifeLost();
      hapticManager.damageTaken();
      _updateLivesDisplay();
      // Shake lives display
      if (_hudLives) {
        _hudLives.setAttribute('animation__shake', {
          property: 'position', from: '-0.47 0.22 -1', to: '-0.43 0.22 -1',
          dur: 80, loop: 3, dir: 'alternate', easing: 'linear',
        });
        setTimeout(() => {
          _hudLives.setAttribute('position', '-0.45 0.22 -1');
          _hudLives.removeAttribute('animation__shake');
        }, 500);
      }
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

/** Theme-specific ambient particle palettes */
const THEME_PARTICLES = {
  cyber:  { dust: '#aaccff', sparks: '#00d4ff', debris: '#4466ff' },
  sunset: { dust: '#ffccaa', sparks: '#ff6600', debris: '#ff4400' },
  space:  { dust: '#8899cc', sparks: '#4488ff', debris: '#6644ff' },
  neon:   { dust: '#ff88ff', sparks: '#ff00ff', debris: '#00ffff' },
  day:    { dust: '#ffffcc', sparks: '#44cc88', debris: '#88bbdd' },
};

function _spawnAmbientParticles(sceneEl) {
  const palette = THEME_PARTICLES[_selectedTheme] || THEME_PARTICLES.cyber;

  // --- Dust motes (40): slow, warm, subtle ---
  for (let i = 0; i < 40; i++) {
    const p = document.createElement('a-sphere');
    const x = (Math.random() - 0.5) * 28;
    const y = Math.random() * 5 + 0.3;
    const z = (Math.random() - 0.5) * 28;
    p.setAttribute('class', 'ambient-particle');
    p.setAttribute('radius', String(0.008 + Math.random() * 0.012));
    p.setAttribute('material', `shader: flat; color: ${palette.dust}; opacity: ${0.08 + Math.random() * 0.12}`);
    p.setAttribute('position', `${x} ${y} ${z}`);
    p.setAttribute('animation', {
      property: 'position',
      to: `${x + (Math.random() - 0.5) * 3} ${y + 0.5 + Math.random() * 1.5} ${z + (Math.random() - 0.5) * 3}`,
      dur: 8000 + Math.random() * 6000,
      easing: 'linear', loop: true, dir: 'alternate',
    });
    sceneEl.appendChild(p);
  }

  // --- Energy sparks (20): small, fast, bright emissive ---
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('a-sphere');
    const x = (Math.random() - 0.5) * 24;
    const y = Math.random() * 4 + 1;
    const z = (Math.random() - 0.5) * 24;
    p.setAttribute('class', 'ambient-particle');
    p.setAttribute('radius', String(0.006 + Math.random() * 0.008));
    p.setAttribute('material', `shader: flat; color: ${palette.sparks}; opacity: ${0.3 + Math.random() * 0.4}`);
    p.setAttribute('position', `${x} ${y} ${z}`);
    // Fast random drift
    p.setAttribute('animation__drift', {
      property: 'position',
      to: `${x + (Math.random() - 0.5) * 5} ${y + (Math.random() - 0.5) * 3} ${z + (Math.random() - 0.5) * 5}`,
      dur: 2000 + Math.random() * 2000,
      easing: 'easeInOutSine', loop: true, dir: 'alternate',
    });
    // Twinkle
    p.setAttribute('animation__twinkle', {
      property: 'material.opacity', from: 0.1, to: 0.6 + Math.random() * 0.3,
      dur: 600 + Math.random() * 800,
      loop: true, dir: 'alternate', easing: 'easeInOutSine',
    });
    sceneEl.appendChild(p);
  }

  // --- Floating debris (10): small geometric, slow rotation ---
  const debrisGeoms = ['a-icosahedron', 'a-octahedron', 'a-dodecahedron'];
  for (let i = 0; i < 10; i++) {
    const geom = debrisGeoms[Math.floor(Math.random() * debrisGeoms.length)];
    const p = document.createElement(geom);
    const x = (Math.random() - 0.5) * 26;
    const y = Math.random() * 4 + 1;
    const z = (Math.random() - 0.5) * 26;
    p.setAttribute('class', 'ambient-particle');
    p.setAttribute('radius', String(0.02 + Math.random() * 0.03));
    p.setAttribute('material', `color: ${palette.debris}; metalness: 0.7; roughness: 0.3; emissive: ${palette.debris}; emissiveIntensity: 0.3; opacity: ${0.15 + Math.random() * 0.2}`);
    p.setAttribute('position', `${x} ${y} ${z}`);
    p.setAttribute('animation__float', {
      property: 'position',
      to: `${x + (Math.random() - 0.5) * 2} ${y + Math.random() * 2} ${z + (Math.random() - 0.5) * 2}`,
      dur: 7000 + Math.random() * 5000,
      easing: 'easeInOutSine', loop: true, dir: 'alternate',
    });
    p.setAttribute('animation__spin', {
      property: 'rotation',
      to: `${Math.random() * 360} ${Math.random() * 360} ${Math.random() * 360}`,
      dur: 6000 + Math.random() * 6000,
      easing: 'linear', loop: true,
    });
    sceneEl.appendChild(p);
  }
}

/** Spawn burst particles on game events (target destroy, combo, power-up) */
function _spawnEventParticles(sceneEl, pos, count, color) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('a-sphere');
    p.setAttribute('radius', '0.01');
    p.setAttribute('material', `shader: flat; color: ${color}; opacity: 0.7`);
    p.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    const dx = (Math.random() - 0.5) * 3;
    const dy = Math.random() * 2;
    const dz = (Math.random() - 0.5) * 3;
    p.setAttribute('animation__burst', {
      property: 'position',
      to: `${pos.x + dx} ${pos.y + dy} ${pos.z + dz}`,
      dur: 400 + Math.random() * 200,
      easing: 'easeOutQuad',
    });
    p.setAttribute('animation__fade', {
      property: 'material.opacity', from: 0.7, to: 0,
      dur: 500, easing: 'easeOutQuad',
    });
    sceneEl.appendChild(p);
    setTimeout(() => { if (p.parentNode) p.parentNode.removeChild(p); }, 600);
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

  // Bloom toggle
  const sceneEl = document.querySelector('a-scene');
  if (sceneEl && sceneEl.hasAttribute('bloom-effect')) {
    sceneEl.setAttribute('bloom-effect', 'enabled', settings.bloom !== false);
  }

  // Screen shake level
  const cam = document.getElementById('camera');
  if (cam && cam.hasAttribute('camera-effects')) {
    cam.setAttribute('camera-effects', 'shakeLevel', settings.screenShake || 'medium');
  }
}

function _startCountdown() {
  let count = COUNTDOWN_FROM;
  const hudCountdown = document.getElementById('hud-countdown');
  if (hudCountdown) {
    hudCountdown.setAttribute('value', String(count));
    hudCountdown.setAttribute('visible', 'true');
    hudCountdown.setAttribute('scale', '0.8 0.8 0.8');
  }

  const countInterval = setInterval(() => {
    count--;
    if (count > 0) {
      if (hudCountdown) {
        hudCountdown.setAttribute('value', String(count));
        hudCountdown.setAttribute('animation__pop', {
          property: 'scale', from: '1.0 1.0 1.0', to: '0.8 0.8 0.8',
          dur: 300, easing: 'easeOutQuad',
        });
      }
      audioManager.playCountdownBeep();
      hapticManager.pulse(0.2, 30);
    } else {
      if (hudCountdown) {
        hudCountdown.setAttribute('value', 'GO!');
        hudCountdown.setAttribute('color', '#ffaa00');
        hudCountdown.setAttribute('animation__pop', {
          property: 'scale', from: '1.2 1.2 1.2', to: '0.8 0.8 0.8',
          dur: 400, easing: 'easeOutElastic',
        });
      }
      audioManager.playGo();
      clearInterval(countInterval);
      setTimeout(() => {
        if (hudCountdown) {
          hudCountdown.setAttribute('visible', 'false');
          hudCountdown.setAttribute('color', '#00ff88');
        }
        startRound();
      }, 500);
    }
  }, 1000);
}

let _selectedTheme = 'cyber';

function startRound() {
  scoreManager.reset();
  powerUpManager.reset();
  const currentMode = gameModeManager.current;
  timeLeft = currentMode.duration;
  gameModeManager.startRound();
  gameManager.changeState(GameState.PLAYING);
  if (_btnQuitVr) _btnQuitVr.setAttribute('visible', 'true');
  targetSystem.start();

  musicManager.loadSettings();
  musicManager.startMusic(_selectedTheme);

  _hudScore.setAttribute('value', 'Score: 0');
  _hudCombo.setAttribute('value', '');

  // Reset timer state
  _hudTimer.removeAttribute('animation__pulse');
  _hudTimer.setAttribute('scale', '0.35 0.35 0.35');
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
      if (powerUpManager.isTimeFrozen()) {
        _hudTimer.setAttribute('color', '#00d4ff');
        return;
      }
      timeLeft--;
      _hudTimer.setAttribute('value', String(timeLeft));

      if (timeLeft <= 5) {
        _hudTimer.setAttribute('color', '#ff0000');
        _hudTimer.setAttribute('animation__pulse', {
          property: 'scale', from: '0.35 0.35 0.35', to: '0.45 0.45 0.45',
          dur: 400, loop: true, dir: 'alternate', easing: 'easeInOutSine',
        });
      } else if (timeLeft <= 10) {
        _hudTimer.setAttribute('color', '#ff4444');
        _hudTimer.setAttribute('animation__pulse', {
          property: 'scale', from: '0.35 0.35 0.35', to: '0.42 0.42 0.42',
          dur: 500, loop: true, dir: 'alternate', easing: 'easeInOutSine',
        });
      } else {
        _hudTimer.setAttribute('color', '#ffaa00');
        _hudTimer.removeAttribute('animation__pulse');
        _hudTimer.setAttribute('scale', '0.35 0.35 0.35');
      }

      if (timeLeft <= 0) {
        endGame();
      }
    }, 1000);
  }
}

async function endGame() {
  if (timerInterval) clearInterval(timerInterval);
  if (_btnQuitVr) _btnQuitVr.setAttribute('visible', 'false');
  gameManager.changeState(GameState.GAME_OVER);
  targetSystem.stop();
  powerUpManager.reset();
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

  if (levelResult.leveledUp) {
    audioManager.playLevelUp();
  }

  // VR: show 3D game over HUD and auto-return to menu
  const hudGameover = document.getElementById('hud-gameover');
  if (hudGameover) {
    const goScore = document.getElementById('hud-go-score');
    const goStats = document.getElementById('hud-go-stats');
    const goTitle = document.getElementById('hud-go-title');
    if (goScore) goScore.setAttribute('value', `Score: ${result.score}`);
    if (goStats) goStats.setAttribute('value', `Targets: ${targetSystem.targetsHit}  |  Combo: x${targetSystem.bestCombo}  |  Acc: ${summary.accuracy}%`);
    if (goTitle && isNewHigh) goTitle.setAttribute('value', 'NEW HIGH SCORE!');
    if (goTitle && isNewHigh) goTitle.setAttribute('color', '#ffd700');
    hudGameover.setAttribute('visible', 'true');

    // Hide HUD elements during game over display
    ['hud-score', 'hud-timer', 'hud-combo', 'hud-lives', 'hud-weapon', 'hud-level', 'hud-powerup', 'hud-boss'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.setAttribute('visible', 'false');
    });

    setTimeout(() => {
      hudGameover.setAttribute('visible', 'false');
      // Reset title for next game
      if (goTitle) { goTitle.setAttribute('value', 'GAME OVER'); goTitle.setAttribute('color', '#ff4444'); }
      if (_onReturnToMenu) _onReturnToMenu();
    }, 4000);
  }
}

// SPA: game is started via startGame() exported above, called from main.js
