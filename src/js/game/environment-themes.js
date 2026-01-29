const THEMES = {
  cyber: {
    id: 'cyber',
    name: 'Cyber Arena',
    icon: '💎',
    unlockLevel: 1,
    sky: '#0a0a1a',
    floor: '#111133',
    grid: '#1a1a4e',
    gridOpacity: 0.3,
    lights: [
      { type: 'ambient', color: '#222244', intensity: 0.4 },
      { type: 'point', position: '0 10 0', color: '#4466ff', intensity: 1.2, distance: 40 },
      { type: 'point', position: '-8 6 -8', color: '#ff4444', intensity: 0.6, distance: 25 },
      { type: 'point', position: '8 6 -8', color: '#44ff44', intensity: 0.6, distance: 25 },
      { type: 'point', position: '0 4 8', color: '#ff88ff', intensity: 0.4, distance: 20 },
    ],
    pillarColor: '#1a1a4e',
    wallColor: '#0044aa',
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Range',
    icon: '🌅',
    unlockLevel: 3,
    sky: '#1a0a05',
    floor: '#2a1a0a',
    grid: '#3a2a1a',
    gridOpacity: 0.2,
    lights: [
      { type: 'ambient', color: '#442211', intensity: 0.5 },
      { type: 'point', position: '0 10 0', color: '#ff8844', intensity: 1.0, distance: 40 },
      { type: 'point', position: '-8 6 -8', color: '#ff6622', intensity: 0.5, distance: 25 },
      { type: 'point', position: '8 6 -8', color: '#ffaa44', intensity: 0.5, distance: 25 },
      { type: 'point', position: '0 4 8', color: '#ff4400', intensity: 0.3, distance: 20 },
    ],
    pillarColor: '#3a2211',
    wallColor: '#663311',
  },
  space: {
    id: 'space',
    name: 'Deep Space',
    icon: '🌌',
    unlockLevel: 6,
    sky: '#020208',
    floor: '#0a0a15',
    grid: '#111133',
    gridOpacity: 0.15,
    lights: [
      { type: 'ambient', color: '#111122', intensity: 0.3 },
      { type: 'point', position: '0 10 0', color: '#2244ff', intensity: 1.0, distance: 40 },
      { type: 'point', position: '-8 6 -8', color: '#4488ff', intensity: 0.4, distance: 25 },
      { type: 'point', position: '8 6 -8', color: '#2266cc', intensity: 0.4, distance: 25 },
      { type: 'point', position: '0 4 8', color: '#6644ff', intensity: 0.3, distance: 20 },
    ],
    pillarColor: '#0a0a2e',
    wallColor: '#112244',
  },
  neon: {
    id: 'neon',
    name: 'Neon City',
    icon: '🏙️',
    unlockLevel: 10,
    sky: '#050510',
    floor: '#0a0a20',
    grid: '#220044',
    gridOpacity: 0.4,
    lights: [
      { type: 'ambient', color: '#110022', intensity: 0.3 },
      { type: 'point', position: '0 10 0', color: '#ff00ff', intensity: 1.2, distance: 40 },
      { type: 'point', position: '-8 6 -8', color: '#00ffff', intensity: 0.7, distance: 25 },
      { type: 'point', position: '8 6 -8', color: '#ff0088', intensity: 0.7, distance: 25 },
      { type: 'point', position: '0 4 8', color: '#00ff88', intensity: 0.4, distance: 20 },
    ],
    pillarColor: '#220044',
    wallColor: '#440088',
  },
};

function applyTheme(sceneEl, themeId) {
  const theme = THEMES[themeId] || THEMES.cyber;

  const sky = sceneEl.querySelector('a-sky');
  if (sky) sky.setAttribute('color', theme.sky);

  const floors = sceneEl.querySelectorAll('#game-scene > a-plane');
  if (floors[0]) floors[0].setAttribute('material', `color: ${theme.floor}; wireframe: false`);

  const gridPlane = sceneEl.querySelector('#floor-grid a-plane');
  if (gridPlane) {
    gridPlane.setAttribute('material', `color: ${theme.grid}; wireframe: true; wireframeLinewidth: 1; opacity: ${theme.gridOpacity}`);
  }

  // Update walls
  const walls = sceneEl.querySelectorAll('#game-scene > a-box');
  walls.forEach(wall => {
    wall.setAttribute('material', `color: ${theme.wallColor}; opacity: 0.15; shader: flat`);
  });

  // Update pillars
  const pillars = sceneEl.querySelectorAll('#game-scene > a-cylinder');
  pillars.forEach(p => {
    p.setAttribute('color', theme.pillarColor);
    p.setAttribute('material', `shader: flat; opacity: 0.5`);
  });

  // Update lights
  const existingLights = sceneEl.querySelectorAll('#game-scene > a-light');
  existingLights.forEach((light, i) => {
    if (i < theme.lights.length) {
      const l = theme.lights[i];
      light.setAttribute('type', l.type);
      light.setAttribute('color', l.color);
      light.setAttribute('intensity', String(l.intensity));
      if (l.position) light.setAttribute('position', l.position);
      if (l.distance) light.setAttribute('distance', String(l.distance));
    }
  });
}

function getThemes() {
  return THEMES;
}

function getTheme(id) {
  return THEMES[id] || THEMES.cyber;
}

export { THEMES, applyTheme, getThemes, getTheme };
export default { applyTheme, getThemes, getTheme };
