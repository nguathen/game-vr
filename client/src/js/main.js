import authManager from './core/auth-manager.js';
import { GAME_MODES } from './game/game-modes.js';
import { WEAPONS } from './game/weapon-system.js';
import { startGame as startGameSession } from './game-main.js';
import iapManager from './iap/iap-manager.js';
import { showToast } from './ui/toast.js';

let selectedMode = 'timeAttack';
let selectedWeapon = 'pistol';

function refreshRaycasters() {
  ['left-hand', 'right-hand'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.components && el.components.raycaster) {
      el.components.raycaster.refreshObjects();
    }
  });
}

function createButton(parent, { x, y, width, height, label, value, selected, locked }) {
  const plane = document.createElement('a-plane');
  plane.classList.add('clickable');
  plane.setAttribute('position', `${x} ${y} 0`);
  plane.setAttribute('width', width);
  plane.setAttribute('height', height);
  plane.setAttribute('color', locked ? '#1a1a2e' : selected ? '#00d4ff' : '#1a1a4e');
  plane.setAttribute('material', 'shader: flat; opacity: 0.85');
  plane.dataset.value = value;

  // Selected glow: child plane behind
  if (selected) {
    const glow = document.createElement('a-plane');
    glow.setAttribute('position', '0 0 -0.01');
    glow.setAttribute('width', width + 0.06);
    glow.setAttribute('height', height + 0.06);
    glow.setAttribute('color', '#00d4ff');
    glow.setAttribute('material', 'shader: flat; opacity: 0.15');
    plane.appendChild(glow);
  }

  // Hover effects
  plane.addEventListener('mouseenter', () => {
    plane.setAttribute('material', 'opacity', 1.0);
    if (!locked) {
      plane.setAttribute('animation__hover', {
        property: 'scale', to: '1.08 1.08 1.08', dur: 120, easing: 'easeOutQuad',
      });
    }
  });
  plane.addEventListener('mouseleave', () => {
    plane.setAttribute('material', 'opacity', 0.85);
    plane.setAttribute('animation__hover', {
      property: 'scale', to: '1 1 1', dur: 120, easing: 'easeOutQuad',
    });
  });

  const displayLabel = locked ? `🔒 ${label}` : label;
  const text = document.createElement('a-text');
  text.setAttribute('value', displayLabel);
  text.setAttribute('align', 'center');
  text.setAttribute('color', locked ? '#555566' : selected ? '#ffffff' : '#aaaacc');
  text.setAttribute('width', width * 3.5);
  text.setAttribute('position', '0 0 0.01');
  plane.appendChild(text);

  parent.appendChild(plane);
  return plane;
}

function buildModeButtons(profile) {
  const container = document.getElementById('mode-buttons');
  container.innerHTML = '';
  const modes = Object.values(GAME_MODES);
  const startX = -(modes.length - 1) * 0.85 / 2;

  modes.forEach((mode, i) => {
    const unlocked = profile.level >= mode.unlockLevel;
    const label = unlocked ? `${mode.icon} ${mode.name}` : `Lv.${mode.unlockLevel}`;
    const btn = createButton(container, {
      x: startX + i * 0.85, y: 0,
      width: 0.75, height: 0.3,
      label, value: mode.id,
      selected: mode.id === selectedMode,
      locked: !unlocked,
    });
    if (unlocked) {
      btn.addEventListener('click', () => {
        selectedMode = mode.id;
        buildModeButtons(profile);
        refreshRaycasters();
      });
    }
  });
}

function buildWeaponButtons(profile) {
  const container = document.getElementById('weapon-buttons');
  container.innerHTML = '';
  const weapons = Object.values(WEAPONS);
  const startX = -(weapons.length - 1) * 0.85 / 2;

  weapons.forEach((weapon, i) => {
    const unlocked = profile.level >= weapon.unlockLevel;
    const label = unlocked ? `${weapon.icon} ${weapon.name}` : `Lv.${weapon.unlockLevel}`;
    const btn = createButton(container, {
      x: startX + i * 0.85, y: 0,
      width: 0.75, height: 0.3,
      label, value: weapon.id,
      selected: weapon.id === selectedWeapon,
      locked: !unlocked,
    });
    if (unlocked) {
      btn.addEventListener('click', () => {
        selectedWeapon = weapon.id;
        buildWeaponButtons(profile);
        refreshRaycasters();
      });
    }
  });
}

// Switch from menu to game scene (SPA — no page navigation)
function switchToGame() {
  // Hide menu + shop, show game
  shopVisible = false;
  const menuContent = document.getElementById('menu-content');
  const gameContent = document.getElementById('game-content');
  const shopContent = document.getElementById('shop-content');
  menuContent.setAttribute('visible', 'false');
  if (shopContent) shopContent.setAttribute('visible', 'false');
  gameContent.setAttribute('visible', 'true');

  // Show HUD
  ['crosshair', 'crosshair-outer', 'crosshair-dot', 'hud-score', 'hud-timer', 'hud-combo', 'hud-lives', 'hud-weapon', 'hud-level', 'game-cursor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('visible', 'true');
  });

  // Switch controller raycasters from .clickable to .target
  ['left-hand', 'right-hand'].forEach(id => {
    const hand = document.getElementById(id);
    if (hand) {
      hand.setAttribute('raycaster', 'objects', '.target');
      hand.setAttribute('shoot-controls', `hand: ${id === 'left-hand' ? 'left' : 'right'}`);
      // Remove cursor component (menu mode) - not needed in game
      if (hand.components.cursor) {
        hand.removeAttribute('cursor');
      }
    }
  });

  // Enable WASD movement for game
  const camera = document.getElementById('camera');
  if (camera) {
    camera.setAttribute('wasd-controls', 'acceleration: 20');
  }

  // Enable smooth locomotion on player rig
  const rig = document.getElementById('player-rig');
  if (rig) {
    rig.setAttribute('smooth-locomotion', 'speed: 3; camera: #camera');
  }

  // Start game logic with selected mode/weapon/theme
  startGameSession({
    mode: selectedMode,
    weapon: selectedWeapon,
    theme: 'cyber',
    onReturnToMenu: switchToMenu,
  });
}

// Switch from game back to menu
function switchToMenu() {
  const menuContent = document.getElementById('menu-content');
  const gameContent = document.getElementById('game-content');
  const shopContent = document.getElementById('shop-content');
  gameContent.setAttribute('visible', 'false');
  if (shopContent) shopContent.setAttribute('visible', 'false');
  menuContent.setAttribute('visible', 'true');

  // Hide HUD
  ['crosshair', 'crosshair-outer', 'crosshair-dot', 'hud-score', 'hud-timer', 'hud-combo', 'hud-lives', 'hud-weapon', 'hud-level', 'game-cursor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.setAttribute('visible', 'false');
  });

  // Switch controller raycasters back to .clickable
  ['left-hand', 'right-hand'].forEach(id => {
    const hand = document.getElementById(id);
    if (hand) {
      hand.setAttribute('raycaster', 'objects', '.clickable');
      hand.removeAttribute('shoot-controls');
      hand.setAttribute('cursor', 'fuse: false; rayOrigin: entity');
    }
  });

  // Disable WASD
  const camera = document.getElementById('camera');
  if (camera) {
    camera.setAttribute('wasd-controls-enabled', 'false');
  }

  // Refresh menu buttons
  const profile = authManager.profile;
  if (profile) {
    buildModeButtons(profile);
    buildWeaponButtons(profile);
    const info = document.getElementById('player-info');
    if (info) info.setAttribute('value', `Lv.${profile.level} | ${profile.coins} Coins`);
  }
  refreshRaycasters();

  // Hide VR game over HUD
  const hudGameover = document.getElementById('hud-gameover');
  if (hudGameover) hudGameover.setAttribute('visible', 'false');
}

// Expose for game-main.js
window.__switchToMenu = switchToMenu;

function initMenu(profile) {
  selectedWeapon = profile.selectedWeapon || 'pistol';

  const info = document.getElementById('player-info');
  if (info) info.setAttribute('value', `Lv.${profile.level} | ${profile.coins} Coins`);

  buildModeButtons(profile);
  buildWeaponButtons(profile);
  refreshRaycasters();

  const playBtn = document.getElementById('btn-play-vr');
  if (playBtn) {
    playBtn.addEventListener('mouseenter', () => {
      playBtn.setAttribute('material', 'opacity', 1.0);
    });
    playBtn.addEventListener('mouseleave', () => {
      playBtn.setAttribute('material', 'opacity', 0.9);
    });
    playBtn.addEventListener('click', () => {
      switchToGame();
    });
  }

  // Shop button
  const shopBtn = document.getElementById('btn-shop-vr');
  if (shopBtn) {
    shopBtn.addEventListener('mouseenter', () => {
      shopBtn.setAttribute('material', 'opacity', 1.0);
    });
    shopBtn.addEventListener('mouseleave', () => {
      shopBtn.setAttribute('material', 'opacity', 0.9);
    });
    shopBtn.addEventListener('click', () => switchToShop());
  }

  // Shop back button
  const shopBackBtn = document.getElementById('btn-shop-back');
  if (shopBackBtn) {
    shopBackBtn.addEventListener('mouseenter', () => {
      shopBackBtn.setAttribute('material', 'opacity', 1.0);
    });
    shopBackBtn.addEventListener('mouseleave', () => {
      shopBackBtn.setAttribute('material', 'opacity', 0.9);
    });
    shopBackBtn.addEventListener('click', () => switchFromShop());
  }

  // Init IAP manager
  iapManager.init().catch(() => {});
}

// Direct Three.js raycasting — bypasses A-Frame cursor system entirely
function setupMouseClick(scene) {
  const canvas = scene.canvas;
  if (!canvas) return;

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const camera = scene.camera;
    raycaster.setFromCamera(mouse, camera);

    const clickables = [];
    const hiddenContainers = ['menu-content', 'shop-content', 'game-content']
      .map(id => document.getElementById(id))
      .filter(el => el && !el.object3D.visible);

    scene.querySelectorAll('.clickable').forEach(el => {
      if (!el.object3D || !el.object3D.visible) return;
      // Skip elements inside a hidden content container
      if (hiddenContainers.some(c => c.contains(el))) return;
      el.object3D.traverse(child => {
        if (child.isMesh) {
          child.__aframeEl = el;
          clickables.push(child);
        }
      });
    });

    const hits = raycaster.intersectObjects(clickables, false);
    if (hits.length > 0) {
      const el = hits[0].object.__aframeEl;
      if (el) el.emit('click', {}, true);
    }
  });
}

// VR controller click
function setupControllerClick(scene) {
  ['left-hand', 'right-hand'].forEach(id => {
    const hand = document.getElementById(id);
    if (!hand) return;

    const doClick = () => {
      const rc = hand.components.raycaster;
      if (!rc) return;
      const els = rc.intersectedEls;
      if (els && els.length > 0) {
        els[0].emit('click', {}, true);
      }
    };

    hand.addEventListener('triggerdown', doClick);
    hand.addEventListener('selectstart', doClick);
    hand.addEventListener('gripdown', doClick);
  });
}

// ==================== SHOP ====================

function switchToShop() {
  document.getElementById('menu-content').setAttribute('visible', 'false');
  document.getElementById('shop-content').setAttribute('visible', 'true');
  shopVisible = true;
  buildShopCards();
  setTimeout(() => refreshRaycasters(), 100);
}

function switchFromShop() {
  shopVisible = false;
  document.getElementById('shop-content').setAttribute('visible', 'false');
  document.getElementById('menu-content').setAttribute('visible', 'true');
  // Update coins on menu
  const profile = authManager.profile;
  if (profile) {
    const info = document.getElementById('player-info');
    if (info) info.setAttribute('value', `Lv.${profile.level} | ${profile.coins} Coins`);
  }
  setTimeout(() => refreshRaycasters(), 100);
}

function buildShopCards() {
  const container = document.getElementById('shop-cards');
  container.innerHTML = '';

  const products = iapManager.products;
  const startX = -(products.length - 1) * 1.1 / 2;

  // Update balance
  const balanceEl = document.getElementById('shop-balance');
  const profile = authManager.profile;
  if (balanceEl && profile) {
    const premiumBadge = profile.isPremium ? ' | Premium' : '';
    balanceEl.setAttribute('value', `${profile.coins || 0} Coins${premiumBadge}`);
  }

  products.forEach((product, i) => {
    const x = startX + i * 1.15;
    const owned = product.type === 'non_consumable' && iapManager.isOwned(product.id);

    // Card glow (behind card)
    const cardGlow = document.createElement('a-plane');
    cardGlow.setAttribute('position', `${x} 0 -0.02`);
    cardGlow.setAttribute('width', '1.06');
    cardGlow.setAttribute('height', '1.36');
    cardGlow.setAttribute('color', owned ? '#44ff44' : '#00d4ff');
    cardGlow.setAttribute('material', 'shader: flat; opacity: 0.06');
    container.appendChild(cardGlow);

    // Card background
    const card = document.createElement('a-plane');
    card.setAttribute('position', `${x} 0 0`);
    card.setAttribute('width', '1.0');
    card.setAttribute('height', '1.3');
    card.setAttribute('color', owned ? '#1a3a1a' : '#1a1a3a');
    card.setAttribute('material', 'shader: flat; opacity: 0.9');

    // Hover effect on card
    card.addEventListener('mouseenter', () => {
      card.setAttribute('material', 'opacity', 1.0);
      cardGlow.setAttribute('material', 'opacity', 0.12);
    });
    card.addEventListener('mouseleave', () => {
      card.setAttribute('material', 'opacity', 0.9);
      cardGlow.setAttribute('material', 'opacity', 0.06);
    });

    // Product icon
    const icon = document.createElement('a-text');
    const emoji = product.type === 'consumable' ? '🪙' : '⭐';
    icon.setAttribute('value', emoji);
    icon.setAttribute('position', '0 0.42 0.01');
    icon.setAttribute('align', 'center');
    icon.setAttribute('width', '3.5');
    card.appendChild(icon);

    // Product name
    const name = document.createElement('a-text');
    name.setAttribute('value', product.name);
    name.setAttribute('position', '0 0.15 0.01');
    name.setAttribute('align', 'center');
    name.setAttribute('color', '#ffffff');
    name.setAttribute('width', '2.8');
    card.appendChild(name);

    // Description
    const desc = document.createElement('a-text');
    desc.setAttribute('value', product.description);
    desc.setAttribute('position', '0 -0.02 0.01');
    desc.setAttribute('align', 'center');
    desc.setAttribute('color', '#888899');
    desc.setAttribute('width', '2');
    card.appendChild(desc);

    // Separator line
    const sep = document.createElement('a-plane');
    sep.setAttribute('position', '0 -0.18 0.01');
    sep.setAttribute('width', '0.7');
    sep.setAttribute('height', '0.002');
    sep.setAttribute('color', '#444466');
    sep.setAttribute('material', 'shader: flat; opacity: 0.5');
    card.appendChild(sep);

    // Price
    const price = document.createElement('a-text');
    price.setAttribute('value', iapManager.getDisplayPrice(product));
    price.setAttribute('position', '0 -0.3 0.01');
    price.setAttribute('align', 'center');
    price.setAttribute('color', '#ffd700');
    price.setAttribute('width', '2.8');
    card.appendChild(price);

    // Buy button
    const btn = document.createElement('a-plane');
    btn.classList.add('clickable');
    btn.setAttribute('position', `0 -0.5 0.02`);
    btn.setAttribute('width', '0.75');
    btn.setAttribute('height', '0.22');

    const btnText = document.createElement('a-text');
    btnText.setAttribute('position', '0 0 0.01');
    btnText.setAttribute('align', 'center');
    btnText.setAttribute('width', '3');

    if (owned) {
      btn.setAttribute('color', '#444444');
      btn.setAttribute('material', 'shader: flat; opacity: 0.7');
      btnText.setAttribute('value', '✓ OWNED');
      btnText.setAttribute('color', '#88ff88');
    } else {
      btn.setAttribute('color', '#006644');
      btn.setAttribute('material', 'shader: flat; opacity: 0.9');
      btnText.setAttribute('value', 'BUY');
      btnText.setAttribute('color', '#00ff88');

      btn.addEventListener('mouseenter', () => {
        btn.setAttribute('material', 'opacity', 1.0);
      });
      btn.addEventListener('mouseleave', () => {
        btn.setAttribute('material', 'opacity', 0.9);
      });
      btn.addEventListener('click', () => handlePurchase(product));
    }

    btn.appendChild(btnText);
    card.appendChild(btn);
    container.appendChild(card);
  });

  refreshRaycasters();
}

let shopVisible = false;

async function handlePurchase(product) {
  if (!shopVisible) return;
  try {
    const result = await iapManager.purchase(product.id);
    if (result.success) {
      const msg = product.type === 'consumable'
        ? `Purchased! +${product.coinAmount} Coins`
        : `${product.name} unlocked!`;
      showToast(msg, 'success');
      buildShopCards();
    }
  } catch (err) {
    showToast('Purchase failed', 'error');
    console.warn('[Shop] Purchase error:', err.message);
  }
}

authManager.waitReady().then(() => {
  const profile = authManager.profile;
  const scene = document.getElementById('scene');

  const init = () => {
    initMenu(profile);
    setupMouseClick(scene);
    setupControllerClick(scene);

    // Auto-enter VR on Quest (required for scene to be visible)
    if (navigator.xr && scene.enterVR) {
      navigator.xr.isSessionSupported('immersive-vr').then(ok => {
        if (ok && !scene.is('vr-mode')) scene.enterVR();
      }).catch(() => {});
    }
  };
  if (scene.hasLoaded) init();
  else scene.addEventListener('loaded', init);
});
