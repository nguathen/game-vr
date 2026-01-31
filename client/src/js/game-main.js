import './core/error-handler.js';
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
import { getSettings, getDifficultyPreset } from './game/settings-util.js';
import musicManager from './core/music-manager.js';
import { buildSummary } from './game/game-summary.js';
import powerUpManager from './game/power-up-manager.js';
import hapticManager from './core/haptic-manager.js';
import weatherSystem from './game/weather-system.js';
import arenaReactions from './game/arena-reactions.js';
import { getCurrentChallenge, getDaysRemaining } from './game/weekly-challenge.js';
import { checkNewUnlocks } from './game/unlock-tooltips.js';

const COUNTDOWN_FROM = 3;

let targetSystem;
let timerInterval;
let timeLeft;
let _gameStartTime = 0;
let _onReturnToMenu;
let _initialized = false;

// Expose systems to A-Frame components (non-module)
window.__weaponSystem = weaponSystem;
window.__hapticManager = hapticManager;
window.__audioManager = audioManager;

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

  // Shield block bonus points (TASK-254)
  document.addEventListener('shield-block', (e) => {
    if (gameManager.state !== GameState.PLAYING) return;
    const pts = e.detail?.points || 5;
    scoreManager.add(pts);
    // Damage number at block position
    if (e.detail?.pos && _scene) {
      const pos = e.detail.pos;
      const el = document.createElement('a-entity');
      el.setAttribute('position', `${pos.x} ${pos.y + 0.3} ${pos.z}`);
      el.setAttribute('damage-number', `text: +${pts} BLOCK; color: #4488ff`);
      _scene.appendChild(el);
    }
  });

  // Scare ball dodge bonus (TASK-255)
  document.addEventListener('scare-dodge', (e) => {
    if (gameManager.state !== GameState.PLAYING) return;
    const pts = e.detail?.points || 3;
    scoreManager.add(pts);
    if (e.detail?.pos && _scene) {
      const pos = e.detail.pos;
      const el = document.createElement('a-entity');
      el.setAttribute('position', `${pos.x} ${pos.y + 0.3} ${pos.z}`);
      el.setAttribute('damage-number', `text: DODGE! +${pts}; color: #00ffff`);
      _scene.appendChild(el);
    }
  });

  // Punch hit bonus (TASK-256)
  document.addEventListener('punch-hit', (e) => {
    if (gameManager.state !== GameState.PLAYING) return;
    if (e.detail?.pos && _scene) {
      const pos = e.detail.pos;
      const el = document.createElement('a-entity');
      el.setAttribute('position', `${pos.x} ${pos.y + 0.3} ${pos.z}`);
      el.setAttribute('damage-number', `text: PUNCH!; color: #ff8800`);
      _scene.appendChild(el);
    }
  });

  // Laser dodge bonus (TASK-258)
  document.addEventListener('laser-dodge', (e) => {
    if (gameManager.state !== GameState.PLAYING) return;
    const pts = e.detail?.points || 5;
    scoreManager.add(pts);
    if (e.detail?.pos && _scene) {
      const pos = e.detail.pos;
      const el = document.createElement('a-entity');
      el.setAttribute('position', `${pos.x} ${pos.y + 0.3} ${pos.z}`);
      el.setAttribute('damage-number', `text: DODGE! +${pts}; color: #ff4444`);
      _scene.appendChild(el);
    }
  });

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

  const diff = getDifficultyPreset(getSettings());
  const challenge = getCurrentChallenge();
  const cMod = challenge.modifiers || {};
  const lifetimeMul = diff.lifetimeMul * (cMod.lifetimeMul || 1);
  targetSystem = new TargetSystem(container, {
    spawnInterval: Math.round(mode.spawnInterval * diff.spawnMul),
    maxTargets: Math.round(mode.maxTargets * diff.maxTargetsMul),
    targetLifetime: Math.round(mode.targetLifetime * lifetimeMul),
    bossMode: mode.id === 'bossRush',
    challengeModifiers: cMod,
  });

  audioManager.loadSettings();

  _selectedTheme = themeParam || authManager.profile?.selectedTheme || 'cyber';
  applyTheme(_scene, _selectedTheme);

  const settings = getSettings();

  // TASK-260: Weather system
  weatherSystem.init(_scene);
  const weatherEnabled = settings.weather !== false;
  weatherSystem.setEnabled(weatherEnabled);
  weatherSystem.setTheme(_selectedTheme);

  // TASK-262: Arena reactions
  arenaReactions.init(_scene);
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

  // Auto-hide level & weapon labels after 3s (reduce clutter)
  setTimeout(() => {
    if (_hudLevel) _hudLevel.setAttribute('visible', 'false');
    if (_hudWeapon) _hudWeapon.setAttribute('visible', 'false');
  }, 3000);

  _updateLivesDisplay();

  // Ambient environment motion
  _startAmbientMotion(_scene);

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

      // HUD pulse — frequency increases with combo
      const pulseDur = combo >= 15 ? 200 : combo >= 10 ? 300 : combo >= 5 ? 500 : 700;
      _hudCombo.setAttribute('animation__pop', {
        property: 'scale',
        from: '0.5 0.5 0.5', to: '0.4 0.4 0.4',
        dur: pulseDur, easing: 'easeOutElastic',
        loop: true, dir: 'alternate',
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

      // Bass drop zoom-out snap at milestone combos (x5, x10, x15, x20...)
      if (combo % 5 === 0 && combo >= 5) {
        const zoomDur = combo >= 15 ? 300 : combo >= 10 ? 250 : 200;
        document.dispatchEvent(new CustomEvent('camera-impact-zoom', { detail: { duration: zoomDur } }));
        hapticManager.combo(combo);
      }

      // Combo vignette overlay
      _updateComboVignette(combo);

      // Arena barrier glow intensifies with combo
      _updateBarrierComboGlow(combo);

      // Dynamic music intensity
      musicManager.setIntensity(combo);
    } else {
      _hudCombo.setAttribute('value', '');
      _hudCombo.removeAttribute('animation__pop');
      _updateComboVignette(0);
      _updateBarrierComboGlow(0);
      musicManager.setIntensity(0);
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

  // Player damage from projectiles, chargers, danger zones (TASK-250/251/253)
  targetSystem.onPlayerDamage = (source) => {
    // TASK-271: Shield absorbs hit
    if (powerUpManager.consumeShield()) {
      audioManager.playShieldBlock({ x: 0, y: 1.5, z: 0 });
      hapticManager.pulse(0.6, 80);
      if (_scene) {
        const el = document.createElement('a-entity');
        el.setAttribute('position', '0 1.5 -0.5');
        el.setAttribute('damage-number', 'text: SHIELDED!; color: #4488ff');
        _scene.appendChild(el);
      }
      return;
    }
    const currentMode = gameModeManager.current;
    if (currentMode.lives !== Infinity) {
      const dead = gameModeManager.loseLife();
      _updateLivesDisplay();
      if (dead) endGame();
    } else {
      // Time attack: deduct points
      scoreManager.add(source === 'dangerZone' ? -10 : -20);
    }
    // Camera shake on damage
    document.dispatchEvent(new CustomEvent('camera-shake', { detail: { intensity: 0.02, duration: 200 } }));
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

  // Minimal HUD: hide everything except score + timer + crosshair
  if (settings.minimalHud) {
    if (_hudCombo) _hudCombo.setAttribute('visible', 'false');
    if (_hudLives) _hudLives.setAttribute('visible', 'false');
    if (_hudWeapon) _hudWeapon.setAttribute('visible', 'false');
    if (_hudLevel) _hudLevel.setAttribute('visible', 'false');
    if (_hudPowerup) _hudPowerup.setAttribute('visible', 'false');
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
  _gameStartTime = Date.now();
  gameModeManager.startRound();
  gameManager.changeState(GameState.PLAYING);
  if (_btnQuitVr) _btnQuitVr.setAttribute('visible', 'true');
  targetSystem.start();

  musicManager.loadSettings();
  musicManager.startMusic(_selectedTheme);

  _hudScore.setAttribute('value', 'Score: 0');
  // Show weekly challenge banner briefly
  const wc = getCurrentChallenge();
  _hudCombo.setAttribute('value', `${wc.icon} ${wc.name}`);
  _hudCombo.setAttribute('color', '#ffd700');
  setTimeout(() => { if (_hudCombo) _hudCombo.setAttribute('value', ''); }, 3000);

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
  weatherSystem.stop();
  document.dispatchEvent(new CustomEvent('game-over-reactions'));
  arenaReactions.stop();
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
  if (!ms[currentMode.id]) ms[currentMode.id] = { games: 0, shots: 0, hits: 0 };
  ms[currentMode.id].games++;
  ms[currentMode.id].shots = (ms[currentMode.id].shots || 0) + (summary.shotsFired || 0);
  ms[currentMode.id].hits = (ms[currentMode.id].hits || 0) + (summary.targetsHit || 0);
  const recent = [...(profile.recentGames || [])];
  recent.push({ mode: currentMode.id, weapon: weaponId, score: result.score, targets: targetSystem.targetsHit, date: Date.now() });
  if (recent.length > 10) recent.shift();
  // Enhanced stats tracking
  const totalShotsFired = (profile.totalShotsFired || 0) + (summary.shotsFired || 0);
  const gameDuration = Math.round((Date.now() - _gameStartTime) / 1000);
  const totalPlayTime = (profile.totalPlayTime || 0) + gameDuration;
  const bestAccuracy = Math.max(profile.bestAccuracy || 0, summary.accuracy || 0);
  // Per-weapon detailed stats
  const pws = { ...(profile.perWeaponStats || {}) };
  if (!pws[weaponId]) pws[weaponId] = { kills: 0, shots: 0, games: 0, bestScore: 0 };
  pws[weaponId].kills += summary.targetsHit || 0;
  pws[weaponId].shots += summary.shotsFired || 0;
  pws[weaponId].games++;
  pws[weaponId].bestScore = Math.max(pws[weaponId].bestScore, result.score);
  await authManager.saveProfile({ weaponUsage: wu, modeStats: ms, recentGames: recent, totalShotsFired, totalPlayTime, bestAccuracy, perWeaponStats: pws });

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
    checkNewUnlocks(levelResult.oldLevel, levelResult.newLevel);
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

// === Ambient Environment Motion (TASK-243) ===

function _startAmbientMotion(sceneEl) {
  const gc = sceneEl.querySelector('#game-content') || sceneEl;

  // Barrier shimmer: each barrier gets offset phase opacity oscillation
  const barriers = gc.querySelectorAll('.arena-barrier');
  barriers.forEach((b, i) => {
    const phase = i * 800;
    b.setAttribute('animation__shimmer', {
      property: 'material.opacity',
      from: 0.01, to: 0.04,
      dur: 2500 + phase,
      loop: true, dir: 'alternate',
      easing: 'easeInOutSine',
    });
  });

  // Point lights breathing: slow intensity oscillation with offset per light
  const lights = gc.querySelectorAll('a-light[type="point"]');
  lights.forEach((l, i) => {
    const baseIntensity = parseFloat(l.getAttribute('intensity') || '0.6');
    const low = Math.max(0.1, baseIntensity - 0.2);
    const high = baseIntensity + 0.15;
    l.setAttribute('animation__breathe', {
      property: 'intensity',
      from: low, to: high,
      dur: 3000 + i * 700,
      loop: true, dir: 'alternate',
      easing: 'easeInOutSine',
    });
  });

  // Ground fog layer (subtle translucent plane at floor level)
  const existingFog = gc.querySelector('#ground-fog');
  if (!existingFog) {
    const fog = document.createElement('a-plane');
    fog.id = 'ground-fog';
    fog.setAttribute('position', '0 0.05 0');
    fog.setAttribute('rotation', '-90 0 0');
    fog.setAttribute('width', '30');
    fog.setAttribute('height', '30');
    fog.setAttribute('material', 'shader: flat; color: #aabbff; opacity: 0.015; transparent: true');
    fog.setAttribute('animation__fogpulse', {
      property: 'material.opacity',
      from: 0.01, to: 0.025,
      dur: 5000, loop: true, dir: 'alternate',
      easing: 'easeInOutSine',
    });
    gc.appendChild(fog);
  }

  // Pillar glow rings: responsive to combo (speed up rotation)
  const pillarToruses = gc.querySelectorAll('.arena-pillar a-torus');
  pillarToruses.forEach((t, i) => {
    t.setAttribute('animation__combospin', {
      property: 'rotation',
      to: `0 360 0`,
      dur: 6000 + i * 500,
      loop: true, easing: 'linear',
    });
  });
}

// === Combo Juice Helpers (TASK-227) ===

function _updateComboVignette(combo) {
  let vignette = document.getElementById('combo-vignette');
  if (!vignette) {
    vignette = document.createElement('div');
    vignette.id = 'combo-vignette';
    vignette.className = 'combo-vignette';
    document.body.appendChild(vignette);
  }
  // Remove all combo classes
  vignette.classList.remove('active', 'combo-low', 'combo-mid', 'combo-high');

  if (combo >= 10) {
    vignette.classList.add('active', 'combo-high');
  } else if (combo >= 5) {
    vignette.classList.add('active', 'combo-mid');
  } else if (combo >= 3) {
    vignette.classList.add('active', 'combo-low');
  }
}

function _updateBarrierComboGlow(combo) {
  const barriers = document.querySelectorAll('.arena-barrier');
  if (combo >= 10) {
    barriers.forEach(b => b.setAttribute('material', 'opacity', 0.06));
  } else if (combo >= 5) {
    barriers.forEach(b => b.setAttribute('material', 'opacity', 0.035));
  } else {
    barriers.forEach(b => b.setAttribute('material', 'opacity', 0.015));
  }

  // Pillar ring rotation speed scales with combo
  const pillarToruses = document.querySelectorAll('.arena-pillar a-torus');
  const baseDur = 6000;
  const speedFactor = combo >= 15 ? 0.3 : combo >= 10 ? 0.5 : combo >= 5 ? 0.7 : 1.0;
  pillarToruses.forEach((t, i) => {
    t.setAttribute('animation__combospin', 'dur', Math.round((baseDur + i * 500) * speedFactor));
  });
}

// SPA: game is started via startGame() exported above, called from main.js
