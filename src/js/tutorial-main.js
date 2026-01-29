import authManager from './core/auth-manager.js';
import audioManager from './core/audio-manager.js';

const STEPS = [
  {
    id: 'look',
    step: 'Step 1 / 5',
    instruction: 'Look around by moving your head or mouse',
    hint: 'Rotate the camera to continue',
  },
  {
    id: 'shoot',
    step: 'Step 2 / 5',
    instruction: 'Aim at the target and click (or pull the trigger) to shoot!',
    hint: 'Hit the green target',
  },
  {
    id: 'types',
    step: 'Step 3 / 5',
    instruction: 'Different target types give different points',
    hint: 'Hit each target as it appears',
  },
  {
    id: 'combo',
    step: 'Step 4 / 5',
    instruction: 'Hit targets quickly for combo multiplier!',
    hint: 'Hit all 3 targets without pausing',
  },
  {
    id: 'done',
    step: 'Step 5 / 5',
    instruction: "You're ready! Let's go!",
    hint: '',
  },
];

let currentStep = 0;
let cameraStartRot = null;
let targetsHitInStep = 0;
let stepTargetsNeeded = 0;

function init() {
  const transition = document.getElementById('transition');
  transition.classList.add('active');
  requestAnimationFrame(() => transition.classList.remove('active'));

  audioManager.loadSettings();

  // Expose dummy weapon system for shoot-controls component
  window.__weaponSystem = {
    current: { id: 'pistol', damage: 1, fireRate: 0.25, pellets: 1, spread: 0, laserColor: '#ff4444', laserOpacity: 0.7 },
    currentId: 'pistol',
  };

  showStep(0);
  startStepLogic(0);

  document.getElementById('btn-start').addEventListener('click', () => {
    transition.classList.add('active');
    setTimeout(() => { window.location.href = './index.html'; }, 300);
  });
}

function showStep(index) {
  const step = STEPS[index];
  document.getElementById('tutorial-step').textContent = step.step;
  document.getElementById('tutorial-instruction').textContent = step.instruction;
  document.getElementById('tutorial-hint').textContent = step.hint;
}

function advanceStep() {
  currentStep++;
  targetsHitInStep = 0;
  if (currentStep >= STEPS.length - 1) {
    completeTutorial();
    return;
  }
  audioManager.playSelect();
  showStep(currentStep);
  startStepLogic(currentStep);
}

function completeTutorial() {
  document.getElementById('tutorial-overlay').classList.add('hidden');
  document.getElementById('tutorial-complete').classList.remove('hidden');
  audioManager.playLevelUp();
  authManager.saveProfile({ tutorialCompleted: true });
}

function startStepLogic(index) {
  const step = STEPS[index];

  if (step.id === 'look') {
    const camera = document.getElementById('camera');
    cameraStartRot = null;
    const checkLook = () => {
      const rot = camera.getAttribute('rotation');
      if (!cameraStartRot) {
        cameraStartRot = { x: rot.x, y: rot.y };
        requestAnimationFrame(checkLook);
        return;
      }
      const dy = Math.abs(rot.y - cameraStartRot.y);
      const dx = Math.abs(rot.x - cameraStartRot.x);
      if (dy > 60 || dx > 40) {
        advanceStep();
        return;
      }
      requestAnimationFrame(checkLook);
    };
    requestAnimationFrame(checkLook);
  }

  if (step.id === 'shoot') {
    stepTargetsNeeded = 1;
    spawnTutorialTarget('standard', '#2ed573', 0, 2, -5);
  }

  if (step.id === 'types') {
    stepTargetsNeeded = 3;
    document.getElementById('tutorial-hint').textContent = 'Green = +10 points. Hit it!';
    spawnTutorialTarget('standard', '#2ed573', -2, 2, -6, () => {
      document.getElementById('tutorial-hint').textContent = 'Gold = +50 bonus! Hit it!';
      spawnTutorialTarget('bonus', '#ffd700', 0, 2.5, -6, () => {
        document.getElementById('tutorial-hint').textContent = 'Red = Decoy! Avoid these!';
        spawnDecoyDemo(2, 2, -6);
      });
    });
  }

  if (step.id === 'combo') {
    stepTargetsNeeded = 3;
    document.getElementById('tutorial-hint').textContent = 'Hit 3 targets quickly!';
    spawnTutorialTarget('standard', '#2ed573', -2, 2, -5);
    setTimeout(() => spawnTutorialTarget('standard', '#1e90ff', 0, 2.5, -6), 200);
    setTimeout(() => spawnTutorialTarget('standard', '#a855f7', 2, 2, -5), 400);
  }
}

function spawnTutorialTarget(type, color, x, y, z, onDestroy) {
  const container = document.getElementById('target-container');
  const el = document.createElement('a-sphere');
  el.setAttribute('class', 'target');
  el.setAttribute('radius', type === 'bonus' ? '0.25' : '0.3');
  el.setAttribute('material', `shader: flat; color: ${color}`);
  el.setAttribute('position', `${x} ${y} ${z}`);
  el.setAttribute('target-hit', `hp: 1; targetType: ${type}`);
  el.setAttribute('animation__spawn', {
    property: 'scale', from: '0 0 0', to: '1 1 1',
    dur: 300, easing: 'easeOutElastic',
  });
  el.setAttribute('animation__float', {
    property: 'position',
    to: `${x} ${y + 0.3} ${z}`,
    dur: 1500, easing: 'easeInOutSine', loop: true, dir: 'alternate',
  });

  el.addEventListener('destroyed', () => {
    targetsHitInStep++;
    audioManager.playHit();
    if (onDestroy) {
      setTimeout(onDestroy, 500);
    } else if (targetsHitInStep >= stepTargetsNeeded) {
      setTimeout(() => advanceStep(), 600);
    }
  });

  container.appendChild(el);
  audioManager.playSpawn();
}

function spawnDecoyDemo(x, y, z) {
  const container = document.getElementById('target-container');
  const el = document.createElement('a-sphere');
  el.setAttribute('class', 'target');
  el.setAttribute('radius', '0.3');
  el.setAttribute('material', 'shader: flat; color: #882222');
  el.setAttribute('position', `${x} ${y} ${z}`);
  el.setAttribute('target-hit', 'hp: 1; targetType: decoy');
  el.setAttribute('animation__spawn', {
    property: 'scale', from: '0 0 0', to: '1 1 1',
    dur: 300, easing: 'easeOutElastic',
  });

  // Auto-advance after 3s whether hit or not
  const timer = setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
    targetsHitInStep = stepTargetsNeeded;
    advanceStep();
  }, 3000);

  el.addEventListener('destroyed', () => {
    clearTimeout(timer);
    audioManager.playMiss();
    document.getElementById('tutorial-hint').textContent = 'Oops! Red targets lose points. Avoid them!';
    setTimeout(() => {
      targetsHitInStep = stepTargetsNeeded;
      advanceStep();
    }, 1500);
  });

  container.appendChild(el);
}

let initialized = false;
authManager.waitReady().then(() => {
  const safeInit = () => { if (!initialized) { initialized = true; init(); } };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
  } else {
    safeInit();
  }
});
