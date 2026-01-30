/**
 * A-Frame component: handles target being hit.
 * Supports HP (multi-hit), damage numbers, and particle bursts.
 *
 * Usage: <a-entity target-hit="hp: 2; targetType: heavy">
 */
AFRAME.registerComponent('target-hit', {
  schema: {
    hp: { type: 'int', default: 1 },
    targetType: { type: 'string', default: 'standard' },
  },

  init() {
    this._onHit = this._onHit.bind(this);
    this._onClick = this._onClick.bind(this);

    this.el.addEventListener('hit', this._onHit);
    this.el.addEventListener('click', this._onClick);
    this._destroyed = false;
    this._hp = this.data.hp;
  },

  remove() {
    this.el.removeEventListener('hit', this._onHit);
    this.el.removeEventListener('click', this._onClick);
  },

  _onClick() {
    this._onHit({ detail: { damage: 1 } });
  },

  _onHit(evt) {
    if (this._destroyed) return;

    const damage = evt?.detail?.damage || 1;
    this._hp -= damage;

    if (this._hp > 0) {
      // Flash on hit but don't destroy
      const origColor = this.el.getAttribute('material')?.color || '#ffffff';
      this.el.setAttribute('material', 'color', '#ffffff');
      setTimeout(() => {
        if (!this._destroyed) {
          this.el.setAttribute('material', 'color', origColor);
        }
      }, 80);
      // Notify boss health update
      document.dispatchEvent(new CustomEvent('boss-damaged', {
        detail: { hp: this._hp, maxHp: this.data.hp, el: this.el },
      }));
      return;
    }

    this._destroyed = true;
    const color = this.el.getAttribute('material')?.color || '#ffffff';
    const pos = this.el.object3D.position;

    // Spawn particle burst
    this._spawnParticles(color, pos);

    // Explosion effect
    this.el.removeAttribute('animation__float');
    this.el.removeAttribute('animation__move');
    this.el.setAttribute('material', 'color', '#ffffff');
    this.el.setAttribute('material', 'emissive', '#ffffff');
    this.el.setAttribute('material', 'emissiveIntensity', '1.0');
    this.el.setAttribute('animation__explode', {
      property: 'scale',
      to: '1.5 1.5 1.5',
      dur: 100,
      easing: 'easeOutQuad',
    });

    setTimeout(() => {
      this.el.setAttribute('animation__shrink', {
        property: 'scale',
        to: '0 0 0',
        dur: 150,
        easing: 'easeInBack',
      });
    }, 100);

    setTimeout(() => {
      this.el.emit('destroyed', { damage, color, position: { x: pos.x, y: pos.y, z: pos.z } });
      if (this.el.parentNode) {
        this.el.parentNode.removeChild(this.el);
      }
    }, 300);
  },

  _spawnParticles(color, pos) {
    const type = this.data.targetType;
    const counts = { standard: 8, heavy: 15, bonus: 12, decoy: 6, speed: 10 };
    const count = counts[type] || 8;

    const burstColor = type === 'bonus' ? '#ffd700' : type === 'decoy' ? '#661111' : color;

    const burst = document.createElement('a-entity');
    burst.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    burst.setAttribute('particle-burst', `color: ${burstColor}; count: ${count}; size: 0.04; speed: 3; lifetime: 400`);
    this.el.sceneEl.appendChild(burst);
  },
});
