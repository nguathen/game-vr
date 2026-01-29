import authManager from './core/auth-manager.js';
import audioManager from './core/audio-manager.js';
import { GAME_MODES } from './game/game-modes.js';
import { WEAPONS } from './game/weapon-system.js';
import leaderboardManager from './core/leaderboard-manager.js';
import { getDailyChallenge, getCurrentProgress } from './game/daily-challenge.js';
import { getAllAchievements, isUnlocked } from './game/achievements.js';
import { THEMES } from './game/environment-themes.js';
import { SKINS, isSkinUnlocked, purchaseSkin } from './game/weapon-skins.js';
import { showToast } from './ui/toast.js';
import { staggerIn } from './ui/animations.js';

let selectedMode = 'timeAttack';
let selectedWeapon = 'pistol';
let selectedTheme = 'cyber';

function navigateTo(url) {
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  setTimeout(() => { window.location.href = url; }, 300);
}

function initMenu(profile) {
  // Fade in
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  requestAnimationFrame(() => { transition.classList.remove('active'); });

  // Restore last selection
  selectedWeapon = profile.selectedWeapon || 'pistol';
  selectedTheme = profile.selectedTheme || 'cyber';

  // Player info
  updatePlayerBar(profile);

  // Premium badge
  if (profile.isPremium) {
    document.getElementById('premium-badge').classList.remove('hidden');
  }

  // Build mode grid
  buildModeGrid(profile);

  // Build weapon grid
  buildWeaponGrid(profile);

  // Theme selector (TASK-112)
  buildThemeGrid(profile);

  // Skin selector (TASK-113)
  buildSkinSelector(profile);

  // Build high scores
  buildHighScores(profile);

  // Daily challenge (TASK-107)
  buildDailyChallenge();

  // Achievements (TASK-108)
  buildAchievements(profile);

  // Leaderboard (TASK-106)
  buildLeaderboard();

  // Display name editing
  setupDisplayName(profile);

  // Navigation
  document.getElementById('btn-play').addEventListener('click', () => {
    audioManager.playSelect();
    navigateTo(`./game.html?mode=${selectedMode}&weapon=${selectedWeapon}&theme=${selectedTheme}`);
  });

  document.getElementById('btn-shop').addEventListener('click', () => {
    navigateTo('./shop.html');
  });

  document.getElementById('btn-stats')?.addEventListener('click', () => {
    navigateTo('./stats.html');
  });

  document.getElementById('btn-settings')?.addEventListener('click', () => {
    navigateTo('./settings.html');
  });

  document.getElementById('btn-friends')?.addEventListener('click', () => {
    navigateTo('./friends.html');
  });

  // Stagger animate grids (TASK-120)
  setTimeout(() => {
    staggerIn('#mode-grid .mode-card', 40);
    staggerIn('#weapon-grid .weapon-card', 40);
    staggerIn('#theme-grid .mode-card', 40);
  }, 100);
}

function updatePlayerBar(profile) {
  const levelBadge = document.getElementById('level-badge');
  const xpFill = document.getElementById('xp-fill');
  const xpText = document.getElementById('xp-text');
  const coinsDisplay = document.getElementById('coins-display');
  const gamesPlayed = document.getElementById('games-played');

  if (levelBadge) levelBadge.textContent = `Lv.${profile.level}`;
  if (coinsDisplay) coinsDisplay.textContent = `${profile.coins} Coins`;
  if (gamesPlayed) gamesPlayed.textContent = `${profile.gamesPlayed} Games`;

  const needed = authManager.xpForLevel(profile.level);
  const percent = Math.min((profile.xp / needed) * 100, 100);
  if (xpFill) xpFill.style.width = `${percent}%`;
  if (xpText) xpText.textContent = `${profile.xp} / ${needed} XP`;
}

function buildModeGrid(profile) {
  const grid = document.getElementById('mode-grid');
  grid.innerHTML = '';

  Object.values(GAME_MODES).forEach(mode => {
    const unlocked = profile.level >= mode.unlockLevel;
    const card = document.createElement('div');
    card.className = `mode-card${mode.id === selectedMode ? ' selected' : ''}${!unlocked ? ' locked' : ''}`;
    card.dataset.mode = mode.id;

    card.innerHTML = `
      <span class="mode-icon">${mode.icon}</span>
      <span class="mode-name">${mode.name}</span>
      ${!unlocked ? `<span class="lock-label">Lv.${mode.unlockLevel}</span>` : ''}
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        audioManager.playSelect();
        selectedMode = mode.id;
        grid.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    }

    grid.appendChild(card);
  });
}

function buildWeaponGrid(profile) {
  const grid = document.getElementById('weapon-grid');
  grid.innerHTML = '';

  Object.values(WEAPONS).forEach(weapon => {
    const unlocked = profile.level >= weapon.unlockLevel;
    const card = document.createElement('div');
    card.className = `weapon-card${weapon.id === selectedWeapon ? ' selected' : ''}${!unlocked ? ' locked' : ''}`;
    card.dataset.weapon = weapon.id;

    card.innerHTML = `
      <span class="weapon-icon">${weapon.icon}</span>
      <span class="weapon-name">${weapon.name}</span>
      <span class="weapon-desc">${weapon.description}</span>
      ${!unlocked ? `<span class="lock-label">Lv.${weapon.unlockLevel}</span>` : ''}
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        audioManager.playSelect();
        selectedWeapon = weapon.id;
        authManager.saveProfile({ selectedWeapon: weapon.id });
        grid.querySelectorAll('.weapon-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    }

    grid.appendChild(card);
  });
}

function buildHighScores(profile) {
  const container = document.getElementById('high-scores');
  container.innerHTML = '';

  Object.entries(profile.highScores || {}).forEach(([modeId, score]) => {
    const mode = GAME_MODES[modeId];
    if (!mode || score === 0) return;

    const row = document.createElement('div');
    row.className = 'high-score-row';
    row.innerHTML = `
      <span>${mode.icon} ${mode.name}</span>
      <span class="hs-value">${score}</span>
    `;
    container.appendChild(row);
  });

  if (container.children.length === 0) {
    container.innerHTML = '<p class="no-scores">No scores yet — play a game!</p>';
  }
}

function buildDailyChallenge() {
  const container = document.getElementById('daily-challenge');
  if (!container) return;
  const challenge = getDailyChallenge();
  const state = getCurrentProgress();
  const progress = Math.min(state.progress || 0, challenge.target);
  const pct = Math.min((progress / challenge.target) * 100, 100);

  const desc = document.createElement('div');
  desc.className = 'challenge-desc';
  desc.textContent = challenge.description;
  container.appendChild(desc);

  const bar = document.createElement('div');
  bar.className = 'challenge-bar';
  const fill = document.createElement('div');
  fill.className = 'challenge-fill';
  fill.style.width = `${pct}%`;
  bar.appendChild(fill);
  container.appendChild(bar);

  const info = document.createElement('div');
  info.className = 'challenge-info';
  if (state.completed) {
    info.textContent = 'Completed!';
    info.style.color = '#00ff88';
  } else {
    info.textContent = `${progress}/${challenge.target} — Reward: +${challenge.rewardXp} XP, +${challenge.rewardCoins} Coins`;
  }
  container.appendChild(info);
}

function buildAchievements(profile) {
  const container = document.getElementById('achievements-grid');
  if (!container) return;
  container.innerHTML = '';

  getAllAchievements().forEach(ach => {
    const card = document.createElement('div');
    const unlocked = isUnlocked(ach.id);
    card.className = `ach-card${unlocked ? ' unlocked' : ''}`;

    const icon = document.createElement('span');
    icon.className = 'ach-icon';
    icon.textContent = unlocked ? ach.icon : '🔒';

    const name = document.createElement('span');
    name.className = 'ach-name';
    name.textContent = ach.name;

    const desc = document.createElement('span');
    desc.className = 'ach-desc';
    desc.textContent = ach.description;

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(desc);
    container.appendChild(card);
  });
}

async function buildLeaderboard() {
  const container = document.getElementById('leaderboard');
  if (!container) return;

  const tabs = document.getElementById('lb-tabs');
  if (tabs) {
    tabs.innerHTML = '';
    Object.values(GAME_MODES).forEach((mode, i) => {
      const tab = document.createElement('button');
      tab.className = `lb-tab${i === 0 ? ' active' : ''}`;
      tab.textContent = mode.icon;
      tab.title = mode.name;
      tab.addEventListener('click', () => {
        tabs.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        loadLeaderboard(mode.id, container);
      });
      tabs.appendChild(tab);
    });
  }

  const firstMode = Object.keys(GAME_MODES)[0];
  await loadLeaderboard(firstMode, container);
}

async function loadLeaderboard(modeId, container) {
  const list = container.querySelector('.lb-list') || container;
  list.innerHTML = '';
  const scores = await leaderboardManager.getTopScores(modeId);

  if (scores.length === 0) {
    const p = document.createElement('p');
    p.className = 'no-scores';
    p.textContent = 'No scores yet';
    list.appendChild(p);
    return;
  }

  const uid = authManager.uid;
  scores.forEach((entry, i) => {
    const row = document.createElement('div');
    row.className = `lb-row${entry.uid === uid ? ' lb-me' : ''}`;

    const rank = document.createElement('span');
    rank.className = 'lb-rank';
    rank.textContent = `#${i + 1}`;

    const name = document.createElement('span');
    name.className = 'lb-name';
    name.textContent = entry.displayName || 'Player';

    const score = document.createElement('span');
    score.className = 'lb-score';
    score.textContent = entry.score;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(score);
    list.appendChild(row);
  });
}

function buildThemeGrid(profile) {
  const grid = document.getElementById('theme-grid');
  if (!grid) return;
  grid.innerHTML = '';

  Object.values(THEMES).forEach(theme => {
    const unlocked = profile.level >= theme.unlockLevel;
    const card = document.createElement('div');
    card.className = `mode-card${theme.id === selectedTheme ? ' selected' : ''}${!unlocked ? ' locked' : ''}`;
    card.dataset.theme = theme.id;

    card.innerHTML = `
      <span class="mode-icon">${theme.icon}</span>
      <span class="mode-name">${theme.name}</span>
      ${!unlocked ? `<span class="lock-label">Lv.${theme.unlockLevel}</span>` : ''}
    `;

    if (unlocked) {
      card.addEventListener('click', () => {
        audioManager.playSelect();
        selectedTheme = theme.id;
        authManager.saveProfile({ selectedTheme: theme.id });
        grid.querySelectorAll('.mode-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    }
    grid.appendChild(card);
  });
}

function buildSkinSelector(profile) {
  const container = document.getElementById('skin-selector');
  if (!container) return;
  container.innerHTML = '';

  const weaponSkins = profile.weaponSkins || {};
  const currentSkinId = weaponSkins[selectedWeapon] || 'default';

  Object.values(SKINS).forEach(skin => {
    const unlocked = isSkinUnlocked(skin.id, profile);
    const card = document.createElement('div');
    const isSelected = skin.id === currentSkinId;
    card.className = `skin-card${isSelected ? ' selected' : ''}${!unlocked ? ' locked' : ''}`;

    const swatch = document.createElement('span');
    swatch.className = 'skin-swatch';
    swatch.style.background = skin.laserColor || '#aaaaaa';

    const name = document.createElement('span');
    name.className = 'skin-name';
    name.textContent = skin.name;

    card.appendChild(swatch);
    card.appendChild(name);

    if (!unlocked && skin.unlockType === 'coins') {
      const cost = document.createElement('span');
      cost.className = 'skin-cost';
      cost.textContent = `${skin.unlockValue} coins`;
      card.appendChild(cost);

      card.addEventListener('click', () => {
        if (purchaseSkin(skin.id, profile, (u) => authManager.saveProfile(u))) {
          audioManager.playSelect();
          buildSkinSelector(authManager.profile);
        }
      });
    } else if (unlocked) {
      card.addEventListener('click', () => {
        audioManager.playSelect();
        const skins = { ...(profile.weaponSkins || {}), [selectedWeapon]: skin.id };
        authManager.saveProfile({ weaponSkins: skins });
        profile.weaponSkins = skins;
        container.querySelectorAll('.skin-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
      });
    } else {
      const lock = document.createElement('span');
      lock.className = 'lock-label';
      if (skin.unlockType === 'level') lock.textContent = `Lv.${skin.unlockValue}`;
      else if (skin.unlockType === 'achievement') lock.textContent = `🏆`;
      card.appendChild(lock);
    }

    container.appendChild(card);
  });
}

function setupDisplayName(profile) {
  const nameEl = document.getElementById('display-name');
  if (!nameEl) return;
  nameEl.textContent = profile.displayName || 'Player';
  nameEl.addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'name-input';
    input.value = nameEl.textContent;
    input.maxLength = 16;
    nameEl.replaceWith(input);
    input.focus();
    input.select();

    const save = () => {
      const val = input.value.trim().slice(0, 16) || 'Player';
      authManager.saveProfile({ displayName: val });
      const span = document.createElement('span');
      span.id = 'display-name';
      span.className = 'display-name';
      span.textContent = val;
      span.addEventListener('click', () => setupDisplayName({ ...profile, displayName: val }));
      input.replaceWith(span);
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') input.blur(); });
  });
}

// Wait for auth
let initialized = false;
authManager.waitReady().then(() => {
  const profile = authManager.profile;

  // Tutorial redirect for first-time players (TASK-116)
  if (!profile.tutorialCompleted) {
    window.location.href = './tutorial.html';
    return;
  }

  const safeInit = () => { if (!initialized) { initialized = true; initMenu(profile); } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
});
