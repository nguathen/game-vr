import authManager from './core/auth-manager.js';
import { GAME_MODES } from './game/game-modes.js';
import { WEAPONS } from './game/weapon-system.js';

let selectedMode = 'timeAttack';
let selectedWeapon = 'pistol';

function createButton(parent, { x, y, width, height, label, value, selected }) {
  const plane = document.createElement('a-plane');
  plane.classList.add('clickable');
  plane.setAttribute('position', `${x} ${y} 0`);
  plane.setAttribute('width', width);
  plane.setAttribute('height', height);
  plane.setAttribute('color', selected ? '#00d4ff' : '#1a1a4e');
  plane.setAttribute('material', 'shader: flat; opacity: 0.85');
  plane.dataset.value = value;

  const text = document.createElement('a-text');
  text.setAttribute('value', label);
  text.setAttribute('align', 'center');
  text.setAttribute('color', selected ? '#ffffff' : '#aaaacc');
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
      selected: mode.id === selectedMode
    });
    if (unlocked) {
      btn.addEventListener('click', () => {
        selectedMode = mode.id;
        buildModeButtons(profile);
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
      selected: weapon.id === selectedWeapon
    });
    if (unlocked) {
      btn.addEventListener('click', () => {
        selectedWeapon = weapon.id;
        buildWeaponButtons(profile);
      });
    }
  });
}

function initMenu(profile) {
  selectedWeapon = profile.selectedWeapon || 'pistol';

  const info = document.getElementById('player-info');
  if (info) info.setAttribute('value', `Lv.${profile.level} | ${profile.coins} Coins`);

  buildModeButtons(profile);
  buildWeaponButtons(profile);

  const playBtn = document.getElementById('btn-play-vr');
  if (playBtn) {
    playBtn.addEventListener('click', () => {
      window.location.href = `./game.html?mode=${selectedMode}&weapon=${selectedWeapon}&theme=cyber`;
    });
  }
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
    scene.querySelectorAll('.clickable').forEach(el => {
      if (el.object3D) {
        el.object3D.traverse(child => {
          if (child.isMesh) {
            child.__aframeEl = el;
            clickables.push(child);
          }
        });
      }
    });

    const hits = raycaster.intersectObjects(clickables, false);
    if (hits.length > 0) {
      const el = hits[0].object.__aframeEl;
      if (el) el.emit('click', {}, true);
    }
  });
}

// VR controller click — cursor component on hands handles click emission
// This is a fallback for additional trigger events
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

  // Also listen for click on all .clickable elements (cursor component emits these)
  scene.querySelectorAll('.clickable').forEach(el => {
    el.addEventListener('mouseenter', () => {
      el.setAttribute('material', 'opacity', 1.0);
    });
    el.addEventListener('mouseleave', () => {
      el.setAttribute('material', 'opacity', 0.85);
    });
  });
}

// Auto-enter VR
function autoEnterVR() {
  const scene = document.getElementById('scene');
  if (!scene) return;
  const enter = () => {
    if (scene.is('vr-mode') || !navigator.xr) return;
    navigator.xr.isSessionSupported('immersive-vr').then(ok => {
      if (ok && scene.enterVR) scene.enterVR();
    }).catch(() => {});
  };
  if (scene.hasLoaded) enter();
  else scene.addEventListener('loaded', enter);
}

autoEnterVR();

authManager.waitReady().then(() => {
  const profile = authManager.profile;
  const scene = document.getElementById('scene');

  const init = () => {
    initMenu(profile);
    setupMouseClick(scene);
    setupControllerClick(scene);
  };
  if (scene.hasLoaded) init();
  else scene.addEventListener('loaded', init);
});
