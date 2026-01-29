/**
 * A-Frame component: shoot on trigger press.
 * Raycasts from controller, hits .target elements.
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
  },

  _onTrigger() {
    const raycaster = this.el.components.raycaster;
    if (!raycaster) return;

    // Force raycaster update
    raycaster.checkIntersections();
    const intersections = raycaster.intersections;

    if (intersections.length > 0) {
      const hit = intersections[0];
      const targetEl = hit.object.el;

      if (targetEl && targetEl.classList.contains('target')) {
        // Dispatch hit event
        targetEl.dispatchEvent(new CustomEvent('hit', { detail: { point: hit.point } }));

        // Visual feedback: flash laser
        this._flashLaser();
      }
    }

    // Haptic feedback
    const tracked = this.el.components['oculus-touch-controls']
      || this.el.components['tracked-controls'];
    if (tracked && tracked.controller) {
      try {
        tracked.controller.gamepad?.hapticActuators?.[0]?.pulse(0.3, 50);
      } catch (e) { /* ignore */ }
    }
  },

  _flashLaser() {
    const raycaster = this.el.components.raycaster;
    if (!raycaster) return;

    // Brief color flash
    const line = this.el.getAttribute('raycaster');
    this.el.setAttribute('raycaster', 'lineColor', '#ffffff');
    setTimeout(() => {
      this.el.setAttribute('raycaster', 'lineColor', line?.lineColor || '#44aaff');
    }, 80);
  },
});
