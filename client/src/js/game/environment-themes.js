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
    wallOpacity: 0.12,
    floorRingColor1: '#00d4ff',
    floorRingColor2: '#ff44aa',
    pillarGlowColor: '#00d4ff',
    // Decorations defined in HTML (default arena)
    decorations: [],
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
    wallOpacity: 0.12,
    floorRingColor1: '#ff6600',
    floorRingColor2: '#ff2200',
    pillarGlowColor: '#ff8844',
    decorations: [
      // Sunset horizon glow
      { tag: 'a-sphere', position: '0 1 -30', radius: '8', material: 'shader: flat; color: #ff4400; opacity: 0.06' },
      { tag: 'a-sphere', position: '0 0 -28', radius: '12', material: 'shader: flat; color: #ff8800; opacity: 0.03' },
      // Heat haze rings
      { tag: 'a-torus', position: '0 0.5 -10', rotation: '-90 0 0', radius: '6', 'radius-tubular': '0.05', material: 'color: #ff6600; emissive: #ff6600; emissiveIntensity: 0.4; opacity: 0.08', animation: 'property: rotation; from: -90 0 0; to: -90 0 360; dur: 25000; easing: linear; loop: true' },
    ],
  },
  space: {
    id: 'space',
    name: 'Deep Space',
    icon: '🌌',
    unlockLevel: 6,
    sky: '#010105',
    floor: '#060610',
    grid: '#0a0a22',
    gridOpacity: 0.1,
    lights: [
      { type: 'ambient', color: '#0a0a18', intensity: 0.25 },
      { type: 'point', position: '0 10 0', color: '#2244ff', intensity: 0.8, distance: 40 },
      { type: 'point', position: '-8 6 -8', color: '#4488ff', intensity: 0.4, distance: 25 },
      { type: 'point', position: '8 6 -8', color: '#2266cc', intensity: 0.4, distance: 25 },
      { type: 'point', position: '0 4 8', color: '#6644ff', intensity: 0.3, distance: 20 },
    ],
    pillarColor: '#080820',
    wallColor: '#0a1133',
    wallOpacity: 0.06,
    floorRingColor1: '#2244ff',
    floorRingColor2: '#6644ff',
    pillarGlowColor: '#4488ff',
    decorations: [
      // === PLANET (distant, large) ===
      { tag: 'a-sphere', position: '20 15 -35', radius: '6', material: 'color: #334488; metalness: 0.3; roughness: 0.7; emissive: #112244; emissiveIntensity: 0.3' },
      // Planet ring
      { tag: 'a-torus', position: '20 15 -35', rotation: '20 0 10', radius: '8', 'radius-tubular': '0.15', material: 'color: #556699; emissive: #334466; emissiveIntensity: 0.3; opacity: 0.25', animation: 'property: rotation; from: 20 0 10; to: 20 360 10; dur: 60000; easing: linear; loop: true' },
      // Planet glow
      { tag: 'a-sphere', position: '20 15 -35', radius: '7', material: 'shader: flat; color: #2244aa; opacity: 0.04' },

      // === MOON ===
      { tag: 'a-sphere', position: '-15 10 -25', radius: '2', material: 'color: #aaaacc; metalness: 0.2; roughness: 0.8; emissive: #333344; emissiveIntensity: 0.2' },

      // === ASTEROID BELT (icosahedrons + spheres, scattered) ===
      { tag: 'a-icosahedron', position: '-8 7 -18', radius: '0.4', material: 'color: #444455; metalness: 0.6; roughness: 0.5', animation: 'property: rotation; to: 360 180 90; dur: 8000; easing: linear; loop: true' },
      { tag: 'a-icosahedron', position: '10 9 -20', radius: '0.3', material: 'color: #555566; metalness: 0.7; roughness: 0.4', animation: 'property: rotation; to: 180 360 0; dur: 10000; easing: linear; loop: true' },
      { tag: 'a-icosahedron', position: '-12 11 -22', radius: '0.5', material: 'color: #3a3a4a; metalness: 0.5; roughness: 0.6', animation: 'property: rotation; to: 90 270 360; dur: 12000; easing: linear; loop: true' },
      { tag: 'a-icosahedron', position: '6 8 -16', radius: '0.25', material: 'color: #4a4a5a; metalness: 0.6; roughness: 0.5', animation: 'property: rotation; to: 270 90 180; dur: 7000; easing: linear; loop: true' },
      { tag: 'a-sphere', position: '14 10 -19', radius: '0.35', material: 'color: #555566; metalness: 0.8; roughness: 0.3', animation: 'property: rotation; to: 360 0 180; dur: 9000; easing: linear; loop: true' },
      { tag: 'a-icosahedron', position: '-5 12 -24', radius: '0.6', material: 'color: #3a3a4e; metalness: 0.5; roughness: 0.6', animation: 'property: rotation; to: 0 360 180; dur: 14000; easing: linear; loop: true' },

      // === NEBULA CLOUDS (large, colorful, very faint) ===
      { tag: 'a-sphere', position: '-18 8 -28', radius: '5', material: 'shader: flat; color: #4422aa; opacity: 0.04' },
      { tag: 'a-sphere', position: '15 12 -30', radius: '6', material: 'shader: flat; color: #aa2266; opacity: 0.03' },
      { tag: 'a-sphere', position: '0 15 -32', radius: '7', material: 'shader: flat; color: #2244aa; opacity: 0.035' },
      { tag: 'a-sphere', position: '-10 18 -26', radius: '4', material: 'shader: flat; color: #662288; opacity: 0.03' },

      // === DENSE STAR FIELD ===
      { tag: 'a-sphere', position: '-10 9 -18', radius: '0.05', material: 'shader: flat; color: #ffffff; opacity: 0.5', animation: 'property: material.opacity; from: 0.2; to: 0.6; dur: 1500; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '12 11 -16', radius: '0.04', material: 'shader: flat; color: #aaccff; opacity: 0.4', animation: 'property: material.opacity; from: 0.15; to: 0.5; dur: 1800; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '-6 14 -20', radius: '0.06', material: 'shader: flat; color: #ffffff; opacity: 0.45', animation: 'property: material.opacity; from: 0.2; to: 0.6; dur: 2200; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '8 12 -22', radius: '0.035', material: 'shader: flat; color: #ffddaa; opacity: 0.35', animation: 'property: material.opacity; from: 0.1; to: 0.5; dur: 2500; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '-15 16 -25', radius: '0.05', material: 'shader: flat; color: #ffffff; opacity: 0.3', animation: 'property: material.opacity; from: 0.15; to: 0.45; dur: 2000; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '5 18 -28', radius: '0.07', material: 'shader: flat; color: #aaaaff; opacity: 0.25', animation: 'property: material.opacity; from: 0.1; to: 0.4; dur: 3000; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '-3 10 -14', radius: '0.03', material: 'shader: flat; color: #ffffff; opacity: 0.5', animation: 'property: material.opacity; from: 0.25; to: 0.6; dur: 1600; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '16 14 -24', radius: '0.04', material: 'shader: flat; color: #ffccff; opacity: 0.35', animation: 'property: material.opacity; from: 0.15; to: 0.5; dur: 2100; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '-18 12 -17', radius: '0.045', material: 'shader: flat; color: #ffffff; opacity: 0.4', animation: 'property: material.opacity; from: 0.2; to: 0.55; dur: 1700; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '0 20 -30', radius: '0.08', material: 'shader: flat; color: #88aaff; opacity: 0.2', animation: 'property: material.opacity; from: 0.1; to: 0.35; dur: 2800; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '18 8 -15', radius: '0.03', material: 'shader: flat; color: #ffffff; opacity: 0.45', animation: 'property: material.opacity; from: 0.2; to: 0.55; dur: 1400; loop: true; dir: alternate' },
      { tag: 'a-sphere', position: '-20 15 -23', radius: '0.05', material: 'shader: flat; color: #ccddff; opacity: 0.3', animation: 'property: material.opacity; from: 0.1; to: 0.45; dur: 2600; loop: true; dir: alternate' },

      // === SPACE STATION RING ===
      { tag: 'a-torus', position: '-12 6 -20', radius: '2', 'radius-tubular': '0.06', material: 'color: #334466; metalness: 0.9; roughness: 0.1; emissive: #112244; emissiveIntensity: 0.3', animation: 'property: rotation; to: 360 0 0; dur: 15000; easing: linear; loop: true' },
      { tag: 'a-torus', position: '-12 6 -20', radius: '2.5', 'radius-tubular': '0.03', material: 'color: #4466aa; emissive: #4466aa; emissiveIntensity: 0.5; opacity: 0.2', animation: 'property: rotation; to: 0 360 0; dur: 20000; easing: linear; loop: true' },
    ],
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
    wallOpacity: 0.15,
    floorRingColor1: '#ff00ff',
    floorRingColor2: '#00ffff',
    pillarGlowColor: '#ff00ff',
    decorations: [
      // Neon building silhouettes (boxes, distant)
      { tag: 'a-box', position: '-18 4 -22', width: '3', height: '8', depth: '3', material: 'color: #110022; metalness: 0.8; roughness: 0.3; emissive: #220044; emissiveIntensity: 0.2' },
      { tag: 'a-box', position: '20 6 -25', width: '4', height: '12', depth: '4', material: 'color: #110022; metalness: 0.8; roughness: 0.3; emissive: #220044; emissiveIntensity: 0.2' },
      { tag: 'a-box', position: '-22 3 -18', width: '2', height: '6', depth: '2', material: 'color: #0a0a1a; metalness: 0.8; roughness: 0.3; emissive: #110033; emissiveIntensity: 0.2' },
      { tag: 'a-box', position: '16 5 -20', width: '2.5', height: '10', depth: '2.5', material: 'color: #110022; metalness: 0.8; roughness: 0.3; emissive: #220044; emissiveIntensity: 0.2' },
      // Neon sign strips on buildings
      { tag: 'a-plane', position: '-18 6 -20.4', width: '2.5', height: '0.15', material: 'shader: flat; color: #ff00ff; emissive: #ff00ff; emissiveIntensity: 1; opacity: 0.6', animation: 'property: material.opacity; from: 0.4; to: 0.8; dur: 1500; loop: true; dir: alternate' },
      { tag: 'a-plane', position: '20 8 -22.9', width: '3', height: '0.15', material: 'shader: flat; color: #00ffff; emissive: #00ffff; emissiveIntensity: 1; opacity: 0.6', animation: 'property: material.opacity; from: 0.3; to: 0.7; dur: 2000; loop: true; dir: alternate' },
      { tag: 'a-plane', position: '16 7 -18.7', width: '2', height: '0.1', material: 'shader: flat; color: #ff0088; emissive: #ff0088; emissiveIntensity: 1; opacity: 0.5', animation: 'property: material.opacity; from: 0.3; to: 0.6; dur: 1800; loop: true; dir: alternate' },
      // Flying neon rings
      { tag: 'a-torus', position: '0 8 -18', radius: '1', 'radius-tubular': '0.02', material: 'color: #ff00ff; emissive: #ff00ff; emissiveIntensity: 1; opacity: 0.3', animation: 'property: rotation; to: 360 360 0; dur: 8000; easing: linear; loop: true' },
    ],
  },
};

function applyTheme(sceneEl, themeId) {
  const theme = THEMES[themeId] || THEMES.cyber;
  const gc = sceneEl.querySelector('#game-content') || sceneEl;

  const sky = sceneEl.querySelector('a-sky');
  if (sky) sky.setAttribute('color', theme.sky);

  // Floor: metallic reflective
  const floors = gc.querySelectorAll(':scope > a-plane');
  if (floors[0]) floors[0].setAttribute('material', `color: ${theme.floor}; metalness: 0.8; roughness: 0.4`);

  const gridPlane = gc.querySelector('#floor-grid a-plane');
  if (gridPlane) {
    gridPlane.setAttribute('material', `color: ${theme.grid}; wireframe: true; wireframeLinewidth: 1; opacity: ${theme.gridOpacity}`);
  }

  // Walls
  const wallOpacity = theme.wallOpacity || 0.12;
  const walls = gc.querySelectorAll(':scope > a-box');
  walls.forEach(wall => {
    wall.setAttribute('material', `color: ${theme.wallColor}; opacity: ${wallOpacity}; shader: flat`);
  });

  // Floor glow rings
  const floorRings = gc.querySelectorAll(':scope > a-torus');
  if (floorRings.length >= 2) {
    if (theme.floorRingColor1) {
      floorRings[0].setAttribute('material', `color: ${theme.floorRingColor1}; emissive: ${theme.floorRingColor1}; emissiveIntensity: 0.8; opacity: 0.2`);
    }
    if (theme.floorRingColor2) {
      floorRings[1].setAttribute('material', `color: ${theme.floorRingColor2}; emissive: ${theme.floorRingColor2}; emissiveIntensity: 0.6; opacity: 0.15`);
    }
  }

  // Pillars (inside .arena-pillar entities)
  const pillarEntities = gc.querySelectorAll('.arena-pillar');
  pillarEntities.forEach(pe => {
    const cyl = pe.querySelector('a-cylinder');
    if (cyl) cyl.setAttribute('material', `color: ${theme.pillarColor}; metalness: 0.9; roughness: 0.2`);
    // Update pillar glow color
    const torus = pe.querySelector('a-torus');
    if (torus && theme.pillarGlowColor) {
      torus.setAttribute('material', `color: ${theme.pillarGlowColor}; emissive: ${theme.pillarGlowColor}; emissiveIntensity: 0.8; opacity: 0.3`);
    }
  });

  // Lights
  const existingLights = gc.querySelectorAll(':scope > a-light');
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

  // Remove previous theme decorations
  gc.querySelectorAll('.theme-decoration').forEach(el => el.remove());

  // Spawn theme-specific decorations
  if (theme.decorations) {
    theme.decorations.forEach(dec => {
      const el = document.createElement(dec.tag);
      el.classList.add('theme-decoration');
      if (dec.position) el.setAttribute('position', dec.position);
      if (dec.rotation) el.setAttribute('rotation', dec.rotation);
      if (dec.radius) el.setAttribute('radius', dec.radius);
      if (dec['radius-tubular']) el.setAttribute('radius-tubular', dec['radius-tubular']);
      if (dec.width) el.setAttribute('width', dec.width);
      if (dec.height) el.setAttribute('height', dec.height);
      if (dec.depth) el.setAttribute('depth', dec.depth);
      if (dec.material) el.setAttribute('material', dec.material);
      if (dec.animation) el.setAttribute('animation', dec.animation);
      gc.appendChild(el);
    });
  }
}

function getThemes() {
  return THEMES;
}

function getTheme(id) {
  return THEMES[id] || THEMES.cyber;
}

export { THEMES, applyTheme, getThemes, getTheme };
export default { applyTheme, getThemes, getTheme };
