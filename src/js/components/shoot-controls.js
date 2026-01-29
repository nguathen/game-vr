/**
 * A-Frame component: shoot on trigger press.
 * Supports weapon system with spread, cooldown, and damage multiplier.
 *
 * Usage: <a-entity shoot-controls="hand: right">
 */
AFRAME.registerComponent('shoot-controls', {
  schema: {
    hand: { type: 'string', default: 'right' },
  },

  init() {
    this._onTrigger = this._onTrigger.bind(this);
    this.el.addEventListener('triggerdown', this._onTrigger);
  },

  remove() {
    this.el.removeEventListener('triggerdown', this._onTrigger);
    if (this._flashTimeout) clearTimeout(this._flashTimeout);
  },

  _getWeapon() {
    // Access weapon system if available (loaded as ES module)
    return window.__weaponSystem?.current || null;
  },

  _onTrigger() {
    const weapon = this._getWeapon();

    // Check fire rate cooldown
    if (weapon && window.__weaponSystem) {
      const fired = window.__weaponSystem.fire();
      if (!fired) return;
    }

    const raycaster = this.el.components.raycaster;
    if (!raycaster) return;

    raycaster.checkIntersections();
    const intersections = raycaster.intersections;

    if (weapon && weapon.projectiles > 1 && weapon.spread > 0) {
      // Shotgun-style: check all targets in range and hit those within spread cone
      this._shotgunHit(raycaster, weapon);
    } else {
      // Single-shot weapons
      if (intersections.length > 0) {
        const hit = intersections[0];
        const targetEl = hit.object.el;
        if (targetEl && targetEl.classList.contains('target')) {
          const damage = weapon?.damage || 1;
          targetEl.dispatchEvent(new CustomEvent('hit', {
            detail: { point: hit.point, damage },
          }));
          this._flashLaser(weapon);
        }
      }
    }

    // Notify shot fired (for accuracy tracking)
    document.dispatchEvent(new CustomEvent('shot-fired'));

    // Haptic feedback
    const intensity = weapon?.hapticIntensity || 0.3;
    const duration = weapon?.hapticDuration || 50;
    const tracked = this.el.components['oculus-touch-controls']
      || this.el.components['tracked-controls'];
    if (tracked && tracked.controller) {
      try {
        tracked.controller.gamepad?.hapticActuators?.[0]?.pulse(intensity, duration);
      } catch (e) { /* ignore */ }
    }
  },

  _shotgunHit(raycaster, weapon) {
    // Get all targets in scene
    const targets = document.querySelectorAll('.target');
    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();

    // Get controller world position and direction
    this.el.object3D.getWorldPosition(origin);
    this.el.object3D.getWorldDirection(direction);
    direction.negate(); // A-Frame looks down -Z

    targets.forEach(targetEl => {
      const targetPos = new THREE.Vector3();
      targetEl.object3D.getWorldPosition(targetPos);

      const toTarget = targetPos.clone().sub(origin);
      const dist = toTarget.length();
      if (dist > 50) return;

      toTarget.normalize();
      const angle = toTarget.angleTo(direction);

      if (angle < weapon.spread) {
        targetEl.dispatchEvent(new CustomEvent('hit', {
          detail: { point: targetPos, damage: weapon.damage },
        }));
      }
    });

    this._flashLaser(weapon);
  },

  _flashLaser(weapon) {
    const color = weapon?.laserColor || '#ffffff';
    this.el.setAttribute('raycaster', 'lineColor', '#ffffff');
    if (this._flashTimeout) clearTimeout(this._flashTimeout);
    this._flashTimeout = setTimeout(() => {
      this._flashTimeout = null;
      this.el.setAttribute('raycaster', 'lineColor', color);
    }, 80);
  },
});
