/**
 * A-Frame component: particle burst effect on target destruction.
 * Spawns small fragments that fly outward and fade out.
 *
 * Usage: Emitted programmatically from target-hit.js
 */
AFRAME.registerComponent('particle-burst', {
  schema: {
    color: { type: 'color', default: '#ffffff' },
    count: { type: 'int', default: 10 },
    size: { type: 'number', default: 0.04 },
    speed: { type: 'number', default: 3 },
    lifetime: { type: 'int', default: 400 },
  },

  init() {
    const { color, count, size, speed, lifetime } = this.data;
    const pos = this.el.object3D.position;

    for (let i = 0; i < count; i++) {
      const frag = document.createElement('a-sphere');
      frag.setAttribute('radius', String(size * (0.6 + Math.random() * 0.8)));
      frag.setAttribute('material', `shader: flat; color: ${color}; opacity: 0.9`);
      frag.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);

      const vx = (Math.random() - 0.5) * speed;
      const vy = (Math.random() - 0.2) * speed;
      const vz = (Math.random() - 0.5) * speed;
      const dist = Math.sqrt(vx * vx + vy * vy + vz * vz) || 1;
      const norm = speed / dist;

      frag.setAttribute('animation__move', {
        property: 'position',
        to: `${pos.x + vx * norm * 0.3} ${pos.y + vy * norm * 0.3} ${pos.z + vz * norm * 0.3}`,
        dur: lifetime,
        easing: 'easeOutQuad',
      });

      frag.setAttribute('animation__fade', {
        property: 'material.opacity',
        to: 0,
        dur: lifetime,
        easing: 'easeInQuad',
      });

      frag.setAttribute('animation__shrink', {
        property: 'scale',
        to: '0 0 0',
        dur: lifetime,
        easing: 'easeInQuad',
      });

      this.el.sceneEl.appendChild(frag);

      setTimeout(() => {
        if (frag.parentNode) frag.parentNode.removeChild(frag);
      }, lifetime + 50);
    }

    // Self-remove the burst entity
    setTimeout(() => {
      if (this.el.parentNode) this.el.parentNode.removeChild(this.el);
    }, lifetime + 100);
  },
});
